'use client'

import React, { useState, useEffect } from 'react'
import { CreditCard, ExternalLink, Settings, DollarSign, Zap, Code, Check, X } from 'lucide-react'

interface PaymentSettings {
  id: string
  stripe_user_id: string | null
  payment_type: 'dynamic' | 'manual_price_id' | 'custom_ui'
  price_id: string | null
  service_name: string | null
  service_amount: number | null
  service_currency: string
  service_type: 'one_time' | 'recurring'
  recurring_interval?: string
  is_active: boolean
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
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null)
  const [selectedPaymentType, setSelectedPaymentType] = useState<'dynamic' | 'manual_price_id' | 'custom_ui'>('manual_price_id')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Manual Price ID form
  const [priceId, setPriceId] = useState('')
  
  // Custom UI form
  const [serviceName, setServiceName] = useState('')
  const [serviceAmount, setServiceAmount] = useState('')
  const [serviceCurrency, setServiceCurrency] = useState('usd')
  const [serviceType, setServiceType] = useState<'one_time' | 'recurring'>('one_time')
  const [recurringInterval, setRecurringInterval] = useState('month')

  const paymentOptions = [
    {
      id: 'manual_price_id',
      name: 'Manual Price ID',
      icon: <Code className="w-5 h-5" />,
      description: 'Use a Price ID from your Stripe dashboard',
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

  // Load existing settings when component mounts
  useEffect(() => {
    if (isEnabled) {
      loadPaymentSettings()
    }
  }, [isEnabled, organizationId])

  const loadPaymentSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/organizations/${organizationId}/stripe-settings`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setPaymentSettings(data.settings)
          setSelectedPaymentType(data.settings.payment_type)
          
          // Populate form fields based on current settings
          if (data.settings.price_id) {
            setPriceId(data.settings.price_id)
          }
          if (data.settings.service_name) {
            setServiceName(data.settings.service_name)
            setServiceAmount((data.settings.service_amount / 100).toString())
            setServiceCurrency(data.settings.service_currency)
            setServiceType(data.settings.service_type)
            if (data.settings.recurring_interval) {
              setRecurringInterval(data.settings.recurring_interval)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading payment settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectStripe = async () => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/stripe/oauth', {
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
        if (errorData.manualSetup) {
          alert('Stripe OAuth is not yet configured. Please contact support for setup assistance.')
        } else {
          throw new Error(errorData.message || 'Failed to initialize Stripe connection')
        }
        return
      }

      const { authUrl } = await response.json()
      
      // Redirect to Stripe OAuth page
      window.location.href = authUrl
      
    } catch (error) {
      console.error('Error connecting to Stripe:', error)
      alert('Failed to connect to Stripe. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnectStripe = async () => {
    if (!confirm('Are you sure you want to disconnect Stripe? This will disable payment collection.')) {
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/organizations/${organizationId}/stripe-settings`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect Stripe')
      }

      setPaymentSettings(null)
      onSettingsChange?.()
      alert('Stripe disconnected successfully!')
      
    } catch (error) {
      console.error('Error disconnecting Stripe:', error)
      alert('Failed to disconnect Stripe. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)

      let requestData: any = {
        paymentType: selectedPaymentType
      }

      // Add type-specific data
      if (selectedPaymentType === 'manual_price_id') {
        if (!priceId.trim()) {
          alert('Please enter a Stripe Price ID')
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

      const response = await fetch(`/api/organizations/${organizationId}/stripe-settings`, {
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

      await loadPaymentSettings()
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Collection</h3>
        <p className="text-sm text-gray-600">
          Connect your Stripe account to collect payments from clients through the chat.
        </p>
      </div>

      {/* Stripe Connection Status */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${paymentSettings?.stripe_user_id ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-sm font-medium text-gray-900">Stripe Account</span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            paymentSettings?.stripe_user_id 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {paymentSettings?.stripe_user_id ? 'Connected' : 'Not Connected'}
          </span>
        </div>
        {paymentSettings?.stripe_user_id && (
          <div className="mt-2 text-xs text-gray-500">
            Stripe Account ID: {paymentSettings.stripe_user_id}
          </div>
        )}
      </div>

      {/* Connect/Disconnect Button */}
      <div className="flex gap-3">
        {!paymentSettings?.stripe_user_id ? (
          <button
            onClick={handleConnectStripe}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            Connect Stripe Account
          </button>
        ) : (
          <button
            onClick={handleDisconnectStripe}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg"
          >
            <X className="w-4 h-4" />
            Disconnect Stripe
          </button>
        )}
      </div>

      {/* Payment Options - Only show if Stripe is connected */}
      {paymentSettings?.stripe_user_id && (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Choose Payment Option</h4>
            
            {/* Payment Option Cards */}
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
                        <h5 className="font-medium text-gray-900">{option.name}</h5>
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

          {/* Configuration based on selected option */}
          {selectedPaymentType === 'manual_price_id' && (
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900">Manual Price ID Setup</h5>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h6 className="font-medium text-blue-900 mb-2">Setup Instructions:</h6>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Log into your Stripe Dashboard</li>
                  <li>Go to <strong>Products</strong> → <strong>Add Product</strong></li>
                  <li>Create your service (e.g., "Initial Consultation - $80")</li>
                  <li>Copy the <strong>Price ID</strong> (starts with "price_")</li>
                  <li>Paste it below</li>
                </ol>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stripe Price ID
                </label>
                <input
                  type="text"
                  value={priceId}
                  onChange={(e) => setPriceId(e.target.value)}
                  placeholder="price_1ABCxyz..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Find this in your Stripe Dashboard under Products → [Your Product] → Pricing
                </p>
              </div>
            </div>
          )}

          {selectedPaymentType === 'custom_ui' && (
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900">Service Setup</h5>
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
                    <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-md">
                      {serviceCurrency.toUpperCase()}
                    </span>
                    <input
                      type="number"
                      value={serviceAmount}
                      onChange={(e) => setServiceAmount(e.target.value)}
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
              <h5 className="font-medium text-green-900 mb-2">Dynamic Pricing</h5>
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
              disabled={saving || !paymentSettings?.stripe_user_id}
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
  )
}