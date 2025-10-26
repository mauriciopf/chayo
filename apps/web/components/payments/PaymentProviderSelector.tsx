'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, CreditCard, AlertCircle, ExternalLink, ChevronRight } from 'lucide-react'

interface PaymentProvider {
  id: string
  provider_type: string
  provider_account_id?: string
  is_active: boolean
  is_default: boolean
  created_at: string
}

interface PaymentProviderSelectorProps {
  organizationId: string
  selectedProviderId?: string | null
  onProviderSelected: (providerId: string | null) => void
  onConfigureClick: () => void
  showLabel?: boolean
  compact?: boolean
}

/**
 * Provider-agnostic payment provider selector
 * Works with any providers configured in payment_providers table
 */
export default function PaymentProviderSelector({
  organizationId,
  selectedProviderId,
  onProviderSelected,
  onConfigureClick,
  showLabel = true,
  compact = false
}: PaymentProviderSelectorProps) {
  const [providers, setProviders] = useState<PaymentProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProviders()
  }, [organizationId])

  const loadProviders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/organizations/${organizationId}/payment-providers`)
      
      if (!response.ok) {
        throw new Error('Failed to load payment providers')
      }

      const data = await response.json()
      const activeProviders = (data.providers || []).filter((p: PaymentProvider) => p.is_active)
      setProviders(activeProviders)

      // Auto-select default provider if none selected
      if (!selectedProviderId && activeProviders.length > 0) {
        const defaultProvider = activeProviders.find((p: PaymentProvider) => p.is_default) || activeProviders[0]
        if (defaultProvider) {
          onProviderSelected(defaultProvider.id)
        }
      }
    } catch (err) {
      console.error('Error loading providers:', err)
      setError('Error al cargar proveedores de pago')
    } finally {
      setLoading(false)
    }
  }

  const getProviderIcon = (providerType: string) => {
    // Provider-agnostic icons - uses first letter as fallback
    const icons: Record<string, string> = {
      stripe: '💳',
      paypal: '💰',
      square: '⬛',
      mercadopago: '💵',
      razorpay: '⚡',
    }
    return icons[providerType.toLowerCase()] || '💳'
  }

  const getProviderDisplayName = (providerType: string) => {
    // Capitalize first letter
    return providerType.charAt(0).toUpperCase() + providerType.slice(1).toLowerCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
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
    )
  }

  // No providers configured
  if (providers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-center"
      >
        <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Configura un Método de Pago
        </h3>
        <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
          Para habilitar pagos en tus productos, primero conecta un proveedor de pago como Stripe, PayPal, o Square.
        </p>
        <button
          type="button"
          onClick={onConfigureClick}
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
        >
          <CreditCard className="h-5 w-5" />
          Configurar Proveedor de Pago
          <ExternalLink className="h-4 w-4" />
        </button>
      </motion.div>
    )
  }

  // Compact mode - dropdown style
  if (compact) {
    return (
      <div>
        {showLabel && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proveedor de Pago
          </label>
        )}
        <select
          value={selectedProviderId || ''}
          onChange={(e) => onProviderSelected(e.target.value || null)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        >
          <option value="">Sin proveedor</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {getProviderDisplayName(provider.provider_type)}
              {provider.is_default && ' (Predeterminado)'}
            </option>
          ))}
        </select>
      </div>
    )
  }

  // Full mode - card selection
  return (
    <div>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Selecciona el Proveedor de Pago
        </label>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {providers.map((provider) => {
          const isSelected = provider.id === selectedProviderId
          
          return (
            <motion.button
              key={provider.id}
              onClick={() => onProviderSelected(provider.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative p-4 rounded-xl border-2 text-left transition-all
                ${isSelected 
                  ? 'border-purple-500 bg-purple-50 shadow-lg' 
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                }
              `}
            >
              {/* Selected check mark */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute top-3 right-3"
                  >
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Provider info */}
              <div className="flex items-center gap-3">
                <div className="text-3xl">
                  {getProviderIcon(provider.provider_type)}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>
                    {getProviderDisplayName(provider.provider_type)}
                  </h4>
                  {provider.is_default && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                      Predeterminado
                    </span>
                  )}
                </div>
              </div>

              {/* Account info if available */}
              {provider.provider_account_id && (
                <p className="text-xs text-gray-500 mt-2 truncate">
                  {provider.provider_account_id}
                </p>
              )}
            </motion.button>
          )
        })}

        {/* Add new provider option */}
        <motion.button
          type="button"
          onClick={onConfigureClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="p-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-purple-600"
        >
          <CreditCard className="h-5 w-5" />
          <span className="text-sm font-medium">Agregar Proveedor</span>
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>

      {/* Helpful hint */}
      <p className="text-xs text-gray-500 mt-3 flex items-start gap-1">
        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
        <span>Los clientes verán el checkout del proveedor seleccionado al pagar</span>
      </p>
    </div>
  )
}

