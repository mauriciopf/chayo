'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import { useTranslations } from 'next-intl'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Plan {
  id: string
  name: string
  price: number
  priceId: string
  features: string[]
  popular?: boolean
  color: string
  available?: boolean
  comingSoon?: boolean
}

interface SubscriptionPlansProps {
  currentSubscription?: any
  onClose: () => void
  onSubscriptionUpdate: () => void
  targetPlan?: string // Optional target plan to highlight
}

export default function SubscriptionPlans({ currentSubscription, onClose, onSubscriptionUpdate, targetPlan }: SubscriptionPlansProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const currentPlan = currentSubscription?.plan_name || 'free'
  const t = useTranslations('subscriptionPlans')

  const plans: Plan[] = [
    {
      id: 'basic',
      name: t('plans.basic.name'),
      price: 97,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC || '',
      color: 'from-purple-500 to-pink-500',
      popular: true,
      features: [
        '1 Agente de WhatsApp AI (Disponible ahora)',
        '$9 USD de saldo en respuestas IA',
        'Acceso a todos los modelos de ChatGPT',
        'Chat centralizado de WhatsApp',
        'CRM y contactos ilimitados',
        'Reconocimiento de imágenes y notas de voz',
        'Automatizaciones / Workflows básicos',
        'Soporte vía ticket'
      ],
      available: true
    },
    {
      id: 'pro',
      name: t('plans.professional.name'),
      price: 197,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || '',
      color: 'from-orange-500 to-yellow-500',
      features: [
        'Todo de Plan Básico',
        '$20 USD en saldo de respuestas IA',
        'Web AI Widget (Próximamente)',
        'Voice AI Agent (Próximamente)',
        'Calendario inteligente integrado',
        'Formularios y encuestas personalizables',
        'Embudo de ventas (Pipeline)',
        '5 cuentas de equipo',
        'Soporte estándar vía chatbot'
      ],
      available: false,
      comingSoon: true
    },
    {
      id: 'premium',
      name: t('plans.premium.name'),
      price: 297,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM || '',
      color: 'from-emerald-500 to-teal-500',
      features: [
        'Todo de Plan Profesional',
        '2 Agentes de WhatsApp AI (Próximamente)',
        'Instagram DM Automation (Próximamente)',
        'Facebook Messenger AI (Próximamente)',
        '$30 USD en respuestas IA',
        'Cuentas ilimitadas para tu equipo',
        'Automatizaciones / Workflows avanzados',
        'Email Marketing (Próximamente)',
        'Social Planner (Próximamente)',
        'Módulo de Reseñas (Próximamente)',
        'Soporte premium con atención personalizada'
      ],
      available: false,
      comingSoon: true
    }
  ]

  const handleSubscribe = async (plan: Plan) => {
    if (!plan.priceId) {
      alert('Plan price ID not configured. Please contact support.')
      return
    }

    setLoading(plan.id)
    
    try {
      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          planName: plan.id,
        }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      const { error: stripeError } = await stripe!.redirectToCheckout({ sessionId })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      // If successful, call the update callback
      onSubscriptionUpdate()
    } catch (error) {
      console.error('Error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
      })

      const { url, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      window.location.href = url
    } catch (error) {
      console.error('Error:', error)
      alert('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 
              className="text-2xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {t('title')}
            </h2>
            <p 
              className="mt-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Launch Notice */}
        <div className="px-6 pb-4">
          <div 
            className="border rounded-lg p-4"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-primary)'
            }}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-green-900">
                  🚀 Phase 1 Launch: WhatsApp AI is Live!
                </p>
                <p className="text-sm text-green-700">
                  Start with our WhatsApp AI agent today. Additional channels and features are being added soon.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation Message */}
        {targetPlan && (
          <div className="px-6 pb-4">
            <div 
              className="border rounded-lg p-4"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)} Plan Recommended
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    This plan includes access to the channel integration you selected. Upgrade now to unlock this feature!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">{plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative rounded-3xl shadow-xl overflow-hidden ${
              plan.popular && plan.available ? 'ring-4 scale-105' : ''
            } ${
              !plan.available ? 'opacity-75' : ''
            }`}
            style={{
              ...(plan.popular && plan.available && { 
                ringColor: 'var(--border-focus)' 
              }),
              ...(targetPlan === plan.id && { 
                backgroundColor: 'var(--bg-secondary)',
                ringWidth: '4px',
                ringColor: 'var(--accent-primary)'
              })
            }}
          >
            {plan.popular && plan.available && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold px-4 py-1 rounded-full">
                  {t('popularBadge')}
                </div>
              </div>
            )}
            
            {plan.comingSoon && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm font-bold px-4 py-1 rounded-full">
                  {t('comingSoon')}
                </div>
              </div>
            )}
            
            {targetPlan === plan.id && !plan.popular && plan.available && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-gradient-to-r from-zinc-600 to-zinc-700 text-white text-sm font-bold px-4 py-1 rounded-full">
                  Recommended for You!
                </div>
              </div>
            )}

            <div className={`p-8 bg-gradient-to-br ${plan.color} text-white ${
              !plan.available ? 'grayscale' : ''
            }`}>
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-lg ml-2 opacity-90">{t('perMonth')}</span>
              </div>
            </div>

            <div className="p-8">
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start space-x-3">
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center mt-0.5 flex-shrink-0 ${
                      !plan.available ? 'grayscale' : ''
                    }`}>
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>

              {currentPlan === plan.id ? (
                <div className="space-y-3">
                  <div 
                    className="text-center py-3 rounded-lg font-medium"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {t('currentPlan')}
                  </div>
                  <button
                    onClick={handleManageSubscription}
                    className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    {t('manageSubscription')}
                  </button>
                </div>
              ) : plan.available ? (
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading === plan.id}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                    loading === plan.id
                      ? 'bg-gray-300 cursor-not-allowed'
                      : `bg-gradient-to-r ${plan.color} hover:shadow-lg text-white`
                  }`}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>{t('processing')}</span>
                    </span>
                  ) : currentPlan === 'free' ? (
                    t('startFreeTrial')
                  ) : (
                    t('upgradeNow')
                  )}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3 rounded-lg font-semibold bg-gray-200 cursor-not-allowed"
                >
                  🔒 {t('comingSoon')}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {currentPlan !== 'free' && (
        <div className="mt-8 text-center border-t pt-6">
          <p 
            className="mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('needChanges')}
          </p>
          <button
            onClick={handleManageSubscription}
            className="inline-flex items-center space-x-2 font-medium"
            style={{ 
              color: 'var(--text-muted)',
              ':hover': { color: 'var(--text-secondary)' }
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{t('manageSubscription')}</span>
          </button>
        </div>
      )}
        </div>
      </motion.div>
    </div>
  )
}
