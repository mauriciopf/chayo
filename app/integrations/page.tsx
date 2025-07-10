'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'

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

const channels: Channel[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    type: 'whatsapp',
    description: 'Connect your WhatsApp Business account to handle customer inquiries automatically. Available now!',
    icon: '📱',
    status: 'available',
    isPopular: true,
    planRequired: 'basic',
    features: [
      'Automated customer responses',
      'Rich media support (images, documents)',
      'Business profile integration',
      'Message templates',
      'Analytics and insights',
      'Multi-language support',
      'Custom business hours',
      'Quick replies and workflows'
    ],
    setupSteps: [
      'Verify your WhatsApp Business account',
      'Connect via API integration',
      'Configure message templates',
      'Set up automated responses',
      'Test the integration',
      'Go live with your AI agent'
    ]
  },
  {
    id: 'web',
    name: 'Web AI Widget',
    type: 'web',
    description: 'Embed an intelligent chat widget on your website for instant customer support',
    icon: '🌐',
    status: 'coming_soon',
    planRequired: 'basic',
    features: [
      'Customizable AI chat widget',
      'Website integration',
      'Real-time intelligent responses',
      'Visitor tracking',
      'Mobile responsive design',
      'Custom branding options'
    ],
    setupSteps: [
      'Generate widget code',
      'Customize appearance and branding',
      'Install on website',
      'Configure AI responses',
      'Test widget functionality'
    ]
  },
  {
    id: 'video',
    name: 'Voice AI Agent',
    type: 'voice',
    description: 'Deploy voice-enabled AI agents for phone calls and voice interactions',
    icon: '�️',
    status: 'coming_soon',
    planRequired: 'pro',
    features: [
      'Voice call automation',
      'Natural language processing',
      'Multi-language voice support',
      'Call recording and transcription',
      'Voice personality customization',
      'Phone number integration'
    ],
    setupSteps: [
      'Set up voice number',
      'Configure voice AI personality',
      'Train voice responses',
      'Test call flows',
      'Deploy voice agent'
    ]
  },
  {
    id: 'instagram',
    name: 'Instagram DM Automation',
    type: 'instagram',
    description: 'Automate Instagram direct message responses and engage with your audience 24/7',
    icon: '📷',
    status: 'coming_soon',
    isPopular: true,
    planRequired: 'basic',
    features: [
      'Direct message automation',
      'Comment responses',
      'Story mentions handling',
      'Media sharing capabilities',
      'Engagement analytics',
      'Follower interaction tracking'
    ],
    setupSteps: [
      'Connect Instagram Business account',
      'Authorize API access',
      'Set up automation rules',
      'Configure response templates',
      'Test engagement flows'
    ]
  },
  {
    id: 'facebook',
    name: 'Facebook Messenger',
    type: 'facebook',
    description: 'Automate Facebook Messenger conversations and manage your page inbox',
    icon: '�',
    status: 'coming_soon',
    planRequired: 'premium',
    features: [
      'Messenger automation',
      'Page inbox management',
      'Rich responses with buttons',
      'Persistent menu setup',
      'User profile access',
      'Broadcast messaging'
    ],
    setupSteps: [
      'Connect Facebook Page',
      'Set up Messenger permissions',
      'Configure automation workflows',
      'Design conversation flows',
      'Test message sequences'
    ]
  },
  {
    id: 'email',
    name: 'Email Support',
    type: 'email',
    description: 'Automate email responses and support tickets with intelligent AI assistance',
    icon: '📧',
    status: 'coming_soon',
    planRequired: 'basic',
    features: [
      'Email automation',
      'Ticket management',
      'Smart categorization',
      'Follow-up sequences',
      'Integration with email providers',
      'Priority handling'
    ],
    setupSteps: [
      'Connect email account',
      'Set up IMAP/SMTP',
      'Configure automation rules',
      'Design email templates',
      'Test email workflows'
    ]
  }
]

export default function IntegrationsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const router = useRouter()
  const supabase = createClient()

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
                  Channel Integrations
                </span>
              </motion.h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Current plan: {subscription?.plan_name || 'free'}
              </span>
              <Link
                href="/dashboard"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg"
              >
                Back to Dashboard
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
                <h3 className="text-lg font-bold text-gray-900">Launch Status</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-green-600">WhatsApp Business</span> is now available! 
                  Other channels are coming soon.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                📱 WhatsApp Live
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                🔧 Others Coming Soon
              </span>
            </div>
          </div>
        </div>

        {/* Agent Selection */}
        {agents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Select an Agent to Connect Channels
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
                <p className="font-medium text-yellow-800">No agents found</p>
                <p className="text-sm text-yellow-600">
                  You need to create an agent before connecting channels.{' '}
                  <Link href="/dashboard" className="underline hover:text-yellow-700">
                    Go to dashboard
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
                Available Channels
              </h2>
              <p className="text-gray-600 mt-1">
                WhatsApp is live now • Other channels launching soon
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Powered by n8n workflows
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
                            Popular
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
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{channel.description}</p>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
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
                          +{channel.features.length - 3} more features
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
                      ? `Upgrade to ${channel.planRequired}`
                      : channel.status === 'coming_soon'
                      ? 'Coming Soon'
                      : !selectedAgent
                      ? 'Select Agent First'
                      : 'Connect Channel'
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
            🔧 How Channel Integration Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-purple-800 mb-2">n8n Workflow Integration</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Each channel connects via custom n8n workflows</li>
                <li>• Workflows handle message routing and responses</li>
                <li>• Real-time synchronization with your AI agents</li>
                <li>• Scalable architecture for high-volume conversations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-purple-800 mb-2">Setup Process</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>1. Select your AI agent</li>
                <li>2. Choose channel to connect</li>
                <li>3. Follow platform-specific setup steps</li>
                <li>4. Test the integration</li>
                <li>5. Start receiving automated responses</li>
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
                    Connect {selectedChannel.name}
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
                <h4 className="font-medium text-gray-900 mb-3">Setup Steps:</h4>
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
                <h4 className="font-medium text-gray-900 mb-3">All Features:</h4>
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
                    <p className="font-medium text-blue-800">Integration Status</p>
                    <p className="text-sm text-blue-700">
                      {selectedChannel.id === 'whatsapp' 
                        ? 'WhatsApp Business integration is ready! Contact our support team to get started.'
                        : 'This channel is coming soon. Click "Get Notified" to be informed when it\'s ready.'
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
                  Cancel
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
                  {selectedChannel?.id === 'whatsapp' ? 'Start Setup' : 'Get Notified'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
