'use client'

import { useState, useEffect, Suspense } from 'react'
import LoadingScreen from '@/lib/features/dashboard/components/layout/LoadingScreen'
import AuthPromptView from '@/lib/features/auth/components/AuthPromptView'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { supabase } from '@/lib/shared/supabase/client'

// Import our new components and hooks
import { useAuth } from '@/lib/features/auth/hooks/useAuth'
import { useChat } from '@/lib/features/chat/hooks/useChat'
import { useMobile } from '@/lib/shared/hooks/useMobile'
import { useDashboardInit } from '@/lib/features/dashboard/hooks/useDashboardInit'

import { useQRCodeLogic } from '@/lib/features/chat/hooks/useQRCodeLogic'
import { useBillingManagement } from '@/lib/features/dashboard/hooks/useBillingManagement'
import { useLogout } from '@/lib/features/auth/hooks/useLogout'
import { useInitialChatMessage } from '@/lib/features/chat/hooks/useInitialChatMessage'
import { useOnboardingProgress } from '@/lib/features/onboarding/hooks/useOnboardingProgress'
import { useAuthFlow } from '@/lib/features/auth/components/AuthFlow'
import ChatContainer from '@/lib/features/chat/components/ChatContainer'
import ClientQRCode from '@/lib/features/chat/components/ClientQRCode'
import AgentsView from '@/lib/features/dashboard/components/agents/AgentsView'
import PWAPrompt from '@/lib/features/dashboard/components/layout/PWAPrompt'
import BusinessSummary from '@/lib/features/dashboard/components/overview/BusinessSummary'
import { ActiveView } from '@/lib/shared/types'

// Import existing dashboard components
import SimpleInsightsDashboard from '@/lib/features/insights/components/SimpleInsightsDashboard'
import TeamManagement from '@/lib/features/organizations/components/TeamManagement'
import ProfileSettings from '@/lib/features/dashboard/components/agents/ProfileSettings'
import MainDashboardLayout from '@/lib/features/dashboard/components/layout/MainDashboardLayout'



export default function Dashboard() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading..." /> }>
      <PWAPrompt />
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const t = useTranslations('chat')
  const locale = useLocale()
  const searchParams = useSearchParams()
  
  // Initialize all hooks
  const auth = useAuth()
  const dashboardInit = useDashboardInit(locale, auth.authState, auth.user, t('authPrompt'))

  const mobile = useMobile(() => {})
  
  // Initialize chat hook
  const chat = useChat({
    authState: auth.authState,
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

  // Use QR code logic hook
  const qrCodeLogic = useQRCodeLogic({ auth, chat, dashboardInit })

  // Use billing management hook
  const { handleManageBilling } = useBillingManagement()

  // Use logout hook
  const { handleLogout } = useLogout()

  // Use single hook for initial chat message
  useInitialChatMessage({
    message: dashboardInit.initialMessage,
    messagesLength: chat.messages.length,
    locale,
    setMessages: chat.setMessages
  })

  // Use onboarding progress hook
  const { progress: onboardingProgress, refreshProgress: refreshOnboardingProgress } = useOnboardingProgress(auth.currentOrganization?.id)

  // Dashboard UI state
  const [activeView, setActiveView] = useState<ActiveView>(mobile.isMobile ? 'agents' : 'chat')
  const [showPlansModal, setShowPlansModal] = useState(false)
  const [showManageDocsModal, setShowManageDocsModal] = useState(false)
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

  // Legacy scroll effect
  useEffect(() => {
    chat.messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chat.messages, chat.chatLoading])





  // Render current view content
  const renderCurrentView = () => {
    if (auth.authState === 'loading') {
      return null
    }
    
    if (auth.authState === 'awaitingName' && !auth.user) {
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
            sendMessage={chat.sendMessage}
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
            unlockQRCode={qrCodeLogic.unlockQRCode}
            onNavigateToQR={() => setActiveView('qrcode')}
            agent={auth.agents[0]}
            organization={auth.currentOrganization}
            locale={locale}
          />
        </div>
      )
    }

    switch (activeView) {
      case 'chat':
        return (
          <div className="w-full max-w-7xl mx-auto h-full flex flex-col">
            <ChatContainer
              messages={chat.messages}
              setMessages={chat.setMessages}
              chatLoading={chat.chatLoading}
              chatError={chat.chatError}
              input={chat.input}
              setInput={chat.setInput}
              handleSend={chat.handleSend}
              sendMessage={chat.sendMessage}
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
              unlockQRCode={async () => {
                await qrCodeLogic.unlockQRCode()
                refreshOnboardingProgress()
              }}
              onNavigateToQR={() => setActiveView('qrcode')}
              agent={auth.agents[0]}
              organization={auth.currentOrganization}
              locale={locale}
            />
          </div>
        )
      case 'qrcode':
        return auth.currentOrganization ? (
          <div className="w-full max-w-4xl mx-auto">
            <ClientQRCode 
              organizationSlug={auth.currentOrganization.slug}
              isOnboardingCompleted={onboardingProgress.isCompleted}
              onboardingProgress={onboardingProgress}
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No business available. Please go to Business Summary to set up your business.</p>
          </div>
        )
      case 'agents':
        return <AgentsView />
      case 'business-summary':
        return <BusinessSummary />
      case 'performance':
        return auth.currentOrganization ? (
          <SimpleInsightsDashboard organizationId={auth.currentOrganization.id} />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No organization available for insights.</p>
          </div>
        )
      case 'users':
        return auth.currentOrganization ? (
          <TeamManagement 
            organizationId={auth.currentOrganization.id} 
            organizationName={auth.currentOrganization.name} 
          />
        ) : null
      case 'profile':
        return auth.user ? (
          <ProfileSettings 
            user={auth.user} 
            onUserUpdate={() => {
              // Handle user update if needed
            }} 
          />
        ) : null
      default:
        return null
    }
  }

  if (auth.loading || dashboardInit.isLoading) {
    return (
      <LoadingScreen 
        message={auth.loading ? 'Authenticating...' : 'Loading dashboard...'}
      />
    )
  }

  // Handle auth prompt for unauthenticated users
  if (dashboardInit.shouldShowAuthPrompt) {
    return (
      <AuthPromptView
        activeView={activeView}
        setActiveView={setActiveView}
        handleLogout={handleLogout}
        handleManageBilling={handleManageBilling}
        auth={auth}
        mobile={mobile}
        showHamburgerMenu={showHamburgerMenu}
        setShowHamburgerMenu={setShowHamburgerMenu}
        renderCurrentView={renderCurrentView}
        dashboardInit={dashboardInit}
        showPlansModal={showPlansModal}
        setShowPlansModal={setShowPlansModal}
        targetPlan={targetPlan}
        setTargetPlan={setTargetPlan}
        showManageDocsModal={showManageDocsModal}
        setShowManageDocsModal={setShowManageDocsModal}
        handleManageDocsModalClose={() => setShowManageDocsModal(false)}
      />
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

  // Main dashboard view (authenticated, initialized)
  return (
    <MainDashboardLayout
      activeView={activeView}
      setActiveView={setActiveView}
      handleLogout={handleLogout}
      handleManageBilling={handleManageBilling}
      auth={auth}
      mobile={mobile}
      showHamburgerMenu={showHamburgerMenu}
      setShowHamburgerMenu={setShowHamburgerMenu}
      renderCurrentView={renderCurrentView}
      dashboardInit={dashboardInit}
      showPlansModal={showPlansModal}
      setShowPlansModal={setShowPlansModal}
      targetPlan={targetPlan}
      setTargetPlan={setTargetPlan}
      showManageDocsModal={showManageDocsModal}
      setShowManageDocsModal={setShowManageDocsModal}
      handleManageDocsModalClose={() => setShowManageDocsModal(false)}
    />
  )
}
