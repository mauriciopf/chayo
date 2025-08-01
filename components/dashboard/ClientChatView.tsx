'use client'

import React, { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import { useClientModeChat } from '@/lib/hooks/useClientModeChat'
import { Agent, Organization } from './types'

type ChatMode = 'business' | 'client'

interface ClientChatViewProps {
  agent: Agent
  organization: Organization
  locale?: string
  className?: string
  onModeSwitch?: (mode: ChatMode) => void
}

export default function ClientChatView({ 
  agent, 
  organization, 
  locale = 'en', 
  className = '',
  onModeSwitch
}: ClientChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatScrollContainerRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    input,
    loading,
    error,
    setInput,
    handleSend,
    handleKeyPress
  } = useClientModeChat({
    agent,
    organization,
    locale
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className={`flex flex-col h-full w-full ${className}`}>
      {/* Messages Area - Full Screen Mobile */}
      <div 
        ref={chatScrollContainerRef}
        className="flex-1 overflow-y-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ChatMessage 
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
                appointmentLink={message.appointmentLink}
                documentSigningLink={message.documentSigningLink}
                paymentAvailable={message.paymentAvailable}
                paymentType={message.paymentType}
                intakeFormAvailable={message.intakeFormAvailable}
                intakeFormId={message.intakeFormId}
                intakeFormName={message.intakeFormName}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start px-4 py-2"
          >
            <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-xs">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message - Mobile Full Width */}
      {error && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <ChatInput
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        handleInputFocus={() => {}} // No special focus logic needed for client mode
        handleOTPFlow={async () => {}} // No OTP needed for client mode
        inputRef={inputRef}
        fileInputRef={useRef<HTMLInputElement>(null)} // No file uploads in client mode
        handleFileChange={() => {}} // No file uploads in client mode
        uploading={false} // No file uploads in client mode
        otpLoading={'none'} // No OTP in client mode
        chatLoading={loading}
        authState={'authenticated'} // Always authenticated for client mode
        isMobile={true} // Client mode is mobile-optimized
        chatContext={'business_setup'} // Default context
        setChatContext={() => {}} // No context switching in client mode
        chatMode={'client'}
        onModeSwitch={onModeSwitch}
      />
    </div>
  )
}