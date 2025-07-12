'use client'

import { useEffect, useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import UserProfile from '@/components/dashboard/UserProfile'
import AgentCard from '@/components/dashboard/AgentCard'
import PlanBadge from '@/components/dashboard/PlanBadge'
import CreateAgentModal from '@/components/dashboard/CreateAgentModal'
import EditAgentModal from '@/components/dashboard/EditAgentModal'
import SubscriptionPlans from '@/components/dashboard/SubscriptionPlans'
import ManageDocumentsModal from '@/components/dashboard/ManageDocumentsModal'
import PerformanceOverview from '@/components/dashboard/PerformanceOverview'
import TeamManagement from '@/components/dashboard/TeamManagement'
import SetupInstructions from '@/components/dashboard/SetupInstructions'
import ProfileSettings from '@/components/dashboard/ProfileSettings'
import ChannelStatusWidget from '@/components/dashboard/ChannelStatusWidget'
import { organizationService } from '@/lib/services/organizationService'

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

interface UserSubscription {
  user_id: string
  plan_name: string
  status: string
  stripe_customer_id: string
  stripe_subscription_id: string
  current_period_end: string
}

interface Organization {
  id: string
  name: string
  slug: string
  owner_id: string
  created_at: string
  team_members?: Array<{
    id: string
    user_id: string
    role: string
    status: string
    joined_at: string
  }>
  user_subscription?: {
    plan_name: string
    status: string
  }
}

interface AgentChannel {
  id: string
  agent_id: string
  channel_type: string
  connected: boolean
  credentials: any
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full"
        />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const [user, setUser] = useState<User | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [channels, setChannels] = useState<AgentChannel[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [showPlansModal, setShowPlansModal] = useState(false)
  const [showManageDocsModal, setShowManageDocsModal] = useState(false)
  const [managingAgentId, setManagingAgentId] = useState<string | null>(null)
  const [managingAgentName, setManagingAgentName] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'agents' | 'performance' | 'users' | 'profile'>('agents')
  const [trialInfo, setTrialInfo] = useState<{
    hasActiveTrial: boolean
    daysRemaining: number
    trialNumber?: string
    expiresAt?: string
  } | null>(null)
  const [showSetupInstructions, setShowSetupInstructions] = useState(false)
  const [organizationSetupLoading, setOrganizationSetupLoading] = useState(false)
  const [organizationSetupMessage, setOrganizationSetupMessage] = useState<string | null>(null)
  const [organizationSetupError, setOrganizationSetupError] = useState<string | null>(null)
  const [targetPlan, setTargetPlan] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true
    
    const getUser = async () => {
      try {
        // Wait a moment to ensure any pending session changes are processed
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Poll for user session with retries
        const pollForUser = async (attempts = 0) => {
          const maxAttempts = 5
          const delay = 500
          
          try {
            const { data: { user } } = await supabase.auth.getUser()
            
            if (!isMounted) return
            
            if (user) {
              console.log('Dashboard: User found', user.email)
              setUser(user)
              
              // First ensure user has organization, then fetch other data
              await ensureUserHasOrganization(user)
              
              // Fetch other data in parallel
              await Promise.all([
                fetchAgents(),
                fetchSubscription(user.id),
                fetchChannels(user.id),
                fetchTrialInfo()
              ])
              return
            }
            
            // If no user and we haven't exhausted attempts, retry
            if (attempts < maxAttempts) {
              console.log(`Dashboard: No user found, retrying... (${attempts + 1}/${maxAttempts})`)
              await new Promise(resolve => setTimeout(resolve, delay))
              return pollForUser(attempts + 1)
            }
            
            // No user found after all attempts
            console.log('Dashboard: No user found after all attempts, redirecting to auth')
            router.push('/auth')
          } catch (error) {
            console.error('Dashboard: Error getting user:', error)
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, delay))
              return pollForUser(attempts + 1)
            }
            
            if (isMounted) {
              router.push('/auth')
            }
          }
        }
        
        await pollForUser()
      } catch (error) {
        console.error('Dashboard: Error in getUser:', error)
        if (isMounted) {
          router.push('/auth')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Dashboard: Auth state change:', event, session?.user?.email)
        
        if (!isMounted) return
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Dashboard: User signed in via auth state change')
          setUser(session.user)
          setLoading(true)
          
          // Ensure user has organization and fetch data
          await ensureUserHasOrganization(session.user)
          await Promise.all([
            fetchAgents(),
            fetchSubscription(session.user.id),
            fetchChannels(session.user.id)
          ])
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          console.log('Dashboard: User signed out')
          setUser(null)
          setAgents([])
          setSubscription(null)
          setChannels([])
          setOrganizations([])
          setCurrentOrganization(null)
          router.push('/auth')
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Dashboard: Token refreshed')
          setUser(session.user)
        }
      }
    )

    // Initial load
    getUser()

    // Cleanup function
    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router, supabase.auth])

  // Handle upgrade flow from integrations page
  useEffect(() => {
    const showPlans = searchParams.get('showPlans')
    const targetPlanParam = searchParams.get('targetPlan')
    
    if (showPlans === 'true' && !loading && user) {
      setShowPlansModal(true)
      setTargetPlan(targetPlanParam)
      
      // Clean up the URL parameters
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('showPlans')
      newUrl.searchParams.delete('targetPlan')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [searchParams, loading, user])

  const fetchAgents = async () => {
    try {
      console.log('Fetching agents from /api/agents...')
      const response = await fetch('/api/agents', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      console.log('Agents API response status:', response.status)
      
      if (response.ok) {
        const { agents } = await response.json()
        console.log('Agents fetched successfully:', agents?.length || 0)
        setAgents(agents || [])
      } else {
        console.error('Failed to fetch agents, status:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        setAgents([])
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
      setAgents([])
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
    } else if (error && error.code === 'PGRST116') {
      // No subscription found, create a default free subscription
      console.log('No subscription found, using default free plan')
      setSubscription({ 
        plan_name: 'free', 
        status: 'active',
        user_id: userId,
        stripe_customer_id: '',
        stripe_subscription_id: '',
        current_period_end: ''
      })
    } else {
      console.warn('Subscription fetch error:', error)
      // Fallback to free plan if table doesn't exist
      setSubscription({ 
        plan_name: 'free', 
        status: 'active',
        user_id: userId,
        stripe_customer_id: '',
        stripe_subscription_id: '',
        current_period_end: ''
      })
    }
  }

  const fetchChannels = async (userId: string) => {
    const { data, error } = await supabase
      .from('agent_channels')
      .select('*')
      .eq('user_id', userId)

    if (data && !error) {
      setChannels(data)
    } else if (error) {
      console.warn('Channels fetch error:', error)
      // Set empty array if table doesn't exist or other error
      setChannels([])
    }
  }

  const fetchTrialInfo = async () => {
    try {
      const response = await fetch('/api/whatsapp/status')
      if (response.ok) {
        const data = await response.json()
        
        if (data.trial && data.trial.isActive) {
          const expiresAt = new Date(data.trial.expiresAt)
          const now = new Date()
          const diffTime = expiresAt.getTime() - now.getTime()
          const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          setTrialInfo({
            hasActiveTrial: true,
            daysRemaining: Math.max(0, daysRemaining),
            trialNumber: data.trial.phoneNumber,
            expiresAt: data.trial.expiresAt
          })
        } else {
          setTrialInfo({ hasActiveTrial: false, daysRemaining: 0 })
        }
      } else {
        // API error or no trial
        setTrialInfo({ hasActiveTrial: false, daysRemaining: 0 })
      }
    } catch (error) {
      console.error('Error fetching trial info:', error)
      setTrialInfo({ hasActiveTrial: false, daysRemaining: 0 })
    }
  }

  const ensureUserHasOrganization = async (user: User) => {
    try {
      setOrganizationSetupLoading(true)
      setOrganizationSetupError(null)
      setOrganizationSetupMessage(null)
      
      // Use the organization service to handle this automatically
      const result = await organizationService.ensureUserHasOrganization(user)
      
      if (result) {
        const { organization, wasCreated } = result
        setOrganizations([organization])
        setCurrentOrganization(organization)
        
        // Show appropriate message based on whether it was created or existed
        if (wasCreated) {
          setOrganizationSetupMessage(`Welcome! We've created "${organization.name}" for you.`)
        } else {
          setOrganizationSetupMessage(`Welcome back to ${organization.name}!`)
        }
        
        setTimeout(() => setOrganizationSetupMessage(null), 5000)
      } else {
        // Check if it's a database issue
        const isDatabaseReady = await organizationService.isDatabaseReady()
        if (!isDatabaseReady) {
          setShowSetupInstructions(true)
        } else {
          setOrganizationSetupError('Failed to create organization. Please try refreshing the page.')
        }
      }
    } catch (error) {
      console.error('Error ensuring user has organization:', error)
      setOrganizationSetupError('Failed to set up organization. Please try refreshing the page.')
    } finally {
      setOrganizationSetupLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Clear local state immediately to prevent UI issues
      setUser(null)
      setAgents([])
      setSubscription(null)
      setChannels([])
      setOrganizations([])
      setCurrentOrganization(null)
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Navigate to home page
      router.push('/')
    } catch (error) {
      console.error('Error during logout:', error)
      // Even if there's an error, still navigate away
      router.push('/')
    }
  }

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser)
  }

  const canCreateAgent = () => {
    const plan = organizations[0]?.user_subscription?.plan_name || subscription?.plan_name || 'free'
    if (plan === 'free') return agents.length < 1
    if (plan === 'basic' || plan === 'pro') return agents.length < 1
    if (plan === 'premium') return agents.length < 5
    return false
  }

  const getPlanFeatures = (planName: string) => {
    const features = {
      free: ['Trial Access', 'Basic Chat Only', 'Limited Messages'],
      basic: ['1 WhatsApp AI Agent', 'Chat Centralizado', 'CRM & Contactos', 'Workflows Básicos'],
      pro: ['Plan Básico +', 'Web AI Widget', 'Voice AI Agent', 'Pipeline de Ventas'],
      premium: ['Plan Pro +', '2 WhatsApp AI Agents', 'Instagram & Facebook', 'Email Marketing', 'Soporte Premium']
    }
    return features[planName as keyof typeof features] || features.free
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  // If user is null (logged out), don't render the dashboard
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-100 relative z-[90]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center cursor-pointer mr-6"
              >
                <motion.h1 
                  className="text-2xl lg:text-3xl font-black tracking-tight"
                  whileHover={{ scale: 1.02 }}
                >
                  <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                    Chayo
                  </span>
                  
                  {/* Animated dot */}
                  <motion.span
                    className="inline-block w-2 h-2 lg:w-2.5 lg:h-2.5 bg-gradient-to-r from-pink-500 to-orange-400 rounded-full ml-1"
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.h1>
              </motion.div>
              
              <div className="hidden md:block">
                <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
                {currentOrganization && (
                  <span className="text-sm text-gray-500">
                    {currentOrganization.name}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <PlanBadge plan={organizations[0]?.user_subscription?.plan_name || subscription?.plan_name || 'free'} />
              {user && (
                <UserProfile 
                  user={user} 
                  subscription={subscription}
                  onLogout={handleLogout}
                  onManageBilling={() => setShowPlansModal(true)}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Organization Setup Feedback */}
      {(organizationSetupLoading || organizationSetupMessage || organizationSetupError) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          {organizationSetupLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full mr-3"
                />
                <p className="text-blue-800">Setting up your organization...</p>
              </div>
            </div>
          )}
          
          {organizationSetupMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-800">{organizationSetupMessage}</p>
              </div>
            </motion.div>
          )}
          
          {organizationSetupError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-800">{organizationSetupError}</p>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* WhatsApp Trial Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        {trialInfo?.hasActiveTrial ? (
          /* Active Trial Banner */
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl border border-white/20"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2">
                    🎉 WhatsApp Trial Active
                  </h3>
                  <p className="text-white/90 mb-3">
                    Your 3-day WhatsApp trial is active! You have <strong>{trialInfo.daysRemaining} days remaining</strong> to test your AI agent on WhatsApp.
                  </p>
                  {trialInfo.trialNumber && (
                    <p className="text-white/80 text-sm mb-3">
                      Trial number: <code className="bg-white/20 px-2 py-1 rounded">{trialInfo.trialNumber}</code>
                    </p>
                  )}
                  <div className="flex items-center space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push('/integrations')}
                      className="bg-white text-blue-600 font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-md text-sm hover:shadow-lg"
                    >
                      Manage WhatsApp →
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowPlansModal(true)}
                      className="bg-white/20 border border-white/30 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm hover:bg-white/30"
                    >
                      Upgrade Plan
                    </motion.button>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {trialInfo.daysRemaining}
                </div>
                <div className="text-white/80 text-sm">
                  days left
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Trial Promotion Banner */
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl border border-white/20"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2">
                    🚀 Start Your 3-Day WhatsApp AI Trial
                  </h3>
                  <p className="text-white/90 mb-4">
                    Get instant access to intelligent WhatsApp automation with your AI agent. Your customers can chat naturally while your AI handles:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center space-x-2 text-white/90">
                      <svg className="w-4 h-4 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">Customer inquiries & support</span>
                    </div>
                    <div className="flex items-center space-x-2 text-white/90">
                      <svg className="w-4 h-4 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">Appointment scheduling</span>
                    </div>
                    <div className="flex items-center space-x-2 text-white/90">
                      <svg className="w-4 h-4 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">Inventory management</span>
                    </div>
                    <div className="flex items-center space-x-2 text-white/90">
                      <svg className="w-4 h-4 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">Product recommendations</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (agents.length === 0) {
                          setShowCreateModal(true)
                        } else {
                          router.push('/integrations')
                        }
                      }}
                      className="bg-white text-green-600 font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-md text-sm hover:shadow-lg"
                    >
                      Start Free Trial →
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowPlansModal(true)}
                      className="bg-white/20 border border-white/30 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm hover:bg-white/30"
                    >
                      View Plans
                    </motion.button>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  3
                </div>
                <div className="text-white/80 text-sm">
                  days free
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
              <div className="mb-6">
                <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                  Quick Actions
                </h2>
                
                {/* Quick Navigation */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Navigation
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab('agents')}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                        activeTab === 'agents'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg'
                          : 'text-gray-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        AI Agents ({agents.length})
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('performance')}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                        activeTab === 'performance'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg'
                          : 'text-gray-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Performance
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('users')}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                        activeTab === 'users'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg'
                          : 'text-gray-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        Team ({currentOrganization?.team_members?.length || (currentOrganization ? 1 : 0)})
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                        activeTab === 'profile'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg'
                          : 'text-gray-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile Settings
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreateModal(true)}
                  disabled={!canCreateAgent()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-lg"
                >
                  Create Agent
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPlansModal(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-lg"
                >
                  {(organizations[0]?.user_subscription?.plan_name || subscription?.plan_name || 'free') === 'free' ? 'Upgrade Plan' : 'Change Plan'}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/integrations')}
                  className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-lg"
                >
                  Connect Channels
                </motion.button>
              </div>

              {/* Plan Features */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Your Plan Features
                </h3>
                <ul className="space-y-2">
                  {getPlanFeatures(organizations[0]?.user_subscription?.plan_name || subscription?.plan_name || 'free').map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-2 shadow-lg border border-white/20">
                <nav className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('agents')}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
                      activeTab === 'agents'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700'
                    }`}
                  >
                    AI Agents
                  </button>
                  <button
                    onClick={() => setActiveTab('performance')}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
                      activeTab === 'performance'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700'
                    }`}
                  >
                    Performance
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
                      activeTab === 'users'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700'
                    }`}
                  >
                    Team
                  </button>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
                      activeTab === 'profile'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700'
                    }`}
                  >
                    Profile
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'agents' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    Your AI Agents
                  </h2>
                  <p className="text-gray-600">
                    Manage your AI agents and their channel connections
                  </p>
                </div>

                {agents.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 text-center border border-white/20"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      No agents yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Create your first AI agent to start automating customer interactions
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowCreateModal(true)}
                      disabled={!canCreateAgent()}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
                    >
                      Create Your First Agent
                    </motion.button>
                  </motion.div>
                ) : (
                  <>
                    {/* Tutorial section for agents without channels */}
                    {agents.length > 0 && channels.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6 border border-blue-200/50"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              🎉 Great! Your agents are ready
                            </h3>
                            <p className="text-gray-600 mb-4">
                              Now connect your agents to communication channels like WhatsApp, SMS, or website chat to start serving customers.
                            </p>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => router.push('/integrations')}
                              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-md text-sm"
                            >
                              Connect Channels →
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {agents.map((agent, index) => (
                        <motion.div
                          key={agent.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <AgentCard 
                            agent={agent}
                            channels={channels.filter(c => c.agent_id === agent.id)}
                            onEdit={() => {
                              setEditingAgent(agent)
                              setShowEditModal(true)
                            }}
                            onTogglePause={() => {
                              // Update agent pause status
                              fetch(`/api/agents/${agent.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ paused: !agent.paused })
                              }).then(() => fetchAgents())
                            }}
                            onDelete={() => {
                              // Delete agent
                              fetch(`/api/agents/${agent.id}`, {
                                method: 'DELETE'
                              }).then(() => fetchAgents())
                            }}
                            onManageDocuments={() => {
                              setManagingAgentId(agent.id)
                              setManagingAgentName(agent.name)
                              setShowManageDocsModal(true)
                            }}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
                
                {/* Channel Status Widget */}
                {agents.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8"
                  >
                    <ChannelStatusWidget agentId={agents[0]?.id} />
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'performance' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    Performance Analytics
                  </h2>
                  <p className="text-gray-600">
                    Comprehensive insights into your AI platform's performance and engagement
                  </p>
                </div>
                <PerformanceOverview />
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {showSetupInstructions ? (
                  <SetupInstructions onRetry={() => {
                    setShowSetupInstructions(false)
                    if (user) {
                      ensureUserHasOrganization(user)
                    }
                  }} />
                ) : currentOrganization ? (
                  <TeamManagement 
                    organizationId={currentOrganization.id}
                    organizationName={currentOrganization.name}
                  />
                ) : (
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 text-center border border-white/20">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Setting up your workspace...
                    </h3>
                    <p className="text-gray-600 mb-6">
                      We're automatically creating your team organization. This will only take a moment.
                    </p>
                    <div className="flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full"
                      />
                      <span className="ml-2 text-sm text-gray-600">Initializing team workspace...</span>
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                      Every user automatically gets their own organization for team collaboration
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'profile' && user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ProfileSettings 
                  user={user} 
                  onUserUpdate={handleUserUpdate}
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Create Agent Modal */}
      {showCreateModal && (
        <CreateAgentModal
          onClose={() => {
            setShowCreateModal(false)
            // Refresh agents in case an agent was created but user closed modal before completing
            fetchAgents()
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchAgents()
          }}
        />
      )}

      {/* Edit Agent Modal */}
      {showEditModal && editingAgent && (
        <EditAgentModal
          agent={editingAgent}
          onClose={() => {
            setShowEditModal(false)
            setEditingAgent(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setEditingAgent(null)
            fetchAgents()
          }}
        />
      )}

      {/* Subscription Plans Modal */}
      {showPlansModal && (
        <SubscriptionPlans
          currentSubscription={subscription}
          targetPlan={targetPlan || undefined}
          onClose={() => {
            setShowPlansModal(false)
            setTargetPlan(null)
          }}
          onSubscriptionUpdate={() => {
            setShowPlansModal(false)
            setTargetPlan(null)
            if (user) {
              fetchSubscription(user.id)
            }
          }}
        />
      )}

      {/* Manage Documents Modal */}
      {showManageDocsModal && managingAgentId && (
        <ManageDocumentsModal
          agentId={managingAgentId}
          agentName={managingAgentName}
          onClose={() => {
            setShowManageDocsModal(false)
            setManagingAgentId(null)
            setManagingAgentName('')
          }}
        />
      )}
    </div>
  )
}
