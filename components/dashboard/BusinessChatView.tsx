'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { CheckCircle } from 'lucide-react'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import ChatEmptyState from './ChatEmptyState'
import ChatActionableHints from './ChatActionableHints'
import OnboardingProgress from './OnboardingProgress'
import OnboardingCompletion from './OnboardingCompletion'
import { useBusinessModeChat } from '@/lib/hooks/useBusinessModeChat'
import { Message, AuthState } from './types'

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
  onModeSwitch?: (mode: ChatMode) => void
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
  onModeSwitch
}: BusinessChatViewProps) {
  const t = useTranslations('chat')

  const {
    chatContext,
    onboardingProgress,
    showOnboardingProgress,
    showCompletion,
    hasShownCompletionModal,
    handleQuickReply,
    handleMultipleChoiceSelect,
    onContinueCompletion,
    onNavigateToQR: businessNavigateToQR
  } = useBusinessModeChat({
    organizationId,
    setMessages,
    sendMessage,
    unlockQRCode,
    onNavigateToQR
  })

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

        {/* Show subtle banner after modal has been dismissed and setup is complete */}
        {(() => {
          const shouldShowBanner = onboardingProgress.isCompleted && hasShownCompletionModal && !showCompletion
          console.log('🎯 Banner visibility check:', {
            isCompleted: onboardingProgress.isCompleted,
            hasShownModal: hasShownCompletionModal,
            showCompletion: showCompletion,
            shouldShowBanner
          })
          return shouldShowBanner
        })() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm text-green-800 font-medium">
                    Setup Complete! ✨
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Your AI assistant is ready to help with client communications.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (unlockQRCode) {
                    unlockQRCode()
                  }
                  if (onNavigateToQR) {
                    onNavigateToQR()
                  }
                }}
                className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex-shrink-0 ml-4"
              >
                Start Using Chayo
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
        
        <ChatMessages 
          messages={messages} 
          chatLoading={chatLoading} 
          chatError={chatError} 
          onOptionSelect={handleMultipleChoiceSelect}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Onboarding Progress - moved here to be above actionable hints */}
      <OnboardingProgress 
        progress={onboardingProgress}
        isVisible={showOnboardingProgress}
      />

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