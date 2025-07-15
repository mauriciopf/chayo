'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import WhatsAppOnboarding from '@/components/dashboard/WhatsAppOnboarding'
import { useTranslations } from 'next-intl'

interface Agent {
  id: string
  name: string
  greeting: string
  tone: string
  goals: string[]
  system_prompt: string
  paused: boolean
  created_at: string
}

interface Channel {
  id: string
  name: string
  type: 'whatsapp' | 'instagram' | 'facebook' | 'web' | 'voice' | 'email' | 'video'
  description: string
  icon: string
  status: 'available' | 'connected' | 'coming_soon'
  isPopular?: boolean
  planRequired?: 'free' | 'basic' | 'pro' | 'premium'
  features: string[]
  setupSteps: string[]
}

export default function IntegrationsPage() {
  const t = useTranslations('integrations')
  const [user, setUser] = useState<User | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [showWhatsAppOnboarding, setShowWhatsAppOnboarding] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Dynamic channels data using translations
  const channels: Channel[] = [
    {
      id: 'whatsapp',
      name: t('channels.whatsapp.name'),
      type: 'whatsapp',
      description: t('channels.whatsapp.description'),
      icon: '📱',
      status: 'available',
      isPopular: true,
      planRequired: 'free',
      features: [
        t('channels.whatsapp.features.0'),
        t('channels.whatsapp.features.1'),
        t('channels.whatsapp.features.2'),
        t('channels.whatsapp.features.3'),
        t('channels.whatsapp.features.4'),
        t('channels.whatsapp.features.5'),
        t('channels.whatsapp.features.6'),
        t('channels.whatsapp.features.7')
      ],
      setupSteps: [
        t('channels.whatsapp.setupSteps.0'),
        t('channels.whatsapp.setupSteps.1'),
        t('channels.whatsapp.setupSteps.2'),
        t('channels.whatsapp.setupSteps.3'),
        t('channels.whatsapp.setupSteps.4'),
        t('channels.whatsapp.setupSteps.5')
      ]
    },
    {
      id: 'web',
      name: t('channels.web.name'),
      type: 'web',
      description: t('channels.web.description'),
      icon: '🌐',
      status: 'coming_soon',
      planRequired: 'basic',
      features: [
        t('channels.web.features.0'),
        t('channels.web.features.1'),
        t('channels.web.features.2'),
        t('channels.web.features.3'),
        t('channels.web.features.4'),
        t('channels.web.features.5')
      ],
      setupSteps: [
        t('channels.web.setupSteps.0'),
        t('channels.web.setupSteps.1'),
        t('channels.web.setupSteps.2'),
        t('channels.web.setupSteps.3'),
        t('channels.web.setupSteps.4')
      ]
    },
    {
      id: 'voice',
      name: t('channels.voice.name'),
      type: 'voice',
      description: t('channels.voice.description'),
      icon: '🎙️',
      status: 'coming_soon',
      planRequired: 'pro',
      features: [
        t('channels.voice.features.0'),
        t('channels.voice.features.1'),
        t('channels.voice.features.2'),
        t('channels.voice.features.3'),
        t('channels.voice.features.4'),
        t('channels.voice.features.5')
      ],
      setupSteps: [
        t('channels.voice.setupSteps.0'),
        t('channels.voice.setupSteps.1'),
        t('channels.voice.setupSteps.2'),
        t('channels.voice.setupSteps.3'),
        t('channels.voice.setupSteps.4')
      ]
    },
    {
      id: 'instagram',
      name: t('channels.instagram.name'),
      type: 'instagram',
      description: t('channels.instagram.description'),
      icon: '📷',
      status: 'coming_soon',
      isPopular: true,
      planRequired: 'basic',
      features: [
        t('channels.instagram.features.0'),
        t('channels.instagram.features.1'),
        t('channels.instagram.features.2'),
        t('channels.instagram.features.3'),
        t('channels.instagram.features.4'),
        t('channels.instagram.features.5')
      ],
      setupSteps: [
        t('channels.instagram.setupSteps.0'),
        t('channels.instagram.setupSteps.1'),
        t('channels.instagram.setupSteps.2'),
        t('channels.instagram.setupSteps.3'),
        t('channels.instagram.setupSteps.4')
      ]
    },
    {
      id: 'facebook',
      name: t('channels.facebook.name'),
      type: 'facebook',
      description: t('channels.facebook.description'),
      icon: '📘',
      status: 'coming_soon',
      planRequired: 'premium',
      features: [
        t('channels.facebook.features.0'),
        t('channels.facebook.features.1'),
        t('channels.facebook.features.2'),
        t('channels.facebook.features.3'),
        t('channels.facebook.features.4'),
        t('channels.facebook.features.5')
      ],
      setupSteps: [
        t('channels.facebook.setupSteps.0'),
        t('channels.facebook.setupSteps.1'),
        t('channels.facebook.setupSteps.2'),
        t('channels.facebook.setupSteps.3'),
        t('channels.facebook.setupSteps.4')
      ]
    },
    {
      id: 'email',
      name: t('channels.email.name'),
      type: 'email',
      description: t('channels.email.description'),
      icon: '📧',
      status: 'coming_soon',
      planRequired: 'basic',
      features: [
        t('channels.email.features.0'),
        t('channels.email.features.1'),
        t('channels.email.features.2'),
        t('channels.email.features.3'),
        t('channels.email.features.4'),
        t('channels.email.features.5')
      ],
      setupSteps: [
        t('channels.email.setupSteps.0'),
        t('channels.email.setupSteps.1'),
        t('channels.email.setupSteps.2'),
        t('channels.email.setupSteps.3'),
        t('channels.email.setupSteps.4')
      ]
    }
  ]

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        await Promise.all([
          fetchAgents(),
          fetchSubscription(user.id)
        ])
      } else {
        router.push('/auth')
      }
      setLoading(false)
    }

    getUser()
  }, [router, supabase.auth])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents')
      if (response.ok) {
        const { agents } = await response.json()
        setAgents(agents || [])
        if (agents?.length > 0) {
          setSelectedAgent(agents[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  const fetchSubscription = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (data && !error) {
      setSubscription(data)
    } else {
      console.warn('Subscription fetch error:', error)
      // Fallback to free plan if table doesn't exist or no subscription found
      setSubscription({ 
        plan_name: 'free', 
        status: 'active' 
      })
    }
  }

  const canAccessChannel = (channel: Channel) => {
    const userPlan = subscription?.plan_name || 'free'
    const planHierarchy = ['free', 'basic', 'pro', 'premium']
    const userPlanIndex = planHierarchy.indexOf(userPlan)
    const requiredPlanIndex = planHierarchy.indexOf(channel.planRequired || 'free')
    
    return userPlanIndex >= requiredPlanIndex
  }

  const handleChannelSetup = (channel: Channel) => {
    if (!canAccessChannel(channel)) {
      // Redirect to upgrade page with the required plan
      const requiredPlan = channel.planRequired || 'basic'
      router.push(`/dashboard?showPlans=true&targetPlan=${requiredPlan}`)
      return
    }

    if (channel.status === 'coming_soon') {
      return
    }

    // Handle WhatsApp specifically with the onboarding flow
    if (channel.type === 'whatsapp') {
      setShowWhatsAppOnboarding(true)
      return
    }

    setSelectedChannel(channel)
    setShowSetupModal(true)
  }

  const getPlanBadgeColor = (plan: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      pro: 'bg-purple-100 text-purple-800',
      premium: 'bg-orange-100 text-orange-800'
    }
    return colors[plan as keyof typeof colors] || colors.free
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-purple-600 hover:text-purple-700 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <motion.h1 
                className="text-2xl lg:text-3xl font-black tracking-tight"
                whileHover={{ scale: 1.02 }}
              >
                <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                  {t('title')}
                </span>
              </motion.h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {t('currentPlan')}: {subscription?.plan_name || 'free'}
              </span>
              <Link
                href="/dashboard"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg"
              >
                {t('backToDashboard')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Launch Status Notice */}
        <div className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mr-4">
                <span className="text-white text-xl">🚀</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('launchStatus.title')}</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-green-600">{t('channels.whatsapp.name')}</span> {t('launchStatus.description')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {t('launchStatus.whatsappLive')}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {t('launchStatus.othersComingSoon')}
              </span>
            </div>
          </div>
        </div>

        {/* Agent Selection */}
        {agents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              {t('agentSelection.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <motion.button
                  key={agent.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedAgent === agent.id
                      ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300 bg-white/80 backdrop-blur-sm'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-medium">
                        {agent.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{agent.name}</p>
                      <p className="text-sm text-gray-500 truncate">{agent.greeting}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {agents.length === 0 && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="font-medium text-yellow-800">{t('noAgents.title')}</p>
                <p className="text-sm text-yellow-600">
                  {t('noAgents.description')}{' '}
                  <Link href="/dashboard" className="underline hover:text-yellow-700">
                    {t('noAgents.goToDashboard')}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Available Channels */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('availableChannels.title')}
              </h2>
              <p className="text-gray-600 mt-1">
                {t('availableChannels.subtitle')}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {t('availableChannels.poweredBy')}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((channel) => (
              <motion.div
                key={channel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{channel.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{channel.name}</h3>
                        {channel.isPopular && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {t('availableChannels.popular')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(channel.planRequired || 'free')}`}>
                        {channel.planRequired || 'free'}
                      </span>
                      {channel.status === 'coming_soon' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 mt-1">
                          {t('availableChannels.comingSoon')}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{channel.description}</p>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">{t('availableChannels.features')}:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {channel.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                      {channel.features.length > 3 && (
                        <li className="text-gray-500 text-xs">
                          +{channel.features.length - 3} {t('availableChannels.moreFeatures')}
                        </li>
                      )}
                    </ul>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChannelSetup(channel)}
                    disabled={!canAccessChannel(channel) || channel.status === 'coming_soon' || !selectedAgent}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                      !canAccessChannel(channel)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : channel.status === 'coming_soon'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : !selectedAgent
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg'
                    }`}
                  >
                    {!canAccessChannel(channel)
                      ? `${t('availableChannels.upgradeTo')} ${channel.planRequired}`
                      : channel.status === 'coming_soon'
                      ? t('availableChannels.comingSoon')
                      : !selectedAgent
                      ? t('availableChannels.selectAgentFirst')
                      : t('availableChannels.connectChannel')
                    }
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            {t('setupInstructions.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-purple-800 mb-2">{t('setupInstructions.workflowIntegration.title')}</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {t.raw('setupInstructions.workflowIntegration.points').map((point: string, index: number) => (
                  <li key={index}>• {point}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-purple-800 mb-2">{t('setupInstructions.setupProcess.title')}</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {t.raw('setupInstructions.setupProcess.steps').map((step: string, index: number) => (
                  <li key={index}>{index + 1}. {step}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Modal */}
      {showSetupModal && selectedChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{selectedChannel.icon}</span>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {t('setupModal.connectTitle')} {selectedChannel.name}
                  </h3>
                </div>
                <button
                  onClick={() => setShowSetupModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">{t('setupModal.setupSteps')}</h4>
                <ol className="space-y-3">
                  {selectedChannel.setupSteps.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">{t('setupModal.allFeatures')}</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedChannel.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-blue-800">{t('setupModal.integrationStatus')}</p>
                    <p className="text-sm text-blue-700">
                      {selectedChannel.id === 'whatsapp' 
                        ? t('setupModal.whatsappReady')
                        : t('setupModal.comingSoonNotice')
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSetupModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('setupModal.cancel')}
                </button>
                <button
                  onClick={() => {
                    if (selectedChannel?.id === 'whatsapp') {
                      alert('WhatsApp Business integration is ready! Our support team will contact you shortly to complete the setup.')
                    } else {
                      alert('Thanks for your interest! We\'ll notify you when ' + selectedChannel?.name + ' integration is ready.')
                    }
                    setShowSetupModal(false)
                  }}
                  className="px-4 py-2 bg-orange-400 text-white rounded-lg hover:bg-orange-500 transition-colors"
                >
                  {selectedChannel?.id === 'whatsapp' ? t('setupModal.startSetup') : t('setupModal.getNotified')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* WhatsApp Onboarding Modal */}
      {showWhatsAppOnboarding && selectedAgent && (
        <WhatsAppOnboarding
          agentId={selectedAgent}
          agentName={agents.find(a => a.id === selectedAgent)?.name || 'Your Agent'}
          onSuccess={(data) => {
            setShowWhatsAppOnboarding(false)
            // Show success notification with better UI
            const trialInfo = data.isTrial ? `\n\n🕒 3-Day Trial Active until ${new Date(data.trialEndsAt).toLocaleDateString()}` : ''
            const successMessage = `🎉 WhatsApp setup successful!\n\nYour agent "${agents.find(a => a.id === selectedAgent)?.name}" is now connected to ${data.phoneNumber}.\n\nStatus: ${data.status}${trialInfo}\n\nYou can now start receiving and responding to WhatsApp messages automatically!`
            
            // Create a better success notification
            const notification = document.createElement('div')
            notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-6 rounded-2xl shadow-2xl z-[9999] max-w-md'
            notification.innerHTML = `
              <div class="flex items-start">
                <div class="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span class="text-lg">✅</span>
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-lg mb-1">WhatsApp Connected!</h3>
                  <p class="text-sm text-green-100 mb-2">Agent: ${agents.find(a => a.id === selectedAgent)?.name}</p>
                  <p class="text-sm text-green-100 mb-2">Phone: ${data.phoneNumber}</p>
                  <p class="text-sm text-green-100 mb-2">Status: ${data.status}</p>
                  ${data.isTrial ? `<p class="text-sm text-green-100 mb-2">🕒 Trial ends: ${new Date(data.trialEndsAt).toLocaleDateString()}</p>` : ''}
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-green-100 ml-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            `
            
            document.body.appendChild(notification)
            
            // Auto-remove after 8 seconds
            setTimeout(() => {
              if (notification.parentElement) {
                notification.remove()
              }
            }, 8000)
            
            // Refresh the page after a short delay to show updated status
            setTimeout(() => {
              window.location.reload()
            }, 2000)
          }}
          onCancel={() => setShowWhatsAppOnboarding(false)}
        />
      )}
    </div>
  )
}
