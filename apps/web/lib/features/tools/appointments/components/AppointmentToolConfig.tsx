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
      description: 'Use our built-in calendar booking system - no setup required',
      setupRequired: false,
      hasOAuth: false
    },
    {
      id: 'calendly',
      name: 'Calendly',
      type: 'embed',
      description: 'Connect your Calendly account for seamless booking integration',
      setupRequired: true,
      hasOAuth: true
    },
    {
      id: 'vagaro',
      name: 'Vagaro',
      type: 'link',
      description: 'Share your Vagaro booking link (no OAuth available)',
      setupRequired: true,
      hasOAuth: false
    },
    {
      id: 'square',
      name: 'Square Appointments',
      type: 'link',
      description: 'Share your Square booking link (simpler than OAuth setup)',
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
          alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth is not yet configured. Please contact support for setup assistance.`)
        } else {
          throw new Error(errorData.message || 'Failed to initialize provider connection')
        }
        return
      }

      const { authUrl } = await response.json()
      
      // Redirect to provider's OAuth page
      window.location.href = authUrl
      
    } catch (error) {
      console.error('Error connecting to provider:', error)
      alert('Failed to connect to provider. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnectProvider = async () => {
    if (!confirm('Are you sure you want to disconnect this provider? This will disable appointment booking.')) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/organizations/${organizationId}/appointment-settings`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect provider')
      }

      setProviderUrl('')
      onSettingsChange?.()
      alert('Provider disconnected successfully!')
      
    } catch (error) {
      console.error('Error disconnecting provider:', error)
      alert('Failed to disconnect provider. Please try again.')
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
          alert('Please connect your Calendly account first')
          return
        }
      } else {
        // Manual URL providers (Vagaro, Square) - URL is required
        if (!providerUrl) {
          alert('Please enter your booking URL first')
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
        throw new Error('Failed to save appointment settings')
      }

      onSettingsChange?.()
      alert('Appointment settings saved successfully!')
    } catch (error) {
      console.error('Error saving appointment settings:', error)
      alert('Failed to save settings. Please try again.')
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
          Enable the Appointments tool above to configure booking options.
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
            Loading appointment settings...
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
          Appointment Booking Configuration
        </h3>
      </div>

      {/* Provider Selection */}
      <div className="mb-6">
        <h4 
          className="font-medium mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          Choose your booking service:
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
                      Embedded
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
                      Link
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
                Connect Your {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} Account
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
                      {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} Account
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    providerUrl 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {providerUrl ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                {providerUrl && (
                  <div className="mt-2 text-xs text-gray-500 truncate">
                    Connected URL: {providerUrl}
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
                    Connecting...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    {providerUrl ? `Reconnect to ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}` : `Connect to ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}`}
                  </div>
                )}
              </button>

              {/* Disconnect Button (if connected) */}
              {providerUrl && (
                <button
                  onClick={() => handleDisconnectProvider()}
                  className="w-full mt-2 py-2 px-4 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium transition-colors"
                >
                  Disconnect Account
                </button>
              )}

              <p className="text-xs text-gray-500 mt-2">
                Connect your Calendly account to automatically get your booking link and enable seamless embedding.
              </p>
            </div>
          ) : (
            // Manual URL Entry (Vagaro, Square)
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Setup Your {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} Integration</h4>
              
              {/* Setup Instructions */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">!</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-900 mb-2">Setup Instructions:</h5>
                    <div className="text-sm text-blue-800 space-y-1">
                      {selectedProvider === 'vagaro' && (
                        <>
                          <p>1. Sign in to your Vagaro business account</p>
                          <p>2. Go to <strong>Settings → Website & Widgets</strong></p>
                          <p>3. Copy your public booking URL</p>
                          <p>4. Paste it in the field below</p>
                        </>
                      )}
                      {selectedProvider === 'square' && (
                        <>
                          <p>1. Sign in to your Square Dashboard</p>
                          <p>2. Go to <strong>Appointments → Settings</strong></p>
                          <p>3. Find your public booking URL</p>
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
                  {selectedProvider === 'vagaro' && 'Your Vagaro Booking URL'}
                  {selectedProvider === 'square' && 'Your Square Appointments URL'}
                </label>
                <input
                  type="url"
                  value={providerUrl}
                  onChange={(e) => setProviderUrl(e.target.value)}
                  placeholder={
                    selectedProvider === 'vagaro' ? 'https://www.vagaro.com/your-business' :
                    selectedProvider === 'square' ? 'https://squareup.com/appointments/book/your-location' :
                    'Enter your booking URL'
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
                    {providerUrl ? 'Ready to Save' : 'URL Required'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                {selectedProvider === 'vagaro' && 'Clients will be redirected to your Vagaro booking page to schedule appointments'}
                {selectedProvider === 'square' && 'Clients will be redirected to your Square booking page to schedule appointments'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Calendly System Info */}
      {selectedProvider === 'calendly' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Calendly Integration</h4>
          <p className="text-sm text-green-800 mb-3">
            Your Calendly booking widget will be embedded directly in your appointment page. Provide your Calendly URL to connect your account.
          </p>
          <div className="text-xs text-green-700">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3" />
              <span>Seamless embedded booking experience</span>
            </div>
            <div className="flex items-center gap-1">
              <Settings className="w-3 h-3" />
              <span>Manage your availability in your Calendly account</span>
            </div>
          </div>
        </div>
      )}

      {/* Vagaro System Info */}
      {selectedProvider === 'vagaro' && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-2">Vagaro Integration</h4>
          <p className="text-sm text-purple-800 mb-3">
            Clients will be redirected to your Vagaro booking page to schedule appointments.
          </p>
          <div className="text-xs text-purple-700">
            <div className="flex items-center gap-1 mb-1">
              <ExternalLink className="w-3 h-3" />
              <span>Redirects to your Vagaro business page</span>
            </div>
            <div className="flex items-center gap-1">
              <Settings className="w-3 h-3" />
              <span>Manage services and availability in your Vagaro account</span>
            </div>
          </div>
        </div>
      )}

      {/* Square System Info */}
      {selectedProvider === 'square' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Square Appointments Integration</h4>
          <p className="text-sm text-yellow-800 mb-3">
            Clients will be redirected to your Square Appointments booking page to schedule appointments.
          </p>
          <div className="text-xs text-yellow-700">
            <div className="flex items-center gap-1 mb-1">
              <ExternalLink className="w-3 h-3" />
              <span>Redirects to your Square business page</span>
            </div>
            <div className="flex items-center gap-1">
              <Settings className="w-3 h-3" />
              <span>Manage services and availability in your Square account</span>
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
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        )
      })()}
    </div>
  )
}