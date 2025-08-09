'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import ChatEmptyState from './ChatEmptyState'
import ChatActionableHints from './ChatActionableHints'

import OnboardingCompletion from '../../onboarding/components/OnboardingCompletion'
import OnboardingCompletionBanner from '../../onboarding/components/OnboardingCompletionBanner'
import Tutorial from '../../onboarding/components/Tutorial'
import { useBusinessModeChat } from '../hooks/useBusinessModeChat'
import { Message, AuthState } from '../../../shared/types'
import { ThinkingContext } from '../../../shared/services/ThinkingMessageService'
import { OnboardingProgressData } from '../../../shared/services/ThinkingMessageService'

type ChatMode = 'business' | 'client'

interface BusinessChatViewProps {
  messages: Message[]
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  chatLoading: boolean
  chatError: string | null
  input: string
  setInput: (input: string) => void
  handleSend: () => void
  sendMessage: (messageContent: string) => Promise<void>
  handleInputFocus: () => void
  handleOTPFlow: () => Promise<void>
  messagesEndRef: React.RefObject<HTMLDivElement>
  inputRef: React.RefObject<HTMLTextAreaElement>
  chatScrollContainerRef: React.RefObject<HTMLDivElement>
  fileInputRef: React.RefObject<HTMLInputElement>
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  uploading: boolean
  uploadProgress: number | null
  user: any
  authState: AuthState
  otpLoading: string
  hasUserInteracted: boolean
  setHasUserInteracted: (interacted: boolean) => void
  isMobile: boolean
  organizationId?: string
  unlockQRCode?: () => void
  onNavigateToQR?: () => void
  refreshOnboardingProgress?: () => void
  onModeSwitch?: (mode: ChatMode) => void
  currentPhase?: string | null
}

export default function BusinessChatView({
  messages,
  setMessages,
  chatLoading,
  chatError,
  input,
  setInput,
  handleSend,
  sendMessage,
  handleInputFocus,
  handleOTPFlow,
  messagesEndRef,
  inputRef,
  chatScrollContainerRef,
  fileInputRef,
  handleFileChange,
  uploading,
  uploadProgress,
  user,
  authState,
  otpLoading,
  hasUserInteracted,
  setHasUserInteracted,
  isMobile,
  organizationId,
  unlockQRCode,
  onNavigateToQR,
  refreshOnboardingProgress,
  onModeSwitch,
  currentPhase
}: BusinessChatViewProps) {
  const t = useTranslations('chat')
  const tOnboarding = useTranslations('onboarding')
  const [showTutorial, setShowTutorial] = React.useState(false)

  const {
    chatContext,
    onboardingProgress,
    showOnboardingProgress,
    showCompletion,
    hasShownCompletionModal,
    handleQuickReply,
    handleMultipleChoiceSelect,
    onContinueCompletion,
    onNavigateToQR: businessNavigateToQR,
    refreshOnboardingProgress: refreshOnboardingProgressFromHook
  } = useBusinessModeChat({
    organizationId,
    setMessages,
    sendMessage,
    unlockQRCode,
    onNavigateToQR,
    refreshOnboardingProgress
  })

  // React to switchingMode phase to refresh progress and flip UI immediately
  React.useEffect(() => {
    if (currentPhase === 'switchingMode') {
      console.log('🔄 switchingMode detected - refreshing onboarding progress and auth state')
      try {
        refreshOnboardingProgressFromHook()
        // Also refresh the page to pick up newly created agents
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } catch (error) {
        console.warn('Failed to refresh during mode switch:', error)
      }
    }
  }, [currentPhase, refreshOnboardingProgressFromHook])

  return (
    <>
      <div
        className="flex-1 overflow-y-auto px-1 md:px-6 md:py-4"
        ref={chatScrollContainerRef}
        onClick={() => { if (isMobile && !hasUserInteracted) setHasUserInteracted(true); }}
        style={{ 
          scrollPaddingBottom: '20vh',
          scrollSnapType: 'none'
        }}
      >
        {messages.length === 0 && !chatLoading && <ChatEmptyState />}
        
        {/* Onboarding Completion */}
        <OnboardingCompletion 
          isVisible={showCompletion}
          onContinue={onContinueCompletion}
          onNavigateToQR={businessNavigateToQR}
        />

        {/* Show completion banner with tutorial button */}
        <OnboardingCompletionBanner
          isVisible={onboardingProgress.isCompleted && hasShownCompletionModal && !showCompletion}
          onStartTutorial={() => setShowTutorial(true)}
        />

        {/* Tutorial Modal */}
        <Tutorial
          isOpen={showTutorial}
          onClose={() => setShowTutorial(false)}
        />
        
        {(() => {
          // Determine thinking context based on onboarding progress
          const getThinkingContext = (): ThinkingContext => {
            if (!showOnboardingProgress || onboardingProgress.isCompleted) {
              return 'default'
            }
            
            const currentStage = onboardingProgress.currentStage
            if (currentStage === 'stage_1') return 'onboarding_stage_1'
            if (currentStage === 'stage_2') return 'onboarding_stage_2'
            if (currentStage === 'stage_3') return 'onboarding_stage_3'
            
            return 'default'
          }

          return (
            <ChatMessages 
              messages={messages} 
              chatLoading={chatLoading} 
              chatError={chatError} 
              onOptionSelect={handleMultipleChoiceSelect}
              thinkingContext={getThinkingContext()}
              onboardingProgress={onboardingProgress}
              organizationId={organizationId}
              currentPhase={currentPhase}
            />
          )
        })()}
        <div ref={messagesEndRef} />
      </div>



      <ChatActionableHints organizationId={organizationId || ''} />

      <ChatInput
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        handleInputFocus={handleInputFocus}
        handleOTPFlow={handleOTPFlow}
        inputRef={inputRef}
        fileInputRef={fileInputRef}
        handleFileChange={handleFileChange}
        uploading={uploading}
        otpLoading={otpLoading}
        chatLoading={chatLoading}
        authState={authState}
        isMobile={isMobile}
        chatContext={chatContext}
        setChatContext={handleQuickReply}
        currentOnboardingQuestion={onboardingProgress.currentQuestion}
        isOnboardingActive={showOnboardingProgress}
        onModeSwitch={onModeSwitch}
      />
    </>
  )
}