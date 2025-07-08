'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
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
  plan_name: string
  created_at: string
  team_members?: Array<{
    id: string
    user_id: string
    role: string
    status: string
    joined_at: string
  }>
}

interface AgentChannel {
  id: string
  agent_id: string
  channel_type: string
  connected: boolean
  credentials: any
}

export default function Dashboard() {
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
  const [activeTab, setActiveTab] = useState<'agents' | 'performance' | 'users'>('agents')
  const [showSetupInstructions, setShowSetupInstructions] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        await Promise.all([
          fetchAgents(),
          fetchSubscription(user.id),
          fetchChannels(user.id),
          fetchOrganizations()
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
      } else {
        console.error('Failed to fetch agents')
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
    }
  }

  const fetchChannels = async (userId: string) => {
    const { data, error } = await supabase
      .from('agent_channels')
      .select(`
        *,
        agents!inner(user_id)
      `)
      .eq('agents.user_id', userId)

    if (data && !error) {
      setChannels(data)
    }
  }

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const { organizations } = await response.json()
        console.log('Fetched organizations:', organizations)
        setOrganizations(organizations || [])
        if (organizations && organizations.length > 0) {
          setCurrentOrganization(organizations[0])
        } else {
          // If no organizations exist, create a default one
          console.log('No organizations found, creating default organization')
          await createDefaultOrganization()
        }
      } else {
        console.error('Failed to fetch organizations:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error details:', errorData)
        setOrganizations([])
        // Try to create a default organization
        await createDefaultOrganization()
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
      setOrganizations([])
      // Try to create a default organization
      await createDefaultOrganization()
    }
  }

  const createDefaultOrganization = async () => {
    if (!user) return

    try {
      console.log('Creating default organization via setup API')

      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const { organization, message } = await response.json()
        setOrganizations([organization])
        setCurrentOrganization(organization)
        console.log('Setup completed:', message, organization)
      } else {
        const { error, migrationInstructions } = await response.json()
        console.error('Setup failed:', error)
        if (migrationInstructions) {
          console.log('Migration instructions:', migrationInstructions)
          setShowSetupInstructions(true)
        }
      }
    } catch (error) {
      console.error('Error during setup:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const canCreateAgent = () => {
    const plan = subscription?.plan_name || 'free'
    if (plan === 'free') return agents.length < 1
    if (plan === 'basic' || plan === 'pro') return agents.length < 1
    if (plan === 'premium') return agents.length < 5
    return false
  }

  const getPlanFeatures = (planName: string) => {
    const features = {
      free: ['1 Agent', 'Basic Chat Only', 'Limited Messages'],
      basic: ['1 Agent', 'Basic Workflows', 'WhatsApp Integration'],
      pro: ['1 Agent + Voice', 'CRM Integration', 'Instagram & Facebook', 'Forms & Automation'],
      premium: ['5 Agents', 'All Channels', 'Priority Support', 'Advanced Analytics']
    }
    return features[planName as keyof typeof features] || features.free
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Chayo Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <PlanBadge plan={subscription?.plan_name || 'free'} />
              <UserProfile 
                user={user!} 
                subscription={subscription}
                onLogout={handleLogout}
                onManageBilling={() => setShowPlansModal(true)}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              
              {/* Quick Navigation */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Quick Navigation
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('agents')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === 'agents'
                        ? 'bg-orange-100 text-orange-800 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
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
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === 'performance'
                        ? 'bg-orange-100 text-orange-800 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
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
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === 'users'
                        ? 'bg-orange-100 text-orange-800 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      Team ({currentOrganization?.team_members?.length || 0})
                    </div>
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  disabled={!canCreateAgent()}
                  className="w-full bg-orange-400 hover:bg-orange-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Create Agent
                </button>
                
                <button
                  onClick={() => setShowPlansModal(true)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {subscription?.plan_name === 'free' ? 'Upgrade Plan' : 'Change Plan'}
                </button>
                
                <button
                  onClick={() => router.push('/integrations')}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Connect Channels
                </button>
              </div>

              {/* Plan Features */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Your Plan Features
                </h3>
                <ul className="space-y-2">
                  {getPlanFeatures(subscription?.plan_name || 'free').map((feature, index) => (
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
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('agents')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'agents'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    AI Agents
                  </button>
                  <button
                    onClick={() => setActiveTab('performance')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'performance'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Performance Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'users'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Team Management
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
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
                    className="bg-white rounded-lg shadow p-8 text-center"
                  >
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No agents yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Create your first AI agent to start automating customer interactions
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      disabled={!canCreateAgent()}
                      className="bg-orange-400 hover:bg-orange-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors"
                    >
                      Create Your First Agent
                    </button>
                  </motion.div>
                ) : (
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
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
                    fetchOrganizations()
                  }} />
                ) : currentOrganization ? (
                  <TeamManagement 
                    organizationId={currentOrganization.id}
                    organizationName={currentOrganization.name}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Setting up your organization...
                    </h3>
                    <p className="text-gray-600 mb-6">
                      We're creating your team workspace. This should only take a moment.
                    </p>
                    <div className="flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full"
                      />
                      <span className="ml-2 text-sm text-gray-600">Creating organization...</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Create Agent Modal */}
      {showCreateModal && (
        <CreateAgentModal
          onClose={() => setShowCreateModal(false)}
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
          onClose={() => setShowPlansModal(false)}
          onSubscriptionUpdate={() => {
            setShowPlansModal(false)
            fetchSubscription(user!.id)
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
