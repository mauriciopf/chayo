'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import ChatEmptyState from './ChatEmptyState'
import { Message, AuthState } from './types'
import { ActionableHint } from './ActionableHintChips'
import ChatActionableHints from './ChatActionableHints';
import { ChatContextType, getSystemMessageForContext } from './chatContextMessages';
import OnboardingProgress, { OnboardingProgressData } from './OnboardingProgress'
import OnboardingCompletion from './OnboardingCompletion'
import { useOnboardingProgress } from '@/lib/hooks/useOnboardingProgress'

interface ChatContainerProps {
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  chatLoading: boolean;
  chatError: string | null;
  input: string;
  setInput: (input: string) => void;
  handleSend: () => void;
  sendMessage: (messageContent: string) => Promise<void>;
  handleInputFocus: () => void;
  handleOTPFlow: () => Promise<void>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  chatScrollContainerRef: React.RefObject<HTMLDivElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  uploadProgress: number | null;
  user: any;
  authState: AuthState;
  otpLoading: string;
  hasUserInteracted: boolean;
  setHasUserInteracted: (interacted: boolean) => void;
  isMobile: boolean;
  organizationId?: string;
  unlockQRCode?: () => void;
  onNavigateToQR?: () => void;
}

export default function ChatContainer({
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
  onNavigateToQR
}: ChatContainerProps) {
  const t = useTranslations('chat')

  // Add chat context state
  const [chatContext, setChatContext] = useState<ChatContextType>('business_setup')
  
  // Add actionable hint state
  const [selectedActionableHint, setSelectedActionableHint] = useState<ActionableHint | null>(null)

  // Add onboarding progress state using custom hook
  const { progress: onboardingProgress, refreshProgress: refreshOnboardingProgress } = useOnboardingProgress(organizationId)
  const [showOnboardingProgress, setShowOnboardingProgress] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)

  // Refresh onboarding progress when messages change (new business info collected)
  useEffect(() => {
    // Check if the last message is from AI (indicating new business info was processed)
    if (messages.length > 0 && messages[messages.length - 1].role === 'ai') {
      // Refresh onboarding progress after a short delay to allow API to update
      const timer = setTimeout(() => {
        if (organizationId) {
          refreshOnboardingProgress()
        }
      }, 1000) // 1 second delay to ensure business info is updated
      
      return () => clearTimeout(timer)
    }
  }, [messages, organizationId, refreshOnboardingProgress])

  // Update onboarding visibility when progress changes
  useEffect(() => {
    setShowOnboardingProgress(!onboardingProgress.isCompleted)
    setShowCompletion(onboardingProgress.isCompleted)
  }, [onboardingProgress.isCompleted])

  // Handler for quick reply chip click
  const handleQuickReply = (context: ChatContextType) => {
    setChatContext(context)
    const systemMessage = getSystemMessageForContext(context)
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString() + '-sys',
        role: 'system',
        content: systemMessage,
        timestamp: new Date(),
      },
    ])
  }

  // Handler for multiple choice option selection
  const handleMultipleChoiceSelect = (selectedOptions: string | string[]) => {
    // Handle both single and multiple selections
    const finalInput = Array.isArray(selectedOptions) 
      ? selectedOptions.join(', ') 
      : selectedOptions
    
    // Automatically send the message directly
    sendMessage(finalInput)
  }

  // Handler for actionable hint selection
  const handleActionableHintSelect = async (hint: ActionableHint | null) => {
    if (hint) {
      // For now, just send the hint description as a message
      // This will be expanded later when the functionality is implemented
      const hintMessage = `I want to ${hint.description.toLowerCase()}`
      sendMessage(hintMessage)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col w-full md:rounded-2xl md:border md:border-gray-200 md:shadow-lg bg-white/80 flex-1"
      style={{
        height: isMobile ? 'calc(100dvh - 60px)' : 'calc(100vh - 2rem)', // Account for mobile header and desktop padding
        maxHeight: isMobile ? 'calc(100dvh - 60px)' : 'calc(100vh - 2rem)',
        position: 'relative',
        overflow: 'hidden' // Prevent any overflow issues
      }}
    >
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
          onContinue={() => {
            setShowCompletion(false)
            setShowOnboardingProgress(false)
            // Unlock QR code when user clicks "Start Using Chayo"
            if (unlockQRCode) {
              unlockQRCode()
            }
          }}
          onNavigateToQR={onNavigateToQR}
        />
        
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

      <ChatActionableHints onHintSelect={handleActionableHintSelect} />

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
      />
    </motion.div>
  )
} 