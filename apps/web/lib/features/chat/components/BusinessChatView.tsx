'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import ChatEmptyState from './ChatEmptyState'
import ChatActionableHints from './ChatActionableHints'

import VibeCardGenerationModal from '../../onboarding/components/VibeCardGenerationModal'
import OnboardingCompletionBanner from '../../onboarding/components/OnboardingCompletionBanner'
import Tutorial from '../../onboarding/components/Tutorial'
import { useBusinessModeChat } from '../hooks/useBusinessModeChat'
import { Message, AuthState } from '../../../shared/types'
import { ThinkingContext } from '../../../shared/services/ThinkingMessageService'

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
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  chatScrollContainerRef: React.RefObject<HTMLDivElement | null>
  fileInputRef: React.RefObject<HTMLInputElement | null>
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
  onModeSwitch,
  currentPhase
}: BusinessChatViewProps) {
  const t = useTranslations('chat')
  const tOnboarding = useTranslations('onboarding')
  const [showTutorial, setShowTutorial] = React.useState(false)

  const {
    chatContext,
    isOnboardingCompleted,
    showVibeCardCompletion,
    setShowVibeCardCompletion,
    handleQuickReply,
    handleMultipleChoiceSelect,
  } = useBusinessModeChat({
    organizationId,
    setMessages,
    sendMessage,
    currentPhase
  })

  // Note: switchingMode phase is handled by SSE events - no manual refreshing needed

  return (
    <>
      <div
        className="flex-1 overflow-y-auto px-1 md:px-6 md:py-4"
        ref={chatScrollContainerRef as React.RefObject<HTMLDivElement>}
        onClick={() => { if (isMobile && !hasUserInteracted) setHasUserInteracted(true); }}
        style={{ 
          backgroundColor: 'var(--bg-primary)',
          scrollPaddingBottom: '20vh',
          scrollSnapType: 'none'
        }}
      >
        {messages.length === 0 && !chatLoading && <ChatEmptyState />}
        
        {/* Vibe Card Generation Modal */}
        <VibeCardGenerationModal 
          isVisible={showVibeCardCompletion}
          organizationId={organizationId || ''}
          currentPhase={currentPhase}
          onDismiss={() => {
            console.log('❌ [MODAL-DEBUG] Modal dismissed')
            setShowVibeCardCompletion(false)
          }}
        />
        
        {/* Debug info for modal visibility - moved to useEffect */}

        {/* Show completion banner with tutorial button */}
        <OnboardingCompletionBanner
          isVisible={isOnboardingCompleted // Hide during mode switching for cleaner UX
          }
          onStartTutorial={() => setShowTutorial(true)}
        />

        {/* Tutorial Modal */}
        <Tutorial
          isOpen={showTutorial}
          onClose={() => setShowTutorial(false)}
        />
        
        {(() => {
          // Determine thinking context based on onboarding completion
          const getThinkingContext = (): ThinkingContext => {
            if (isOnboardingCompleted) {
              return 'default'
            }
            
            // Show onboarding in progress
            return 'onboarding_in_progress'
          }

          return (
            <ChatMessages 
              messages={messages} 
              chatLoading={chatLoading} 
              chatError={chatError} 
              onOptionSelect={handleMultipleChoiceSelect}
              thinkingContext={getThinkingContext()}
              organizationId={organizationId}
              currentPhase={currentPhase}
            />
          )
        })()}
        <div ref={messagesEndRef as React.RefObject<HTMLDivElement>} />
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
        currentOnboardingQuestion={undefined}
        isOnboardingActive={!isOnboardingCompleted}
        onModeSwitch={onModeSwitch}
      />
    </>
  )
}