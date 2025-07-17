'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import type { User } from '@supabase/supabase-js'
import PlanBadge from '@/components/dashboard/PlanBadge'
import SubscriptionPlans from '@/components/dashboard/SubscriptionPlans'
import ManageDocumentsModal from '@/components/dashboard/ManageDocumentsModal'
import PerformanceOverview from '@/components/dashboard/PerformanceOverview'
import TeamManagement from '@/components/dashboard/TeamManagement'
import SetupInstructions from '@/components/dashboard/SetupInstructions'
import ProfileSettings from '@/components/dashboard/ProfileSettings'
import ChatMessage from '@/components/dashboard/ChatMessage'
import { organizationService } from '@/lib/services/organizationService'

interface Message {
  id: string
  role: "user" | "ai" | "system"
  content: string
  timestamp: Date
  usingRAG?: boolean
}

interface Agent {
  id: string
  name: string
  greeting: string
  tone: string
  goals: string[]
  system_prompt: string
  paused: boolean
  created_at: string
  business_constraints?: {
    greeting?: string
    goals?: string[]
    name?: string
    industry?: string
    values?: string[]
    policies?: string[]
    contact_info?: string
    custom_rules?: string[]
  }
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

declare global {
  interface Window {
    deferredPrompt?: any;
  }
}

export default function Dashboard() {
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);

  useEffect(() => {
    if (isMobileDevice() && !isInStandaloneMode()) {
      setShowPwaPrompt(true);
    }
  }, []);

  const handleInstallClick = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      alert('To install Chayo AI:\n\n1. Tap the Share button (📤) in your browser\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm');
    } else if (isAndroid) {
      alert('To install Chayo AI:\n\n1. Tap the menu button (⋮) in your browser\n2. Tap "Install app" or "Add to Home screen"\n3. Tap "Install" to confirm');
    } else {
      alert('To install Chayo AI, use your browser\'s menu to add this page to your home screen.');
    }
  };

  if (showPwaPrompt) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center">
          <h2 className="text-xl font-bold mb-2">Install Chayo AI</h2>
          <p className="mb-4">
            To use Chayo AI on your phone, simply tap the button below to install the app.
          </p>
          <button
            onClick={handleInstallClick}
            className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold"
          >
            Install App
          </button>
        </div>
      </div>
    );
  }

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

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
}

function DashboardContent() {
  const t = useTranslations('chat')
  const locale = useLocale()
  const [user, setUser] = useState<User | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  const [showPlansModal, setShowPlansModal] = useState(false)
  const [showManageDocsModal, setShowManageDocsModal] = useState(false)
  const [managingAgentId, setManagingAgentId] = useState<string | null>(null)
  const [managingAgentName, setManagingAgentName] = useState<string>('')
  const [activeView, setActiveView] = useState<'chat' | 'agents' | 'performance' | 'users' | 'profile'>('chat')
  const [showSetupInstructions, setShowSetupInstructions] = useState(false)
  const [organizationSetupLoading, setOrganizationSetupLoading] = useState(false)
  const [organizationSetupMessage, setOrganizationSetupMessage] = useState<string | null>(null)
  const [organizationSetupError, setOrganizationSetupError] = useState<string | null>(null)
  const [targetPlan, setTargetPlan] = useState<string | null>(null)
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false)
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const [chatBottomPadding, setChatBottomPadding] = useState(72); // default input bar height

  // Best mobile chat scroll UX: always scroll to bottom on new message, input focus, or keyboard open
  const scrollChatToBottom = (smooth = true) => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
    }
  };

  // Listen for visualViewport resize to adjust chat padding and scroll
  useEffect(() => {
    if (!isMobile) return;
    let resizeTimeout: any;
    const updatePaddingAndScroll = () => {
      let keyboardHeight = 0;
      if (window.visualViewport) {
        keyboardHeight = window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop;
      }
      const padding = Math.max(72, keyboardHeight);
      setChatBottomPadding(padding);
      // Scroll to bottom after keyboard animation
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        scrollChatToBottom();
      }, 400);
    };
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updatePaddingAndScroll);
    } else {
      window.addEventListener('resize', updatePaddingAndScroll);
    }
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updatePaddingAndScroll);
      } else {
        window.removeEventListener('resize', updatePaddingAndScroll);
      }
      clearTimeout(resizeTimeout);
    };
  }, [isMobile]);

  // On input focus, scroll chat to bottom (mobile)
  const handleInputFocus = () => {
    if (isMobile) {
      setTimeout(() => {
        scrollChatToBottom();
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 400);
    }
  };

  // Always scroll to bottom on new message (mobile)
  useEffect(() => {
    if (isMobile) {
      scrollChatToBottom();
    }
  }, [messages, isMobile]);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    const handleResize = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Dynamic 100vh fix for mobile browsers
    const setVh = () => {
      document.body.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true
    
    // Debug: log code from URL
    const code = searchParams.get('code')
    if (code) {
      console.log('Dashboard: code in URL', code)
    }

    // Debug: log Supabase session
    supabase.auth.getSession().then(({ data, error }) => {
      console.log('Dashboard: Supabase session', data?.session, error)
    })
    
    const getUser = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const pollForUser = async (attempts = 0) => {
          const maxAttempts = 5
          const delay = 500
          
          try {
            const { data: { user } } = await supabase.auth.getUser()
            
            if (!isMounted) return
            
            if (user) {
              console.log('Dashboard: User found', user.email)
              setUser(user)
              
              await ensureUserHasOrganization(user)
              
              await Promise.all([
                fetchAgents(),
                fetchSubscription(user.id)
              ])
              return
            }
            
            if (attempts < maxAttempts) {
              console.log(`Dashboard: No user found, retrying... (${attempts + 1}/${maxAttempts})`)
              await new Promise(resolve => setTimeout(resolve, delay))
              return pollForUser(attempts + 1)
            }
            
            console.log('Dashboard: No user found after all attempts, showing chat for unauthenticated user')
            setUser(null)
          } catch (error) {
            console.error('Dashboard: Error getting user:', error)
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, delay))
              return pollForUser(attempts + 1)
            }
            
            if (isMounted) {
              setUser(null)
            }
          }
        }
        
        await pollForUser()
      } catch (error) {
        console.error('Dashboard: Error in getUser:', error)
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Dashboard: Auth state change:', event, session?.user?.email)
        
        if (!isMounted) return
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Dashboard: User signed in via auth state change')
          setUser(session.user)
          setLoading(true)
          
          await ensureUserHasOrganization(session.user)
          await Promise.all([
            fetchAgents(),
            fetchSubscription(session.user.id)
          ])
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          console.log('Dashboard: User signed out')
          setUser(null)
          setAgents([])
          setSubscription(null)
          setOrganizations([])
          setCurrentOrganization(null)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Dashboard: Token refreshed')
          setUser(session.user)
        }
      }
    )

    getUser()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router, supabase.auth])

  useEffect(() => {
    const showPlans = searchParams.get('showPlans')
    const targetPlanParam = searchParams.get('targetPlan')
    
    if (showPlans === 'true' && !loading && user) {
      setShowPlansModal(true)
      setTargetPlan(targetPlanParam)
      
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('showPlans')
      newUrl.searchParams.delete('targetPlan')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [searchParams, loading, user])

  // Chat functionality
  useEffect(() => {
    loadAgents()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, chatLoading])

  const loadAgents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!org) return

      const { data: agents, error } = await supabase
        .from('agents')
        .select('*')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading agents:', error)
        return
      }

      setAgents(agents || [])
      if (agents && agents.length > 0 && !selectedAgent) {
        setSelectedAgent(agents[0])
        // Build business info summary if available
        const constraints = agents[0].business_constraints || {}
        const { industry, name, products_services, target_customers } = constraints
        let summary = ''
        if (industry || name || (products_services && products_services.length) || target_customers) {
          summary = 'Welcome back! I remember your business'
          if (industry) summary += ` is a ${industry}`
          if (name) summary += ` called ${name}`
          if (products_services && products_services.length)
            summary += `, offering ${products_services.join(", ")}`
          if (target_customers) summary += ` to ${target_customers}`
          summary += '. Let me know if anything has changed!'
        }
        setMessages([
          ...(summary ? [{
            id: 'business-summary',
            role: 'ai' as const,
            content: summary,
            timestamp: new Date()
          }] : []),
          {
            id: 'greeting',
            role: 'ai' as const,
            content: constraints.greeting || `Hi! I'm ${agents[0].name}. How can I help you today?`,
            timestamp: new Date()
          }
        ])
      } else if (!agents || agents.length === 0) {
        setMessages([{
          id: 'welcome',
          role: 'ai',
          content: 'Hi! I\'m your business AI assistant. I\'m here to help you with your business needs. Tell me about your business and I\'ll learn to assist you better!',
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Error loading agents:', error)
      setMessages([{
        id: 'welcome',
        role: 'ai',
        content: 'Hi! I\'m your business AI assistant. I\'m here to help you with your business needs. Tell me about your business and I\'ll learn to assist you better!',
        timestamp: new Date()
      }])
    }
  }

  const handleSend = async () => {
    if (!input.trim() || chatLoading) return
    
    setChatError(null)
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    }
    
    setMessages((msgs) => [...msgs, newUserMsg])
    setInput("")
    setChatLoading(true)
    
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newUserMsg].map(({ role, content }) => ({ 
            role: role === "ai" ? "assistant" : role, 
            content 
          })),
          ...(selectedAgent && { agentId: selectedAgent.id })
        })
      })
      
      if (!res.ok) {
        const data = await res.json()
        setChatError(data.error || "Error sending message")
        setChatLoading(false)
        return
      }
      
      const data = await res.json()
      
      if (data.agent && !selectedAgent) {
        setSelectedAgent(data.agent)
      }
      
      setMessages((msgs) => [
        ...msgs,
        { 
          id: Date.now().toString() + "-ai", 
          role: "ai", 
          content: data.aiMessage,
          timestamp: new Date(),
          usingRAG: data.usingRAG
        }
      ])
    } catch (err) {
      setChatError("Error sending message")
    } finally {
      setChatLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const fetchAgents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!org) return

      const { data: agents, error } = await supabase
        .from('agents')
        .select('*')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching agents:', error)
        return
      }

      setAgents(agents || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  const fetchSubscription = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (data && !error) {
        setSubscription(data)
      } else if (error && error.code === 'PGRST116') {
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
        setSubscription({ 
          plan_name: 'free', 
          status: 'active',
          user_id: userId,
          stripe_customer_id: '',
          stripe_subscription_id: '',
          current_period_end: ''
        })
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }



  const ensureUserHasOrganization = async (user: User) => {
    try {
      setOrganizationSetupLoading(true)
      setOrganizationSetupError(null)
      setOrganizationSetupMessage(null)
      
      const result = await organizationService.ensureUserHasOrganization(user)
      
      if (result) {
        const { organization, wasCreated } = result
        setOrganizations([organization])
        setCurrentOrganization(organization)
        
        if (wasCreated) {
          setOrganizationSetupMessage(`Organization "${organization.name}" created successfully!`)
        } else {
          setOrganizationSetupMessage(`Welcome back to "${organization.name}"!`)
        }
        
        setTimeout(() => setOrganizationSetupMessage(null), 5000)
      } else {
        const isDatabaseReady = await organizationService.isDatabaseReady()
        if (!isDatabaseReady) {
          setShowSetupInstructions(true)
        } else {
          setOrganizationSetupError('Failed to create organization')
        }
      }
    } catch (error) {
      console.error('Error ensuring user has organization:', error)
      setOrganizationSetupError('Organization setup failed')
    } finally {
      setOrganizationSetupLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      setUser(null)
      setAgents([])
      setSubscription(null)
      setOrganizations([])
      setCurrentOrganization(null)
      
      await supabase.auth.signOut()
      
      router.push('/')
    } catch (error) {
      console.error('Error during logout:', error)
      router.push('/')
    }
  }

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser)
  }

  // Add to DashboardContent function, after chat state declarations:
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadProgress(0)
    setChatError(null)

    // Show a message in the chat that the file is being uploaded
    setMessages((msgs) => [
      ...msgs,
      {
        id: Date.now().toString() + '-file',
        role: 'user',
        content: `Uploading file: ${file.name}`,
        timestamp: new Date()
      }
    ])

    // Upload the file to the backend
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        setChatError('File upload failed')
        setUploading(false)
        setUploadProgress(null)
        return
      }
      const data = await res.json()
      setMessages((msgs) => [
        ...msgs,
        {
          id: Date.now().toString() + '-file-success',
          role: 'user',
          content: `Uploaded file: ${file.name}`,
          timestamp: new Date()
        }
      ])
      // Optionally, you can trigger a message to the AI about the uploaded file here
    } catch (err) {
      setChatError('File upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Unauthenticated banner */}
      {!user && (
        <div className="w-full max-w-2xl mx-auto text-center pt-8 mb-4">
          <div className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold mb-2">
            You are not signed in. Start chatting below to authenticate.
          </div>
        </div>
      )}
      <div
        className="w-full md:max-w-4xl mx-auto px-0 sm:px-6 lg:px-8 py-4 flex flex-col"
        style={isMobile ? { paddingBottom: 0 } : {}}
      >
        <div
          className="w-full flex-1 flex flex-col items-center relative chat-wrapper"
          style={isMobile ? { minHeight: 'calc(var(--vh, 1vh) * 100)', height: 'calc(var(--vh, 1vh) * 100)', position: 'relative' } : {}}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col w-full md:rounded-2xl md:border md:border-gray-200 md:shadow-lg bg-white/80 md:max-h-[70vh] md:overflow-hidden"
            style={{ minHeight: '320px', height: isMobile ? '100dvh' : undefined, position: isMobile ? 'relative' : undefined }}
          >
            <div
              className="flex-1 overflow-y-auto px-1 pb-2 md:px-6 md:py-4 md:max-h-[60vh]"
              ref={chatScrollContainerRef}
              onClick={() => { if (isMobile && !hasUserInteracted) setHasUserInteracted(true); }}
              style={isMobile ? { paddingBottom: chatBottomPadding, boxSizing: 'border-box', overscrollBehavior: 'contain', height: '100dvh', maxHeight: '100dvh' } : {}}
            >
                {messages.length === 0 && !chatLoading && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-md">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{t('emptyTitle')}</h3>
                      <p className="text-gray-600 mb-4">{t('emptySubtitle')}</p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                        <p className="text-sm text-blue-800 mb-2"><strong>{t('emptyGettingStarted')}</strong></p>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• {t('emptyStepBusiness')}</li>
                          <li>• {t('emptyStepChallenges')}</li>
                          <li>• {t('emptyStepUpload')}</li>
                          <li>• {t('emptyStepAsk')}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                <AnimatePresence>
                  {messages.map((msg) => (
                    <ChatMessage 
                      key={msg.id} 
                      role={msg.role} 
                      content={msg.content} 
                      timestamp={msg.timestamp} 
                      usingRAG={msg.usingRAG}
                    />
                  ))}
                  {chatLoading && (
                    <div className="py-6 bg-gray-50">
                      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-start">
                          <div className="flex items-start space-x-4 max-w-3xl">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="inline-block bg-white text-gray-900 rounded-2xl px-4 py-3 shadow-sm">
                                <div className="flex items-center space-x-1">
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                  </div>
                                  <span className="text-sm text-gray-500 ml-2">{t('loading')}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {chatError && (
                    <ChatMessage 
                      role="ai" 
                      content={chatError} 
                      timestamp={new Date()} 
                    />
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            {/* Chat Input */}
            {/* Desktop/Tablet: original input bar */}
            <div className="hidden md:block flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-end space-x-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex-shrink-0 p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    title={t('uploadTitle')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  <div className="flex-1 relative md:max-w-2xl">
                    <textarea
                      placeholder={t('inputPlaceholder')}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value)
                        e.target.style.height = 'auto'
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSend()
                        }
                      }}
                      ref={inputRef as any}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white"
                      rows={1}
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                      disabled={uploading}
                      onFocus={handleInputFocus}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={chatLoading || uploading || !input.trim()}
                    className="flex-shrink-0 p-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                {uploading && (
                  <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{t('uploading')}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Mobile: absolutely positioned input bar at bottom of chat container */}
            <div
              className="md:hidden border-t border-gray-200 bg-white px-4 py-3"
              style={{
                position: isMobile ? 'absolute' : undefined,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                zIndex: 50,
                boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div className="flex items-end space-x-2 max-w-2xl mx-auto">
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-shrink-0 p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  title={t('uploadTitle')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <div className="flex-1 relative">
                  <textarea
                    placeholder={t('inputPlaceholder')}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value)
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    ref={inputRef as any}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white"
                    rows={1}
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                    disabled={uploading}
                    onFocus={handleInputFocus}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={chatLoading || uploading || !input.trim()}
                  className="flex-shrink-0 p-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              {uploading && (
                <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{t('uploading')}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      {/* Modals */}
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
