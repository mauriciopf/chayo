'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import ChatEmptyState from './ChatEmptyState'
import { Message, AuthState } from './types'
import { TrainingHint } from './TrainingHintChips'
import ChatTrainingHints from './ChatTrainingHints';
import { ChatContextType, getSystemMessageForContext } from './chatContextMessages';

interface ChatContainerProps {
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  chatLoading: boolean;
  chatError: string | null;
  input: string;
  setInput: (input: string) => void;
  handleSend: () => void;
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
}

export default function ChatContainer({
  messages,
  setMessages,
  chatLoading,
  chatError,
  input,
  setInput,
  handleSend,
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
  organizationId
}: ChatContainerProps) {
  const t = useTranslations('chat')

  // Add chat context state
  const [chatContext, setChatContext] = useState<ChatContextType>('business_setup')
  
  // Add training hint state
  const [selectedTrainingHint, setSelectedTrainingHint] = useState<TrainingHint | null>(null)
  const [refreshHintsTrigger, setRefreshHintsTrigger] = useState(0)

  // Refresh training hints when messages change (new business info collected)
  useEffect(() => {
    // Check if the last message is from AI (indicating new business info was processed)
    if (messages.length > 0 && messages[messages.length - 1].role === 'ai') {
      // Trigger refresh of training hints after a short delay to allow API to update
      const timer = setTimeout(() => {
        setRefreshHintsTrigger(prev => prev + 1)
      }, 1000) // 1 second delay to ensure business info is updated
      
      return () => clearTimeout(timer)
    }
  }, [messages])

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

  // Handler for training hint selection
  const handleTrainingHintSelect = async (hint: TrainingHint | null) => {
    const { TrainingHintService } = await import('@/lib/services/trainingHintService')
    if (hint) {
      const focusMessage = TrainingHintService.createFocusMessage(hint)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '-focus',
          role: 'system',
          content: focusMessage,
          timestamp: new Date(),
        },
      ])
      setTimeout(() => {
        handleSend()
      }, 100)
    } else {
      const generalMessage = TrainingHintService.createClearFocusMessage()
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '-general',
          role: 'system',
          content: generalMessage,
          timestamp: new Date(),
        },
      ])
      setTimeout(() => {
        handleSend()
      }, 100)
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
        <ChatMessages messages={messages} chatLoading={chatLoading} chatError={chatError} />
        <div ref={messagesEndRef} />
      </div>

      <ChatTrainingHints organizationId={organizationId} onHintSelect={handleTrainingHintSelect} />

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
      />
    </motion.div>
  )
} 