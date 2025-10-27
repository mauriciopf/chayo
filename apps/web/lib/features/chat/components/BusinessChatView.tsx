'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import ChatEmptyState from './ChatEmptyState'

import VibeCardGenerationModal from '../../onboarding/components/VibeCardGenerationModal'
import OnboardingCompletionBanner from '../../onboarding/components/OnboardingCompletionBanner'
import { useBusinessModeChat } from '../hooks/useBusinessModeChat'
import { Message, AuthState } from '../../../shared/types'
import { ThinkingContext } from '../../../shared/services/ThinkingMessageService'
import { ModalEvent, StateEvent, ProgressEvent } from '../../../shared/types/sseEvents'

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
  modalEvent: ModalEvent | null
  statusEvent: StateEvent | null
  progressEvent: ProgressEvent | null
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
  modalEvent,
  statusEvent,
  progressEvent
}: BusinessChatViewProps) {
  const t = useTranslations('chat')
  const tOnboarding = useTranslations('onboarding')

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
    modalEvent,
    statusEvent
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
        {/* Always show banner at top - shows progress during onboarding or completion after */}
        <OnboardingCompletionBanner
          isOnboardingCompleted={isOnboardingCompleted}
          isAuthenticated={authState === 'authenticated'}
        />
        
        {messages.length === 0 && !chatLoading && <ChatEmptyState />}
        
        {/* Vibe Card Generation Modal */}
        <VibeCardGenerationModal 
          isVisible={showVibeCardCompletion}
          organizationId={organizationId || ''}
          progressEvent={progressEvent}
          onDismiss={() => {
            console.log('❌ [MODAL-DEBUG] Modal dismissed')
            setShowVibeCardCompletion(false)
          }}
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
              currentPhase={statusEvent?.change || null}
            />
          )
        })()}
        <div ref={messagesEndRef as React.RefObject<HTMLDivElement>} />
      </div>

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