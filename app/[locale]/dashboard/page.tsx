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
import { useAuthFlow } from '@/components/dashboard/AuthFlow'
import ChatContainer from '@/components/dashboard/ChatContainer'
import MobileHeader from '@/components/dashboard/MobileHeader'
import MobileNavigation from '@/components/dashboard/MobileNavigation'
import DesktopNavigation from '@/components/dashboard/DesktopNavigation'
import AgentsView from '@/components/dashboard/AgentsView'
import PWAPrompt from '@/components/dashboard/PWAPrompt'
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

  // Load agents on mount
  useEffect(() => {
    auth.fetchAgents()
  }, [])

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
        />
      )
    }

    switch (activeView) {
      case 'chat':
        return (
          <ChatContainer
            messages={chat.messages}
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
          />
        )
      case 'agents':
        return <AgentsView />
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

  if (auth.loading) {
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
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
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
      <div className="flex flex-col flex-1 min-w-0">
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

        <div className={`flex-1 flex flex-col items-center w-full ${
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
