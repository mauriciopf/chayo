'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

interface WhatsAppOnboardingProps {
  agentId: string
  agentName: string
  onSuccess: (data: any) => void
  onCancel: () => void
}

interface CountryCode {
  code: string
  country: string
  flag: string
}

export default function WhatsAppOnboarding({ agentId, agentName, onSuccess, onCancel }: WhatsAppOnboardingProps) {
  const [step, setStep] = useState(1)
  const [numberFlow, setNumberFlow] = useState<'new' | 'existing'>('new') // Default to new number
  const [formData, setFormData] = useState({
    countryCode: '1',
    phoneNumber: '',
    businessName: '',
    businessDescription: '',
    selectedTwilioNumber: ''
  })
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([])
  const [loadingNumbers, setLoadingNumbers] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const t = useTranslations('whatsAppOnboarding')

  const COUNTRY_CODES: CountryCode[] = [
    { code: '1', country: t('countries.unitedStates'), flag: '🇺🇸' },
    { code: '1', country: t('countries.canada'), flag: '🇨🇦' },
    { code: '52', country: t('countries.mexico'), flag: '🇲🇽' },
    { code: '34', country: t('countries.spain'), flag: '🇪🇸' },
    { code: '54', country: t('countries.argentina'), flag: '🇦🇷' },
    { code: '55', country: t('countries.brazil'), flag: '🇧🇷' },
    { code: '56', country: t('countries.chile'), flag: '🇨🇱' },
    { code: '57', country: t('countries.colombia'), flag: '🇨🇴' },
    { code: '58', country: t('countries.venezuela'), flag: '🇻🇪' },
    { code: '51', country: t('countries.peru'), flag: '🇵🇪' },
    { code: '593', country: t('countries.ecuador'), flag: '🇪🇨' },
    { code: '44', country: t('countries.unitedKingdom'), flag: '🇬🇧' },
    { code: '33', country: t('countries.france'), flag: '🇫🇷' },
    { code: '49', country: t('countries.germany'), flag: '🇩🇪' },
    { code: '39', country: t('countries.italy'), flag: '🇮🇹' },
  ]

  const fetchAvailableNumbers = useCallback(async () => {
    setLoadingNumbers(true)
    setError('')
    try {
      const countryMapping: { [key: string]: string } = {
        '1': 'US',
        '44': 'GB',
        '49': 'DE',
        '33': 'FR',
        '34': 'ES',
        '39': 'IT',
        '52': 'MX',
        '55': 'BR',
        '54': 'AR'
      }
      
      const country = countryMapping[formData.countryCode] || 'US'
      const response = await fetch(`/api/twilio/phone-numbers?countryCode=${country}`)
      const data = await response.json()
      
      if (data.success) {
        setAvailableNumbers(data.availableNumbers)
      } else {
        setError(t('errors.fetchNumbers'))
      }
    } catch (err) {
      setError(t('errors.fetchNumbers'))
    } finally {
      setLoadingNumbers(false)
    }
  }, [formData.countryCode])

  // Auto-load numbers when new flow is selected or country changes
  useEffect(() => {
    if (numberFlow === 'new') {
      fetchAvailableNumbers()
    }
  }, [numberFlow, fetchAvailableNumbers])

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '') // Remove non-digits
    setFormData(prev => ({ ...prev, phoneNumber: value }))
  }

  const validateInput = () => {
    if (numberFlow === 'existing') {
      if (!formData.phoneNumber) {
        setError(t('errors.phoneRequired'))
        return false
      }
      if (formData.phoneNumber.length < 10) {
        setError(t('errors.phoneMinLength'))
        return false
      }
    } else {
      if (!formData.selectedTwilioNumber) {
        setError(t('errors.selectNumber'))
        return false
      }
    }
    return true
  }

  // Computed validation without side effects for rendering
  const isInputValid = () => {
    if (numberFlow === 'existing') {
      return formData.phoneNumber && formData.phoneNumber.length >= 10
    } else {
      return !!formData.selectedTwilioNumber
    }
  }

  const handleSubmit = async () => {
    setError('')
    
    if (!validateInput()) {
      return
    }

    setLoading(true)

    try {
      let phoneNumberToUse = ''
      
      if (numberFlow === 'new') {
        // First purchase the Twilio number
        const purchaseResponse = await fetch('/api/twilio/phone-numbers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: formData.selectedTwilioNumber })
        })
        
        const purchaseData = await purchaseResponse.json()
        if (!purchaseData.success) {
          throw new Error(purchaseData.error || t('errors.purchaseNumber'))
        }
        
        phoneNumberToUse = formData.selectedTwilioNumber
      } else {
        phoneNumberToUse = `+${formData.countryCode}${formData.phoneNumber}`
      }

      const response = await fetch('/api/whatsapp/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumberToUse,
          countryCode: formData.countryCode,
          agentId,
          businessName: formData.businessName,
          businessDescription: formData.businessDescription,
          numberFlow: numberFlow,
          isNewNumber: numberFlow === 'new'
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Setup failed')
      }

      onSuccess(result.data)
    } catch (error: any) {
      console.error('WhatsApp setup error:', error)
      setError(error.message || 'Failed to setup WhatsApp. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatPhoneNumber = (number: string) => {
    if (!number) return ''
    
    // Format based on country code
    if (formData.countryCode === '1') {
      // US/Canada format: (XXX) XXX-XXXX
      const cleaned = number.replace(/\D/g, '')
      const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/)
      if (match) {
        return [match[1], match[2], match[3]]
          .filter(x => x)
          .join('-')
          .replace(/^(\d{3})/, '($1) ')
      }
    }
    return number
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-3">
                <span className="text-white text-xl">📱</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {t('title')} {agentName}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('subtitle')}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span className={step >= 1 ? 'text-green-600 font-medium' : ''}>{t('step1Title')}</span>
              <span className={step >= 2 ? 'text-green-600 font-medium' : ''}>{t('step3Title')}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
          </div>

          {/* Step 1: Phone Number */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('selectCountry')}
                </label>
                <select
                  value={formData.countryCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, countryCode: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {COUNTRY_CODES.map((country) => (
                    <option key={`${country.code}-${country.country}`} value={country.code}>
                      {country.flag} {country.country} (+{country.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Number Flow Selection */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('step1Title')}
                </label>
                
                {/* Option 1: New Number (Recommended) */}
                <div
                  onClick={() => setNumberFlow('new')}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    numberFlow === 'new'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`w-4 h-4 rounded-full border-2 mt-1 mr-3 ${
                      numberFlow === 'new'
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300'
                    }`}>
                      {numberFlow === 'new' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-semibold text-gray-900">{t('newNumberOption')}</h3>
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          {t('recommended')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {t('newNumberDescription')}
                      </p>
                      <div className="text-xs text-green-700 bg-green-100 rounded-lg p-2 mb-2">
                        {t('instantSetup')}
                      </div>
                      <div className="text-xs text-blue-700 bg-blue-100 rounded-lg p-2 border border-blue-200">
                        <div className="flex items-center mb-1">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">{t('freeTrialTitle')}</span>
                        </div>
                        <div>{t('freeTrialDescription')}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Option 2: Existing Number */}
                <div
                  onClick={() => setNumberFlow('existing')}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    numberFlow === 'existing'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`w-4 h-4 rounded-full border-2 mt-1 mr-3 ${
                      numberFlow === 'existing'
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-gray-300'
                    }`}>
                      {numberFlow === 'existing' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{t('existingNumberOption')}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {t('existingNumberDescription')}
                      </p>
                      <div className="text-xs text-orange-700 bg-orange-100 rounded-lg p-2">
                        {t('migrationWarning')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* New Number Flow */}
              {numberFlow === 'new' && (
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('selectNumber')}
                    </label>
                    <button
                      onClick={fetchAvailableNumbers}
                      disabled={loadingNumbers}
                      className="text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                    >
                      {loadingNumbers ? t('loadingNumbers') : t('refreshNumbers')}
                    </button>
                  </div>
                  
                  {availableNumbers.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableNumbers.map((number, index) => (
                        <div
                          key={index}
                          onClick={() => setFormData(prev => ({ ...prev, selectedTwilioNumber: number.phoneNumber }))}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            formData.selectedTwilioNumber === number.phoneNumber
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">{number.phoneNumber}</p>
                              <p className="text-sm text-gray-600">{number.locality}, {number.region}</p>
                            </div>
                            {/* Remove cost and Twilio branding */}
                            <div className="text-right">
                              <p className="text-xs text-gray-500">SMS + Voice enabled</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <button
                        onClick={fetchAvailableNumbers}
                        disabled={loadingNumbers}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {loadingNumbers ? t('loadingNumbers') : t('selectNumber')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Existing Number Flow */}
              {numberFlow === 'existing' && (
                <div className="space-y-4 mt-4">
                  {/* Migration Warning */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div className="text-sm text-red-800">
                        <p className="font-medium mb-2">⚠️ Required Steps to Migrate:</p>
                        <ul className="space-y-1 text-xs">
                          <li>✅ <strong>{t('migration.ownNumber')}</strong> - {t('migration.ownNumberDesc')}</li>
                          <li>❌ <strong>{t('migration.deleteAccount')}</strong> - {t('migration.deleteAccountDesc')}</li>
                          <li>🕓 <strong>{t('migration.waitSystems')}</strong> - {t('migration.waitSystemsDesc')}</li>
                          <li>⚠️ <strong>{t('migration.duringMigration')}</strong> - {t('migration.duringMigrationDesc')}</li>
                        </ul>
                        <p className="mt-2 font-medium text-red-900">This will completely wipe your current WhatsApp presence!</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('phoneNumber')}
                    </label>
                    <div className="flex">
                      <div className="flex items-center px-3 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-sm text-gray-600">
                        +{formData.countryCode}
                      </div>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={handlePhoneNumberChange}
                        placeholder={t('phoneNumberPlaceholder')}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-r-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Only proceed if you've completed the deletion steps above
                    </p>
                  </div>

                  {formData.phoneNumber && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-sm text-orange-800">
                        <strong>Migration Number:</strong> +{formData.countryCode}{formData.phoneNumber}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!isInputValid()}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('nextButton')}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Business Information */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Only show business fields for existing number flow */}
              {numberFlow === 'existing' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('businessName')}
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder={t('businessNamePlaceholder')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('businessDescription')}
                    </label>
                    <textarea
                      value={formData.businessDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessDescription: e.target.value }))}
                      placeholder={t('businessDescriptionPlaceholder')}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                  </div>
                </>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{t('setupSummary')}</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>{t('agent')}:</strong> {agentName}</p>
                  <p><strong>{t('phone')}:</strong> +{formData.countryCode}{formData.phoneNumber || formData.selectedTwilioNumber}</p>
                  {/* Only show business name if present and in existing flow */}
                  {numberFlow === 'existing' && formData.businessName && (
                    <p><strong>{t('business')}:</strong> {formData.businessName}</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-between space-x-3 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('backButton')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('processing')}
                    </>
                  ) : (
                    t('setupWhatsApp')
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
