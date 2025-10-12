'use client'

import React, { useState, useEffect } from 'react'
import { CreditCard, ExternalLink, Settings, DollarSign, Zap, Code, Check, X, Plus, ArrowRight } from 'lucide-react'

interface PaymentProvider {
  id: string
  provider_type: 'stripe' | 'paypal' | 'square'
  provider_account_id: string | null
  payment_type: 'dynamic' | 'manual_price_id' | 'custom_ui'
  price_id: string | null
  service_name: string | null
  service_amount: number | null
  service_currency: string
  service_type: 'one_time' | 'recurring'
  recurring_interval?: string
  is_active: boolean
  is_default: boolean
}

interface PaymentToolConfigProps {
  organizationId: string
  isEnabled: boolean
  onSettingsChange?: () => void
}

export default function PaymentToolConfig({ 
  organizationId, 
  isEnabled, 
  onSettingsChange 
}: PaymentToolConfigProps) {
  const [paymentProviders, setPaymentProviders] = useState<PaymentProvider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null)
  const [selectedPaymentType, setSelectedPaymentType] = useState<'dynamic' | 'manual_price_id' | 'custom_ui'>('manual_price_id')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAddProvider, setShowAddProvider] = useState(false)
  const [selectedProviderType, setSelectedProviderType] = useState<'stripe' | 'paypal' | 'square'>('stripe')
  
  // Manual Price ID form
  const [priceId, setPriceId] = useState('')
  
  // Custom UI form
  const [serviceName, setServiceName] = useState('')
  const [serviceAmount, setServiceAmount] = useState('')
  const [serviceCurrency, setServiceCurrency] = useState('usd')
  const [serviceType, setServiceType] = useState<'one_time' | 'recurring'>('one_time')
  const [recurringInterval, setRecurringInterval] = useState('month')

  // Provider type configurations
  const providerTypes = [
    {
      id: 'stripe',
      name: 'Stripe',
      icon: <CreditCard className="w-6 h-6" />,
      description: 'Accept payments via Stripe Connect',
      color: 'from-blue-500 to-purple-600',
      authUrl: '/api/stripe/oauth'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: <DollarSign className="w-6 h-6" />,
      description: 'Generate PayPal invoices and payment links',
      color: 'from-blue-600 to-blue-800',
      authUrl: '/api/paypal/oauth'
    },
    {
      id: 'square',
      name: 'Square',
      icon: <Settings className="w-6 h-6" />,
      description: 'Create Square checkout links and payments',
      color: 'from-gray-700 to-gray-900',
      authUrl: '/api/square/oauth'
    }
  ]

  const paymentOptions = [
    {
      id: 'manual_price_id',
      name: 'Manual Price ID',
      icon: <Code className="w-5 h-5" />,
      description: 'Use a Price/Product ID from your provider dashboard',
      pros: ['Full control in Stripe dashboard', 'Supports all Stripe features', 'Easy to manage'],
      setup: 'Create a product in Stripe and provide the Price ID'
    },
    {
      id: 'custom_ui',
      name: 'Quick Setup',
      icon: <Zap className="w-5 h-5" />,
      description: 'Let Chayo create the product in Stripe for you',
      pros: ['No Stripe dashboard needed', 'One-click setup', 'Perfect for simple services'],
      setup: 'Just describe your service and price'
    },
    {
      id: 'dynamic',
      name: 'Dynamic Pricing',
      icon: <DollarSign className="w-5 h-5" />,
      description: 'Allow clients to enter custom amounts',
      pros: ['Flexible pricing', 'Good for consultations', 'Client chooses amount'],
      setup: 'No setup required - clients enter amount when paying'
    }
  ]

  // Load existing providers when component mounts
  useEffect(() => {
    if (isEnabled) {
      loadPaymentProviders()
    }
  }, [isEnabled, organizationId])

  const loadPaymentProviders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/organizations/${organizationId}/payment-providers`)
      
      if (response.ok) {
        const data = await response.json()
        setPaymentProviders(data.providers || [])
        
        // Set the default provider as selected
        const defaultProvider = data.providers?.find((p: PaymentProvider) => p.is_default)
        if (defaultProvider) {
          setSelectedProvider(defaultProvider)
          setSelectedPaymentType(defaultProvider.payment_type)
          
          // Populate form fields based on current settings
          if (defaultProvider.price_id) {
            setPriceId(defaultProvider.price_id)
          }
          if (defaultProvider.service_name) {
            setServiceName(defaultProvider.service_name)
            setServiceAmount((defaultProvider.service_amount / 100).toString())
            setServiceCurrency(defaultProvider.service_currency)
            setServiceType(defaultProvider.service_type)
            if (defaultProvider.recurring_interval) {
              setRecurringInterval(defaultProvider.recurring_interval)
            }
          }
        } else if (data.providers?.length > 0) {
          // If no default, select the first active provider
          const firstActive = data.providers.find((p: PaymentProvider) => p.is_active)
          setSelectedProvider(firstActive || data.providers[0])
        }
      }
    } catch (error) {
      console.error('Error loading payment providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectProvider = async (providerType: 'stripe' | 'paypal' | 'square') => {
    try {
      setSaving(true)
      
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
        throw new Error(errorData.message || `Failed to initialize ${provider.name} connection`)
      }

      const { onboardingUrl, authUrl } = await response.json()
      
      // Redirect to provider OAuth/onboarding
      window.location.href = onboardingUrl || authUrl
      
    } catch (error) {
      console.error(`Error connecting to ${providerType}:`, error)
      const providerInfo = providerTypes.find(p => p.id === providerType)
      alert(`Failed to connect to ${providerInfo?.name || providerType}. Please try again.`)
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnectProvider = async (provider: PaymentProvider) => {
    if (!confirm(`Are you sure you want to disconnect ${provider.provider_type.toUpperCase()}? This will disable payment collection for this provider.`)) {
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/organizations/${organizationId}/payment-providers/${provider.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`Failed to disconnect ${provider.provider_type}`)
      }

      // Reload providers to update the UI
      await loadPaymentProviders()
      onSettingsChange?.()
      alert(`${provider.provider_type.toUpperCase()} disconnected successfully!`)
      
    } catch (error) {
      console.error(`Error disconnecting ${provider.provider_type}:`, error)
      alert(`Failed to disconnect ${provider.provider_type.toUpperCase()}. Please try again.`)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!selectedProvider) {
      alert('Please select a payment provider first')
      return
    }

    try {
      setSaving(true)

      let requestData: any = {
        paymentType: selectedPaymentType,
        providerId: selectedProvider.id
      }

      // Add type-specific data
      if (selectedPaymentType === 'manual_price_id') {
        if (!priceId.trim()) {
          alert(`Please enter a ${selectedProvider.provider_type} Price/Product ID`)
          return
        }
        requestData.priceId = priceId.trim()
      } else if (selectedPaymentType === 'custom_ui') {
        if (!serviceName.trim() || !serviceAmount.trim()) {
          alert('Please enter service name and amount')
          return
        }
        
        const amountInCents = Math.round(parseFloat(serviceAmount) * 100)
        if (amountInCents <= 0) {
          alert('Please enter a valid amount')
          return
        }

        requestData.serviceName = serviceName.trim()
        requestData.serviceAmount = amountInCents
        requestData.serviceCurrency = serviceCurrency
        requestData.serviceType = serviceType
        if (serviceType === 'recurring') {
          requestData.recurringInterval = recurringInterval
        }
      }

      const response = await fetch(`/api/organizations/${organizationId}/payment-providers/${selectedProvider.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save payment settings')
      }

      await loadPaymentProviders()
      onSettingsChange?.()
      alert('Payment settings saved successfully!')

    } catch (error) {
      console.error('Error saving payment settings:', error)
      alert(error instanceof Error ? error.message : 'Failed to save payment settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: 'var(--accent-secondary)' }}
        ></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Collection</h3>
        <p className="text-sm text-gray-600">
          Connect payment providers (Stripe, PayPal, Square) to collect payments from clients through the chat.
        </p>
      </div>

      {/* Payment Providers Section */}
      <div className="space-y-6">
        {paymentProviders.length === 0 && !showAddProvider ? (
          // Empty state - clickable container
          <button
            onClick={() => setShowAddProvider(true)}
            className="w-full text-center py-8 rounded-lg border-2 border-dashed transition-all group"
            style={{ 
              borderColor: 'var(--border-secondary)',
              backgroundColor: 'var(--bg-secondary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-secondary)'
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-secondary)'
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
            }}
          >
            <CreditCard 
              className="w-12 h-12 mx-auto mb-4 transition-colors" 
              style={{ color: 'var(--text-muted)' }}
            />
            <h4 
              className="text-lg font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Conectar Proveedor de Pagos
            </h4>
            <p 
              className="mb-4"
              style={{ color: 'var(--text-secondary)' }}
            >
              Conecta proveedores de pago (Stripe, PayPal, Square) para cobrar a tus clientes a través del chat.
            </p>
            <div 
              className="flex items-center justify-center px-4 py-2 text-white rounded-lg transition-colors mx-auto w-fit"
              style={{ backgroundColor: 'var(--accent-secondary)' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Proveedor de Pagos
            </div>
          </button>
        ) : paymentProviders.length > 0 ? (
          // Connected providers list
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 
                className="font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Proveedores Conectados
              </h4>
              <button
                onClick={() => setShowAddProvider(true)}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors"
                style={{ 
                  color: 'var(--accent-secondary)',
                  borderColor: 'var(--border-primary)',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Plus className="w-4 h-4" />
                Agregar Proveedor
              </button>
            </div>
            
            {paymentProviders.map((provider) => {
              const providerInfo = providerTypes.find(p => p.id === provider.provider_type)
              return (
                <div key={provider.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${providerInfo?.color || 'from-gray-400 to-gray-600'} flex items-center justify-center text-white`}>
                        {providerInfo?.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span 
                            className="text-sm font-medium"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {providerInfo?.name || provider.provider_type}
                          </span>
                          {provider.is_default && (
                            <span 
                              className="text-xs px-2 py-1 rounded-full"
                              style={{ 
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--accent-secondary)'
                              }}
                            >
                              Predeterminado
                            </span>
                          )}
                          <span 
                            className="text-xs px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: provider.is_active ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                              color: provider.is_active ? 'var(--accent-secondary)' : 'var(--text-muted)'
                            }}
                          >
                            {provider.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        {provider.provider_account_id && (
                          <div 
                            className="text-xs mt-1"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Cuenta: {provider.provider_account_id}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!provider.is_default && provider.is_active && (
                        <button
                          onClick={() => {
                            // Set as default provider
                            fetch(`/api/organizations/${organizationId}/payment-providers/${provider.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ is_default: true })
                            }).then(() => loadPaymentProviders())
                          }}
                          className="text-xs px-3 py-1 border rounded-md transition-colors"
                          style={{ 
                            color: 'var(--accent-secondary)',
                            borderColor: 'var(--border-primary)',
                            backgroundColor: 'transparent'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          Establecer como Predeterminado
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedProvider(provider)
                          setSelectedPaymentType(provider.payment_type)
                          if (provider.price_id) setPriceId(provider.price_id)
                          if (provider.service_name) {
                            setServiceName(provider.service_name)
                            setServiceAmount(provider.service_amount ? (provider.service_amount / 100).toString() : '')
                            setServiceCurrency(provider.service_currency)
                            setServiceType(provider.service_type)
                            if (provider.recurring_interval) setRecurringInterval(provider.recurring_interval)
                          }
                        }}
                        className="text-xs px-3 py-1 border rounded-md transition-colors"
                        style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        Configure
                      </button>
                      <button
                        onClick={() => handleDisconnectProvider(provider)}
                        className="text-xs px-3 py-1 text-red-600 hover:bg-red-50 border border-red-200 rounded-md"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        {/* Provider Selection */}
        {showAddProvider && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Add Payment Provider</h4>
              <button
                onClick={() => setShowAddProvider(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid gap-4">
              {providerTypes.map((provider) => {
                const isConnected = paymentProviders.some(p => p.provider_type === provider.id)
                return (
                  <div
                    key={provider.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      isConnected 
                        ? 'border-gray-200 opacity-60'
                        : 'border-gray-200 hover:border-blue-300 cursor-pointer'
                    } ${!isConnected ? 'hover:bg-blue-50' : ''}`}
                    style={{
                      backgroundColor: isConnected ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                      borderColor: 'var(--border-primary)' 
                    }}
                    onClick={() => !isConnected && handleConnectProvider(provider.id as any)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${provider.color} flex items-center justify-center text-white`}>
                        {provider.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-gray-900">{provider.name}</h5>
                          {isConnected && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Connected</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{provider.description}</p>
                      </div>
                      {!isConnected && (
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Configuration Panel */}
        {selectedProvider && (
          <div className="space-y-6 border-t pt-6">
            <div className="flex items-center gap-3">
              <h4 className="font-medium text-gray-900">Configure {selectedProvider.provider_type.toUpperCase()}</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${
                selectedProvider.is_default 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {selectedProvider.is_default ? 'Proveedor Predeterminado' : 'Proveedor Secundario'}
              </span>
            </div>

            {/* Payment Options */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Choose Payment Option</h5>
              <div className="grid gap-4">
                {paymentOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPaymentType === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPaymentType(option.id as any)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        selectedPaymentType === option.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h6 className="font-medium text-gray-900">{option.name}</h6>
                          {selectedPaymentType === option.id && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                        <p className="text-xs text-gray-500 mb-2">{option.setup}</p>
                        <div className="flex flex-wrap gap-1">
                          {option.pros.map((pro, index) => (
                            <span key={index} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              {pro}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Configuration Forms */}
            {selectedPaymentType === 'manual_price_id' && (
              <div className="space-y-4">
                <h6 className="font-medium text-gray-900">Manual Price ID Setup</h6>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h6 className="font-medium text-blue-900 mb-2">Setup Instructions:</h6>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Log into your {selectedProvider.provider_type} Dashboard</li>
                    <li>Go to Products/Services section</li>
                    <li>Create your service (e.g., "Initial Consultation - $80")</li>
                    <li>Copy the Price/Product ID</li>
                    <li>Paste it below</li>
                  </ol>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedProvider.provider_type.toUpperCase()} Price/Product ID
                  </label>
                  <input
                    type="text"
                    value={priceId}
                    onChange={(e) => setPriceId(e.target.value)}
                    placeholder={
                      selectedProvider.provider_type === 'stripe' ? 'price_1ABCxyz...' :
                      selectedProvider.provider_type === 'paypal' ? 'P-ABC123...' :
                      'sq0idp-ABC123...'
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {selectedPaymentType === 'custom_ui' && (
              <div className="space-y-4">
                <h6 className="font-medium text-gray-900">Service Setup</h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Name
                    </label>
                    <input
                      type="text"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      placeholder="Initial Consultation"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 py-2 border border-r-0 text-sm rounded-l-md" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        {serviceCurrency.toUpperCase()}
                      </span>
                      <input
                        type="number"
                        value={serviceAmount}
                        onChange={(e) => setServiceAmount(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="80.00"
                        step="0.01"
                        min="0"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Type
                    </label>
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value as 'one_time' | 'recurring')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="one_time">One-time Payment</option>
                      <option value="recurring">Recurring Payment</option>
                    </select>
                  </div>
                  {serviceType === 'recurring' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Billing Interval
                      </label>
                      <select
                        value={recurringInterval}
                        onChange={(e) => setRecurringInterval(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="day">Daily</option>
                        <option value="week">Weekly</option>
                        <option value="month">Monthly</option>
                        <option value="year">Yearly</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedPaymentType === 'dynamic' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h6 className="font-medium text-green-900 mb-2">Dynamic Pricing</h6>
                <p className="text-sm text-green-800 mb-2">
                  With dynamic pricing, clients can enter their own amount when making a payment. 
                  Perfect for consultations, donations, or variable-priced services.
                </p>
                <p className="text-xs text-green-700">
                  No additional setup required. Clients will see an amount input when they choose to pay.
                </p>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={saving || !selectedProvider}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  'Save Payment Settings'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}