'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, DollarSign, Settings, Check, Loader2, AlertCircle, ExternalLink } from 'lucide-react'

interface PaymentProvider {
  id: string
  provider_type: string
  provider_account_id?: string
  is_active: boolean
  is_default: boolean
  created_at: string
}

interface PaymentProviderConfigModalProps {
  organizationId: string
  isOpen: boolean
  onClose: () => void
  onProviderAdded?: () => void
}

/**
 * Modal for configuring payment providers
 * Allows users to connect Stripe, PayPal, or Square
 */
export default function PaymentProviderConfigModal({
  organizationId,
  isOpen,
  onClose,
  onProviderAdded
}: PaymentProviderConfigModalProps) {
  const [providers, setProviders] = useState<PaymentProvider[]>([])
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Provider configurations
  const providerTypes = [
    {
      id: 'stripe',
      name: 'Stripe',
      icon: <CreditCard className="w-8 h-8" />,
      description: 'Acepta pagos con tarjeta de crédito, débito y más',
      color: 'from-blue-500 to-purple-600',
      authUrl: '/api/stripe/oauth',
      emoji: '💳'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: <DollarSign className="w-8 h-8" />,
      description: 'Recibe pagos a través de PayPal',
      color: 'from-blue-600 to-blue-800',
      authUrl: '/api/paypal/oauth',
      emoji: '💰'
    },
    {
      id: 'square',
      name: 'Square',
      icon: <Settings className="w-8 h-8" />,
      description: 'Procesa pagos con Square',
      color: 'from-gray-700 to-gray-900',
      authUrl: '/api/square/oauth',
      emoji: '⬛'
    }
  ]

  useEffect(() => {
    if (isOpen) {
      loadProviders()
    }
  }, [isOpen, organizationId])

  const loadProviders = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/organizations/${organizationId}/payment-providers`)
      
      if (!response.ok) {
        throw new Error('Failed to load payment providers')
      }

      const data = await response.json()
      setProviders(data.providers || [])
    } catch (err) {
      console.error('Error loading providers:', err)
      setError('Error al cargar proveedores')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectProvider = async (providerType: string) => {
    try {
      setConnecting(providerType)
      setError(null)
      
      const provider = providerTypes.find(p => p.id === providerType)
      if (!provider) return
      
      const response = await fetch(provider.authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to connect to ${provider.name}`)
      }

      const { onboardingUrl, authUrl } = await response.json()
      
      // Store callback info
      localStorage.setItem('payment_provider_callback', JSON.stringify({
        organizationId,
        providerType,
        timestamp: Date.now()
      }))
      
      // Redirect to provider OAuth
      window.location.href = onboardingUrl || authUrl
      
    } catch (error) {
      console.error(`Error connecting to ${providerType}:`, error)
      setError(error instanceof Error ? error.message : 'Error al conectar proveedor')
      setConnecting(null)
    }
  }

  const isProviderConnected = (providerType: string) => {
    return providers.some(p => p.provider_type === providerType && p.is_active)
  }

  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
      onClick={(e) => {
        // Close when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Configurar Proveedores de Pago
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Conecta un proveedor para habilitar pagos en tus productos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">{error}</p>
                <button
                  onClick={loadProviders}
                  className="text-sm text-red-600 hover:text-red-700 underline mt-1"
                >
                  Intentar de nuevo
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {providerTypes.map((provider) => {
                const connected = isProviderConnected(provider.id)
                const isConnecting = connecting === provider.id

                return (
                  <motion.button
                    key={provider.id}
                    type="button"
                    onClick={() => !connected && !isConnecting && handleConnectProvider(provider.id)}
                    disabled={connected || isConnecting}
                    whileHover={{ scale: connected ? 1 : 1.02 }}
                    whileTap={{ scale: connected ? 1 : 0.98 }}
                    className={`
                      w-full relative p-6 rounded-xl border-2 transition-all text-left
                      ${connected 
                        ? 'border-green-500 bg-green-50 cursor-default' 
                        : isConnecting
                        ? 'border-purple-400 bg-purple-50 cursor-wait'
                        : 'border-gray-200 bg-white hover:border-purple-400 hover:shadow-lg cursor-pointer'
                      }
                    `}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`
                        flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br ${provider.color}
                        flex items-center justify-center text-white shadow-lg
                      `}>
                        {provider.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {provider.name}
                          </h3>
                          {connected && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Check className="h-3 w-3 mr-1" />
                              Conectado
                            </span>
                          )}
                          {isConnecting && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Conectando...
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {provider.description}
                        </p>
                        
                        {/* Status indicator */}
                        {!connected && !isConnecting && (
                          <div className="flex items-center gap-2 mt-3 text-purple-600">
                            <ExternalLink className="h-4 w-4" />
                            <span className="text-sm font-medium">Haz clic para conectar</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">¿Por qué conectar un proveedor?</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Recibe pagos directamente en tu cuenta</li>
                  <li>Genera links de pago automáticamente</li>
                  <li>Tus clientes pagan de forma segura</li>
                  <li>Compatible con todos los métodos de pago</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {providers.length > 0 
                ? `${providers.length} ${providers.length === 1 ? 'proveedor conectado' : 'proveedores conectados'}`
                : 'Ningún proveedor conectado'
              }
            </p>
            <button
              type="button"
              onClick={() => {
                onProviderAdded?.()
                onClose()
              }}
              className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )

  // Render using portal to avoid event bubbling issues
  return createPortal(modalContent, document.body)
}

