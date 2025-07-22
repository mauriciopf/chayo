'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

// Import our new components and hooks
import { useAuth } from '@/components/dashboard/hooks/useAuth'
import { useChat } from '@/components/dashboard/hooks/useChat'
import { useMobile } from '@/components/dashboard/hooks/useMobile'
import { useDashboardInit } from '@/components/dashboard/hooks/useDashboardInit'
import { useAutoStartChat } from '@/components/dashboard/hooks/useAutoStartChat'
import { useAuthFlow } from '@/components/dashboard/AuthFlow'
import ChatContainer from '@/components/dashboard/ChatContainer'
import ClientQRCode from '@/components/dashboard/ClientQRCode'
import MobileHeader from '@/components/dashboard/MobileHeader'
import MobileNavigation from '@/components/dashboard/MobileNavigation'
import DesktopNavigation from '@/components/dashboard/DesktopNavigation'
import AgentsView from '@/components/dashboard/AgentsView'
import PWAPrompt from '@/components/dashboard/PWAPrompt'
import BusinessSummary from '@/components/dashboard/BusinessSummary'
import { ActiveView, Agent } from '@/components/dashboard/types'

// Import existing dashboard components
import PlanBadge from '@/components/dashboard/PlanBadge'
import SubscriptionPlans from '@/components/dashboard/SubscriptionPlans'
import ManageDocumentsModal from '@/components/dashboard/ManageDocumentsModal'
import PerformanceOverview from '@/components/dashboard/PerformanceOverview'
import TeamManagement from '@/components/dashboard/TeamManagement'
import ProfileSettings from '@/components/dashboard/ProfileSettings'
import SetupInstructions from '@/components/dashboard/SetupInstructions'

declare global {
  interface Window {
    deferredPrompt?: any;
  }
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
      <PWAPrompt />
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const t = useTranslations('chat')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Initialize all hooks
  const auth = useAuth()
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  
  // Initialize dashboard data
  const dashboardInit = useDashboardInit(locale)
  
  // Check if all dependencies are ready for auto-start
  const isAutoStartReady = !!(
    dashboardInit.initData && 
    !dashboardInit.isLoading && 
    selectedAgent && 
    auth.user && 
    !auth.loading &&
    dashboardInit.initData.shouldAutoStartChat &&
    dashboardInit.initData.initialChatMessage
  )
  

  
  // Auto-start chat when dashboard data is ready
  const autoStartChat = useAutoStartChat(
    selectedAgent?.id || null,
    dashboardInit.initData?.shouldAutoStartChat || false,
    dashboardInit.initData?.initialChatMessage,
    locale,
    isAutoStartReady
  )
  
  // Initialize mobile hook with placeholder scroll function
  const mobile = useMobile(() => {})
  
  // Initialize chat hook without OTP flow (we'll pass it directly to ChatContainer)
  const chat = useChat({
    authState: auth.authState,
    selectedAgent,
    setSelectedAgent,
    user: auth.user,
    isMobile: mobile.isMobile,
    pendingName: auth.pendingName,
    pendingEmail: auth.pendingEmail,
    otpLoading: auth.otpLoading,
    setOtpError: auth.setOtpError,
    setOtpSent: auth.setOtpSent,
    setResendCooldown: auth.setResendCooldown,
    setAuthState: auth.setAuthState,
    locale
  })

  // Initialize auth flow with chat state
  const authFlow = useAuthFlow({
    authState: auth.authState,
    setAuthState: auth.setAuthState,
    input: chat.input,
    setInput: chat.setInput,
    setJustSent: chat.setJustSent,
    isMobile: mobile.isMobile,
    inputRef: chat.inputRef,
    pendingName: auth.pendingName,
    setPendingName: auth.setPendingName,
    pendingEmail: auth.pendingEmail,
    setPendingEmail: auth.setPendingEmail,
    otpLoading: auth.otpLoading,
    setOtpLoading: auth.setOtpLoading,
    otpError: auth.otpError,
    setOtpError: auth.setOtpError,
    otpSent: auth.otpSent,
    setOtpSent: auth.setOtpSent,
    resendCooldown: auth.resendCooldown,
    setResendCooldown: auth.setResendCooldown,
    messages: chat.messages,
    setMessages: chat.setMessages,
  })

  // No need for additional effects - we'll pass handleOTPFlow directly to ChatContainer

  // Dashboard UI state - desktop shows chat, mobile shows agents (PWA install)
  const [activeView, setActiveView] = useState<ActiveView>(mobile.isMobile ? 'agents' : 'chat')
  const [showPlansModal, setShowPlansModal] = useState(false)
  const [showManageDocsModal, setShowManageDocsModal] = useState(false)
  const [managingAgentId, setManagingAgentId] = useState<string | null>(null)
  const [managingAgentName, setManagingAgentName] = useState<string>('')
  const [showSetupInstructions, setShowSetupInstructions] = useState(false)
  const [organizationSetupLoading, setOrganizationSetupLoading] = useState(false)
  const [organizationSetupMessage, setOrganizationSetupMessage] = useState<string | null>(null)
  const [organizationSetupError, setOrganizationSetupError] = useState<string | null>(null)
  const [targetPlan, setTargetPlan] = useState<string | null>(null)
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [businessInfoGathered, setBusinessInfoGathered] = useState(0)

  // Check business info gathered count to show QR code
  useEffect(() => {
    const checkBusinessInfo = async () => {
      if (auth.user && auth.currentOrganization && businessInfoGathered >= 5) {
        setShowQRCode(true)
      }
    }
    checkBusinessInfo()
  }, [auth.user, auth.currentOrganization, businessInfoGathered])

  // Monitor chat messages for QR code trigger
  useEffect(() => {
    // Check if any recent message mentions QR code generation
    const recentMessages = chat.messages.slice(-5) // Check last 5 messages instead of 3
    const hasQRMention = recentMessages.some(msg => 
      msg.role === 'ai' && (
        msg.content.includes('QR code') || 
        msg.content.includes('QR') ||
        msg.content.includes('código QR') ||
        msg.content.includes('client chat system') ||
        msg.content.includes('sistema de chat con los clientes') ||
        msg.content.includes('available in your dashboard') ||
        msg.content.includes('disponible en su panel') ||
        msg.content.includes('Generaré un código QR') ||
        msg.content.includes('generate a QR code') ||
        msg.content.includes('share with your customers') ||
        msg.content.includes('compartir con sus clientes') ||
        msg.content.includes('chat directly with your personalized') ||
        msg.content.includes('chatear directamente con su') ||
        msg.content.includes('configurar su sistema de chat')
      )
    )
    
    console.log('QR Code Detection:', {
      hasQRMention,
      selectedAgent: !!selectedAgent,
      recentMessagesCount: recentMessages.length,
      lastMessage: recentMessages[recentMessages.length - 1]?.content?.substring(0, 100)
    })
    
    if (hasQRMention && selectedAgent) {
      console.log('🎯 QR Code trigger detected! Switching to QR view and showing QR code component.')
      setShowQRCode(true)
      // Automatically switch to QR code view
      setActiveView('qrcode')
    }
  }, [chat.messages, selectedAgent])

  // Also check business info gathered count directly
  useEffect(() => {
    const checkBusinessInfoCount = async () => {
      if (auth.user && auth.currentOrganization && selectedAgent) {
        try {
          // Check business constraints directly
          const { data: viewData, error } = await supabase
            .from('business_constraints_view')
            .select('business_constraints')
            .eq('organization_id', auth.currentOrganization.id)
            .single()

          if (viewData && viewData.business_constraints && viewData.business_constraints.business_info_gathered >= 5) {
            console.log('🎯 Business info count trigger detected! Showing QR code component.')
            setShowQRCode(true)
            setBusinessInfoGathered(viewData.business_constraints.business_info_gathered)
          }
        } catch (error) {
          console.error('Error checking business info count:', error)
        }
      }
    }

    checkBusinessInfoCount()
  }, [auth.user, auth.currentOrganization, selectedAgent, chat.messages, supabase])

  // Handle URL params for plans
  useEffect(() => {
    const showPlans = searchParams.get('showPlans')
    const targetPlanParam = searchParams.get('targetPlan')
    
    if (showPlans === 'true' && !auth.loading && auth.user) {
      setShowPlansModal(true)
      setTargetPlan(targetPlanParam)
      
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('showPlans')
      newUrl.searchParams.delete('targetPlan')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [searchParams, auth.loading, auth.user])

  // Legacy scroll effect (keeping for compatibility)
  useEffect(() => {
    chat.messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chat.messages, chat.chatLoading])

  // Load agents and business data from dashboard init service
  useEffect(() => {
    if (dashboardInit.initData && !dashboardInit.isLoading) {
      // Use agents from dashboard init
      if (dashboardInit.initData.agents && dashboardInit.initData.agents.length > 0) {
        // Set agents in auth state for compatibility
        auth.setAgents(dashboardInit.initData.agents)
        
        // Set the first agent as selected if none selected
        if (!selectedAgent) {
          console.log('Setting selected agent from dashboard init:', dashboardInit.initData.agents[0])
          setSelectedAgent(dashboardInit.initData.agents[0])
        }
      }
      
      // Update business info gathered count
      if (dashboardInit.initData.businessInfoFields) {
        setBusinessInfoGathered(dashboardInit.initData.businessInfoFields.business_info_gathered || 0)
      }
    }
  }, [dashboardInit.initData, dashboardInit.isLoading, selectedAgent])





  // Handle auto-start chat response
  useEffect(() => {
    if (autoStartChat.initialResponse && chat.messages.length === 0) {
      console.log('📝 Adding auto-start response to chat:', autoStartChat.initialResponse.substring(0, 100) + '...')
      
      // Add the initial AI response to chat messages
      chat.setMessages([
        {
          id: 'auto-start-' + Date.now(),
          content: autoStartChat.initialResponse,
          role: 'ai',
          timestamp: new Date()
        }
      ])
    }
  }, [autoStartChat.initialResponse, chat.messages.length, selectedAgent])

  // Debug logging for QR code state
  useEffect(() => {
    console.log('QR Code State:', {
      showQRCode,
      selectedAgent: selectedAgent?.id,
      businessInfoGathered,
      hasOrganization: !!auth.currentOrganization,
      messagesCount: chat.messages.length
    })
  }, [showQRCode, selectedAgent, businessInfoGathered, auth.currentOrganization, chat.messages.length])

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    // Redirect will be handled by auth state change
  }

  // Handle billing management
  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const { url, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      window.location.href = url
    } catch (error) {
      console.error('Error:', error)
      alert('Unable to open billing portal. Please try again.')
    }
  }

  // Render current view content
  const renderCurrentView = () => {
    if (!auth.user) {
      return (
        <ChatContainer
          messages={chat.messages}
          setMessages={chat.setMessages}
          chatLoading={chat.chatLoading}
          chatError={chat.chatError}
          input={chat.input}
          setInput={chat.setInput}
          handleSend={chat.handleSend}
          handleInputFocus={chat.handleInputFocus}
          handleOTPFlow={authFlow.handleOTPFlow}
          messagesEndRef={chat.messagesEndRef}
          inputRef={chat.inputRef}
          chatScrollContainerRef={chat.chatScrollContainerRef}
          fileInputRef={chat.fileInputRef}
          handleFileChange={chat.handleFileChange}
          uploading={chat.uploading}
          uploadProgress={chat.uploadProgress}
          user={auth.user}
          authState={auth.authState}
          otpLoading={auth.otpLoading}
          hasUserInteracted={mobile.hasUserInteracted}
          setHasUserInteracted={mobile.setHasUserInteracted}
          isMobile={mobile.isMobile}
          organizationId={auth.currentOrganization?.id}
        />
      )
    }

    switch (activeView) {
      case 'chat':
        return (
          <div className="w-full max-w-7xl mx-auto">
            <ChatContainer
              messages={chat.messages}
              setMessages={chat.setMessages}
              chatLoading={chat.chatLoading}
              chatError={chat.chatError}
              input={chat.input}
              setInput={chat.setInput}
              handleSend={chat.handleSend}
              handleInputFocus={chat.handleInputFocus}
              handleOTPFlow={authFlow.handleOTPFlow}
              messagesEndRef={chat.messagesEndRef}
              inputRef={chat.inputRef}
              chatScrollContainerRef={chat.chatScrollContainerRef}
              fileInputRef={chat.fileInputRef}
              handleFileChange={chat.handleFileChange}
              uploading={chat.uploading}
              uploadProgress={chat.uploadProgress}
              user={auth.user}
              authState={auth.authState}
              otpLoading={auth.otpLoading}
              hasUserInteracted={mobile.hasUserInteracted}
              setHasUserInteracted={mobile.setHasUserInteracted}
              isMobile={mobile.isMobile}
              organizationId={auth.currentOrganization?.id}
            />
          </div>
        )
      case 'qrcode':
        return selectedAgent ? (
          <div className="w-full max-w-4xl mx-auto">
            <ClientQRCode 
              agent={selectedAgent}
              isVisible={true}
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No agent selected. Please go to Agents to create one.</p>
          </div>
        )
      case 'agents':
        return <AgentsView />
      case 'business-summary':
        return <BusinessSummary />
      case 'performance':
        return <PerformanceOverview />
      case 'users':
        return auth.currentOrganization ? (
          <TeamManagement 
            organizationId={auth.currentOrganization.id} 
            organizationName={auth.currentOrganization.name} 
          />
        ) : null
      case 'profile':
        return (
          <ProfileSettings 
            user={auth.user} 
            onUserUpdate={(updatedUser) => {
              // Handle user update if needed
            }} 
          />
        )
      default:
        return null
    }
  }

  if (auth.loading || dashboardInit.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">
            {auth.loading ? 'Authenticating...' : 'Loading dashboard...'}
          </p>
          {autoStartChat.isAutoStarting && (
            <p className="text-sm text-purple-600 mt-2">Starting conversation...</p>
          )}
        </div>
      </div>
    )
  }

  // Handle dashboard initialization error
  if (dashboardInit.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load dashboard</h2>
          <p className="text-gray-600 mb-4">{dashboardInit.error}</p>
          <button
            onClick={dashboardInit.retryInit}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen min-h-0 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Desktop Navigation Sidebar */}
      <DesktopNavigation
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={handleLogout}
        onManageBilling={handleManageBilling}
        user={auth.user}
        subscription={auth.subscription}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {/* Mobile Header */}
        <div className="md:hidden">
          <MobileHeader 
            activeView={activeView}
            onMenuToggle={() => setShowHamburgerMenu(true)}
            user={auth.user}
          />
        </div>

        {/* Mobile Navigation */}
        <MobileNavigation
          isOpen={showHamburgerMenu}
          onClose={() => setShowHamburgerMenu(false)}
          activeView={activeView}
          onViewChange={setActiveView}
          onLogout={handleLogout}
          onManageBilling={handleManageBilling}
          user={auth.user}
          subscription={auth.subscription}
        />

        <div className={`flex-1 flex flex-col items-center w-full min-h-0 ${
          activeView === 'chat' && mobile.isMobile
            ? 'px-0 py-0' 
            : 'px-4 sm:px-6 lg:px-8 py-4 md:px-8 md:py-8'
        }`}>
        {/* Unauthenticated banner */}
        {!auth.user && (
          <div className="w-full text-center mb-4">
            <div className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
              You are not signed in. Start chatting below to authenticate.
            </div>
          </div>
        )}

        {renderCurrentView()}
      </div>

      {/* Modals */}
      {showPlansModal && (
        <SubscriptionPlans
          currentSubscription={auth.subscription}
          targetPlan={targetPlan || undefined}
          onClose={() => {
            setShowPlansModal(false)
            setTargetPlan(null)
          }}
          onSubscriptionUpdate={() => {
            setShowPlansModal(false)
            setTargetPlan(null)
            if (auth.user) {
              auth.fetchSubscription(auth.user.id)
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
    </div>
  )
}
