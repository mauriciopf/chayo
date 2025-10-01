'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, ExternalLink, Settings } from 'lucide-react'
import ChayoAppointmentsList from './ChayoAppointmentsList'

interface AppointmentProvider {
  id: string
  name: string
  type: 'embed' | 'link'
  description: string
  setupRequired: boolean
  hasOAuth: boolean
}

interface AppointmentToolConfigProps {
  organizationId: string
  isEnabled: boolean
  onSettingsChange?: () => void
}

export default function AppointmentToolConfig({ 
  organizationId, 
  isEnabled, 
  onSettingsChange 
}: AppointmentToolConfigProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>('custom')
  const [providerUrl, setProviderUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const providers: AppointmentProvider[] = [
    {
      id: 'custom',
      name: 'Chayo Appointments',
      type: 'embed',
      description: 'Usa nuestro sistema de reservas integrado; no requiere configuración',
      setupRequired: false,
      hasOAuth: false
    },
    {
      id: 'calendly',
      name: 'Calendly',
      type: 'embed',
      description: 'Conecta tu cuenta de Calendly para integrar tus reservas sin fricciones',
      setupRequired: true,
      hasOAuth: true
    },
    {
      id: 'vagaro',
      name: 'Vagaro',
      type: 'link',
      description: 'Comparte tu enlace de reservas de Vagaro (OAuth no disponible)',
      setupRequired: true,
      hasOAuth: false
    },
    {
      id: 'square',
      name: 'Square Appointments',
      type: 'link',
      description: 'Comparte tu enlace de reservas de Square (más simple que configurar OAuth)',
      setupRequired: true,
      hasOAuth: false
    }
  ]

  // Load existing settings when component mounts
  useEffect(() => {
    if (isEnabled) {
      loadSettings()
    }
  }, [isEnabled, organizationId])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/organizations/${organizationId}/appointment-settings`)
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSelectedProvider(data.settings.provider || 'calendly')
          setProviderUrl(data.settings.provider_url || '')
        }
      }
    } catch (error) {
      console.error('Error loading appointment settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectProvider = async (provider: string) => {
    setSaving(true)
    try {
      // Initialize OAuth flow
      const response = await fetch(`/api/organizations/${organizationId}/appointment-auth/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: window.location.href
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.manualSetup) {
          // Provider doesn't have OAuth configured yet
          alert(`La integración OAuth de ${provider.charAt(0).toUpperCase() + provider.slice(1)} aún no está configurada. Por favor contacta a soporte para recibir ayuda.`)
        } else {
          throw new Error(errorData.message || 'No se pudo iniciar la conexión con el proveedor')
        }
        return
      }

      const { authUrl } = await response.json()
      
      // Redirect to provider's OAuth page
      window.location.href = authUrl
      
    } catch (error) {
      console.error('Error connecting to provider:', error)
      alert('No se pudo conectar con el proveedor. Intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnectProvider = async () => {
    if (!confirm('¿Seguro que deseas desconectar este proveedor? Esto deshabilitará la reserva de citas.')) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/organizations/${organizationId}/appointment-settings`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('No se pudo desconectar al proveedor')
      }

      setProviderUrl('')
      onSettingsChange?.()
      alert('¡Proveedor desconectado correctamente!')
      
    } catch (error) {
      console.error('Error disconnecting provider:', error)
      alert('No se pudo desconectar al proveedor. Intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    // Validate based on provider type
    const provider = providers.find(p => p.id === selectedProvider)
    
    if (selectedProvider !== 'custom') {
      if (provider?.hasOAuth) {
        // OAuth provider (Calendly) - URL should come from OAuth connection
        if (!providerUrl) {
          alert('Conecta tu cuenta de Calendly primero')
          return
        }
      } else {
        // Manual URL providers (Vagaro, Square) - URL is required
        if (!providerUrl) {
          alert('Ingresa primero tu URL de reservas')
          return
        }
      }
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/organizations/${organizationId}/appointment-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: selectedProvider,
          providerUrl: selectedProvider !== 'custom' ? providerUrl : null,
        }),
      })

      if (!response.ok) {
        throw new Error('No se pudo guardar la configuración de citas')
      }

      onSettingsChange?.()
      alert('¡Configuración de citas guardada exitosamente!')
    } catch (error) {
      console.error('Error saving appointment settings:', error)
      alert('No se pudo guardar la configuración. Intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  if (!isEnabled) {
    return (
      <div 
        className="p-4 rounded-lg border"
        style={{ 
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-primary)'
        }}
      >
        <p 
          className="text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Activa la herramienta de Citas para configurar las opciones de reserva.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div 
        className="border-t pt-6"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <div className="text-center py-4">
          <div 
            className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto"
            style={{ borderColor: 'var(--accent-primary)' }}
          ></div>
          <p 
            className="text-sm mt-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cargando configuración de citas...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="border-t pt-6"
      style={{ borderColor: 'var(--border-primary)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
        <h3 
          className="font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          Configuración de reservas de citas
        </h3>
      </div>

      {/* Provider Selection */}
      <div className="mb-6">
        <h4 
          className="font-medium mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          Elige tu servicio de reservas:
        </h4>
        <div className="space-y-3">
          {providers.map((provider) => (
            <label 
              key={provider.id} 
              className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors"
              style={{ 
                borderColor: 'var(--border-primary)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <input
                type="radio"
                name="provider"
                value={provider.id}
                checked={selectedProvider === provider.id}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span 
                    className="font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {provider.name}
                  </span>
                  {provider.type === 'embed' && (
                    <span 
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{ 
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      Integrado
                    </span>
                  )}
                  {provider.type === 'link' && (
                    <span 
                      className="px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1"
                      style={{ 
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Enlace
                    </span>
                  )}
                </div>
                <p 
                  className="text-sm mt-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {provider.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Provider Setup - OAuth vs Manual URL */}
      {selectedProvider !== 'custom' && (
        <div className="mb-6">
          {providers.find(p => p.id === selectedProvider)?.hasOAuth ? (
            // OAuth Flow (Calendly)
            <div>
              <h4 
                className="font-medium mb-3"
                style={{ color: 'var(--text-primary)' }}
              >
                Conecta tu cuenta de {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}
              </h4>
              
              {/* Connection Status */}
              <div 
                className="mb-4 p-3 border rounded-lg"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-primary)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${providerUrl ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm font-medium text-gray-900">
                      Cuenta de {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    providerUrl 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {providerUrl ? 'Conectada' : 'Sin conexión'}
                  </span>
                </div>
                {providerUrl && (
                  <div className="mt-2 text-xs text-gray-500 truncate">
                    URL conectada: {providerUrl}
                  </div>
                )}
              </div>

              {/* Connect Button */}
              <button
                onClick={() => handleConnectProvider(selectedProvider)}
                disabled={saving}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  providerUrl
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {saving ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Conectando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    {providerUrl 
                      ? `Volver a conectar con ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}` 
                      : `Conectar con ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}`}
                  </div>
                )}
              </button>

              {/* Disconnect Button (if connected) */}
              {providerUrl && (
                <button
                  onClick={() => handleDisconnectProvider()}
                  className="w-full mt-2 py-2 px-4 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium transition-colors"
                >
                  Desconectar cuenta
                </button>
              )}

              <p className="text-xs text-gray-500 mt-2">
                Conecta tu cuenta de Calendly para obtener tu enlace de reservas automáticamente y habilitar la integración sin fricciones.
              </p>
            </div>
          ) : (
            // Manual URL Entry (Vagaro, Square)
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Configura tu integración con {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}</h4>
              
              {/* Setup Instructions */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">!</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-900 mb-2">Instrucciones de configuración:</h5>
                    <div className="text-sm text-blue-800 space-y-1">
                      {selectedProvider === 'vagaro' && (
                        <>
                          <p>1. Inicia sesión en tu cuenta empresarial de Vagaro</p>
                          <p>2. Ve a <strong>Settings → Website & Widgets</strong></p>
                          <p>3. Copia tu URL pública de reservas</p>
                          <p>4. Paste it in the field below</p>
                        </>
                      )}
                      {selectedProvider === 'square' && (
                        <>
                          <p>1. Inicia sesión en tu panel de Square</p>
                          <p>2. Ve a <strong>Appointments → Settings</strong></p>
                          <p>3. Busca tu URL pública de reservas</p>
                          <p>4. Paste it in the field below</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* URL Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedProvider === 'vagaro' && 'Tu URL de reservas de Vagaro'}
                  {selectedProvider === 'square' && 'Tu URL de Square Appointments'}
                </label>
                <input
                  type="url"
                  value={providerUrl}
                  onChange={(e) => setProviderUrl(e.target.value)}
                  placeholder={
                    selectedProvider === 'vagaro' ? 'https://www.vagaro.com/your-business' :
                    selectedProvider === 'square' ? 'https://squareup.com/appointments/book/tu-negocio' :
                    'Ingresa tu URL de reservas'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Connection Status */}
              <div className="mb-4 p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${providerUrl ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm font-medium text-gray-900">Status</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    providerUrl 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {providerUrl ? 'Listo para guardar' : 'URL requerida'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                {selectedProvider === 'vagaro' && 'Las personas serán redirigidas a tu página de reservas de Vagaro para agendar sus citas'}
                {selectedProvider === 'square' && 'Las personas serán redirigidas a tu página de reservas de Square para agendar sus citas'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Calendly System Info */}
      {selectedProvider === 'calendly' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Integración con Calendly</h4>
          <p className="text-sm text-green-800 mb-3">
            El widget de Calendly se integrará directamente en tu página de citas. Proporciona tu URL de Calendly para conectar la cuenta.
          </p>
          <div className="text-xs text-green-700">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3" />
              <span>Experiencia de reservas integrada y sin fricciones</span>
            </div>
            <div className="flex items-center gap-1">
              <Settings className="w-3 h-3" />
              <span>Gestiona tu disponibilidad desde tu cuenta de Calendly</span>
            </div>
          </div>
        </div>
      )}

      {/* Vagaro System Info */}
      {selectedProvider === 'vagaro' && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-2">Integración con Vagaro</h4>
          <p className="text-sm text-purple-800 mb-3">
            Las personas serán redirigidas a tu página de reservas de Vagaro para agendar sus citas.
          </p>
          <div className="text-xs text-purple-700">
            <div className="flex items-center gap-1 mb-1">
              <ExternalLink className="w-3 h-3" />
              <span>Redirige a tu página empresarial de Vagaro</span>
            </div>
            <div className="flex items-center gap-1">
              <Settings className="w-3 h-3" />
              <span>Gestiona servicios y disponibilidad desde tu cuenta de Vagaro</span>
            </div>
          </div>
        </div>
      )}

      {/* Square System Info */}
      {selectedProvider === 'square' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Integración con Square Appointments</h4>
          <p className="text-sm text-yellow-800 mb-3">
            Las personas serán redirigidas a tu página de Square Appointments para agendar sus citas.
          </p>
          <div className="text-xs text-yellow-700">
            <div className="flex items-center gap-1 mb-1">
              <ExternalLink className="w-3 h-3" />
              <span>Redirige a tu página empresarial de Square</span>
            </div>
            <div className="flex items-center gap-1">
              <Settings className="w-3 h-3" />
              <span>Gestiona servicios y disponibilidad desde tu cuenta de Square</span>
            </div>
          </div>
        </div>
      )}

      {/* Custom System Info & Management */}
      {selectedProvider === 'custom' && (
        <div className="mb-6 space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Chayo Appointments - Sistema Integrado</h4>
            <p className="text-sm text-blue-800 mb-3">
              Sistema de calendario integrado con gestión automática de disponibilidad, 
              confirmaciones por email e integración perfecta con el chat.
            </p>
            <div className="text-xs text-blue-700">
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3" />
                <span>Sin configuraciones externas necesarias</span>
              </div>
              <div className="flex items-center gap-1">
                <Settings className="w-3 h-3" />
                <span>Completamente personalizable para tu negocio</span>
              </div>
            </div>
          </div>

          {/* Appointments Management */}
          <ChayoAppointmentsList organizationId={organizationId} />
        </div>
      )}

      {/* Save Button - Show based on provider requirements */}
      {(() => {
        const provider = providers.find(p => p.id === selectedProvider)
        const showSaveButton = selectedProvider === 'custom' || 
          (provider?.hasOAuth && providerUrl) || // OAuth provider connected
          (!provider?.hasOAuth && providerUrl)   // Manual URL provider with URL entered
        
        return showSaveButton && (
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                'Guardar configuración'
              )}
            </button>
          </div>
        )
      })()}
    </div>
  )
}
