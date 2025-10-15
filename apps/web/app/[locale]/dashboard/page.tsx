'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import AuthPromptView from '@/lib/features/auth/components/AuthPromptView'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'

// Import our new components and hooks
import { useAuth } from '@/lib/features/auth/hooks/useAuth'
import { useChat } from '@/lib/features/chat/hooks/useChat'
import { useMobile } from '@/lib/shared/hooks/useMobile'
import { useDashboardInit } from '@/lib/features/dashboard/hooks/useDashboardInit'

import { useBillingManagement } from '@/lib/features/dashboard/hooks/useBillingManagement'
import { useLogout } from '@/lib/features/auth/hooks/useLogout'

import { useOnboardingCompletion } from '@/lib/features/onboarding/hooks/useOnboardingCompletion'

import ChatContainer from '@/lib/features/chat/components/ChatContainer'
import ClientQRCode from '@/lib/features/chat/components/ClientQRCode'
import AgentsView from '@/lib/features/dashboard/components/agents/AgentsView'
import RemindersManagementView from '@/lib/features/tools/reminders/components/RemindersManagementView'
import DashboardCardGrid from '@/lib/features/dashboard/components/DashboardCardGrid'
import BackToDashboardButton from '@/lib/features/dashboard/components/BackToDashboardButton'

// Import inline tool configuration components
import DocumentToolConfig from '@/lib/features/tools/documents/components/DocumentToolConfig'
import PaymentToolConfig from '@/lib/features/tools/payments/components/PaymentToolConfig'
import ProductsManager from '@/components/products/ProductsManager'
import IntakeFormsToolConfig from '@/lib/features/tools/intake-forms/components/IntakeFormsToolConfig'
import CustomerSupportTool from '@/lib/features/tools/customer-support/components/CustomerSupportTool'
import RemindersToolConfigWizard from '@/lib/features/tools/reminders/components/RemindersToolConfigWizard'
import ReservationsManagementView from '@/lib/features/tools/reservations/components/ReservationsManagementView'

import BusinessSummary from '@/lib/features/dashboard/components/overview/BusinessSummary'
import { ActiveView } from '@/lib/shared/types'
import Tutorial from '@/lib/features/onboarding/components/Tutorial'

// Import existing dashboard components
import SimpleInsightsDashboard from '@/lib/features/insights/components/SimpleInsightsDashboard'
import TeamManagement from '@/lib/features/organizations/components/TeamManagement'
import ProfileSettings from '@/lib/features/dashboard/components/agents/ProfileSettings'
import MainDashboardLayout from '@/lib/features/dashboard/components/layout/MainDashboardLayout'



export default function Dashboard() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const t = useTranslations('chat')
  const tAuth = useTranslations('auth.otp')
  const locale = useLocale()
  const searchParams = useSearchParams()
  
  // Initialize hooks in proper order
  const mobile = useMobile(() => {})
  const auth = useAuth()
  
  const chat = useChat({
    authState: auth.authState,
    locale,
    organizationId: auth.currentOrganization?.id
  })

  // Create OTP flow with chat integration
  const otpFlow = auth.createOTPFlow({
    input: chat.input,
    setInput: chat.setInput,
    setJustSent: chat.setJustSent,
    isMobile: mobile.isMobile,
    inputRef: chat.inputRef,
    messages: chat.messages,
    setMessages: chat.setMessages,
    translations: {
      askEmail: tAuth('askEmail'),
      codeSent: tAuth('codeSent'),
      codeInvalid: tAuth('codeInvalid'),
      codeFailed: tAuth('codeFailed'),
      sendFailed: tAuth('sendFailed'),
      resendFailed: tAuth('resendFailed'),
      resendSuccess: tAuth('resendSuccess'),
      nameRequired: tAuth('nameRequired'),
      emailRequired: tAuth('emailRequired'),
      codeRequired: tAuth('codeRequired'),
    }
  })

  const dashboardInit = useDashboardInit(locale, auth.authState, auth.user, t('authPrompt'), auth.loading)


  // Use billing management hook
  const { handleManageBilling } = useBillingManagement()

  // Use logout hook
  const { handleLogout } = useLogout()

  // Trigger SSE events when authentication completes
  const hasTriggeredAuthSSE = useRef(false)
  
  useEffect(() => {
    if (auth.authState === 'authenticated' && 
        auth.user && 
        !dashboardInit.isLoading && 
        !hasTriggeredAuthSSE.current) {
      
      console.log('🔐 Authentication completed - triggering SSE events for context switch')
      hasTriggeredAuthSSE.current = true
      
      // Trigger SSE events with empty messages array (not empty string content)
      // This allows the system to emit proper phases and switch from auth to business context
      chat.triggerSSEWithEmptyMessages()
    }
  }, [auth.authState, auth.user, dashboardInit.isLoading])
  
  // Reset SSE trigger flag when auth state changes  
  useEffect(() => {
    if (auth.authState !== 'authenticated') {
      hasTriggeredAuthSSE.current = false
    }
  }, [auth.authState])

  // Set initial auth prompt message for non-authenticated users
  useEffect(() => {
    if (dashboardInit.shouldShowAuthPrompt && dashboardInit.initialMessage && chat.messages.length === 0) {
      console.log('🔐 Setting initial auth prompt message')
      chat.setMessages([{
        id: 'auth-prompt',
        role: 'ai',
        content: dashboardInit.initialMessage.content,
        timestamp: new Date(),
        multipleChoices: dashboardInit.initialMessage.multipleChoices,
        allowMultiple: dashboardInit.initialMessage.allowMultiple
      }])
    }
  }, [dashboardInit.shouldShowAuthPrompt, dashboardInit.initialMessage, chat.messages.length])

  // Use onboarding progress hook (read-only, no manual refresh needed - SSE handles updates)
  console.log('🔄 Dashboard onboarding hook setup:', {
    organizationId: auth.currentOrganization?.id,
    hasOrganization: !!auth.currentOrganization
  })
  const { isCompleted: isOnboardingCompleted, loading: onboardingLoading } = useOnboardingCompletion(auth.currentOrganization?.id)

  // Dashboard UI state
  const [activeView, setActiveView] = useState<ActiveView>(mobile.isMobile ? 'agents' : 'dashboard')
  const [activeTool, setActiveTool] = useState<string | null>(null) // For inline tool rendering
  const [showPlansModal, setShowPlansModal] = useState(false)
  const [showManageDocsModal, setShowManageDocsModal] = useState(false)
  const [targetPlan, setTargetPlan] = useState<string | null>(null)
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false)
  const [hasReminders, setHasReminders] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [agentToolsSettings, setAgentToolsSettings] = useState<{
    products: boolean
    payments: boolean
    reminders: boolean
    forms: boolean
    reservations: boolean
  }>({
    products: false,
    payments: false,
    reminders: false,
    forms: false,
    reservations: false,
  })

  // Fetch agent tools settings
  useEffect(() => {
    const fetchAgentTools = async () => {
      if (!auth.currentOrganization?.id) return
      
      try {
        const response = await fetch(`/api/organizations/${auth.currentOrganization.id}/agent-tools`)
        if (response.ok) {
          const data = await response.json()
          setAgentToolsSettings({
            products: data.products || false,
            payments: data.payments || false,
            reminders: data.reminders || false,
            forms: data.forms || false,
            reservations: data.reservations || false,
          })
        }
      } catch (error) {
        console.error('Error fetching agent tools:', error)
      }
    }

    fetchAgentTools()
  }, [auth.currentOrganization?.id])

  // Check if organization has any reminders
  useEffect(() => {
    const checkReminders = async () => {
      if (!auth.currentOrganization?.id) return
      
      try {
        const response = await fetch(`/api/organizations/${auth.currentOrganization.id}/reminders`)
        if (response.ok) {
          const data = await response.json()
          setHasReminders(data.reminders && data.reminders.length > 0)
        }
      } catch (error) {
        console.error('Error checking reminders:', error)
      }
    }

    checkReminders()
  }, [auth.currentOrganization?.id])

  // Handle URL params for plans
  useEffect(() => {
    const showPlans = searchParams?.get?.('showPlans') ?? null
    const targetPlanParam = searchParams?.get?.('targetPlan') ?? null
    
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
            handleOTPFlow={otpFlow.handleOTPFlow}
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
            modalEvent={chat.modalEvent}
            statusEvent={chat.statusEvent}
            progressEvent={chat.progressEvent}
            agent={auth.agents[0]}
            organization={auth.currentOrganization}
            locale={locale}
          />
        </div>
      )
    }

    switch (activeView) {
      case 'dashboard':
        // If a tool is active, render it inline
        if (activeTool) {
          return (
            <div className="light h-full w-full flex flex-col bg-gray-50">
              <div className="px-6 py-4 bg-white border-b border-gray-200">
                <BackToDashboardButton onClick={() => setActiveTool(null)} />
              </div>
              <div className="flex-1 overflow-auto p-6">
                {activeTool === 'chat' && (
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
                      handleOTPFlow={otpFlow.handleOTPFlow}
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
                      modalEvent={chat.modalEvent}
                      statusEvent={chat.statusEvent}
                      progressEvent={chat.progressEvent}
                      agent={auth.agents[0]}
                      organization={auth.currentOrganization}
                      locale={locale}
                    />
                )}
                
                {activeTool === 'products' && auth.currentOrganization && (
                  <ProductsManager organizationId={auth.currentOrganization.id} />
                )}
                
                {activeTool === 'payments' && auth.currentOrganization && (
                  <PaymentToolConfig
                    organizationId={auth.currentOrganization.id}
                    isEnabled={true}
                    onSettingsChange={() => {}}
                  />
                )}
                
                {activeTool === 'reminders' && auth.currentOrganization && (
                  <RemindersToolConfigWizard
                    organizationId={auth.currentOrganization.id}
                    businessName={auth.currentOrganization.name}
                  />
                )}
                
                {activeTool === 'forms' && auth.currentOrganization && (
                  <IntakeFormsToolConfig
                    organizationId={auth.currentOrganization.id}
                    isEnabled={true}
                    onSettingsChange={() => {}}
                  />
                )}
                
                {activeTool === 'reservations' && auth.currentOrganization && (
                  <ReservationsManagementView
                    organizationId={auth.currentOrganization.id}
                  />
                )}
                
                {activeTool === 'documents' && auth.currentOrganization && (
                  <DocumentToolConfig
                    organizationId={auth.currentOrganization.id}
                    isEnabled={true}
                    onSettingsChange={() => {}}
                  />
                )}
                
                {activeTool === 'support' && auth.currentOrganization && (
                  <CustomerSupportTool
                    organizationId={auth.currentOrganization.id}
                    isEnabled={true}
                    onSettingsChange={() => {}}
                  />
                )}
              </div>
            </div>
          )
        }
        
        // Otherwise show the card grid
        return (
          <DashboardCardGrid
            onCardClick={(category) => {
              setActiveTool(category)
            }}
            onStartTutorial={() => {
              setShowTutorial(true)
            }}
            enabledTools={agentToolsSettings}
            isOnboardingComplete={isOnboardingCompleted}
          />
        )
      case 'chat':
        return (
          <div className="w-full max-w-7xl mx-auto h-full flex flex-col">
            <div className="px-4 py-3">
              <BackToDashboardButton onClick={() => setActiveView('dashboard')} />
            </div>
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
              handleOTPFlow={otpFlow.handleOTPFlow}
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
              modalEvent={chat.modalEvent}
              statusEvent={chat.statusEvent}
              progressEvent={chat.progressEvent}
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
              isOnboardingCompleted={isOnboardingCompleted}
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
      case 'reminders':
        return auth.currentOrganization ? (
          <div className="h-full flex flex-col">
            <div className="px-4 py-3">
              <BackToDashboardButton onClick={() => setActiveView('dashboard')} />
            </div>
            <RemindersManagementView
              organizationId={auth.currentOrganization.id}
              businessName={auth.currentOrganization.name}
              onCreateNew={() => {
                // Switch to chat view to open the reminders modal
                setActiveView('chat')
                // TODO: Trigger the reminders modal from ActionableHintChips
              }}
            />
          </div>
        ) : null
      default:
        return null
    }
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
    <>
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
        hasReminders={hasReminders}
      />
      
      {/* Tutorial Modal */}
      <Tutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </>
  )
}
