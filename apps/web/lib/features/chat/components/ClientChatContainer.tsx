'use client'

import React, { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatMessage from './ChatMessage'
import { Message, Agent, Organization } from '../../../shared/types'
import { useClientModeChat } from '../hooks/useClientModeChat'

interface ClientChatContainerProps {
  agent: Agent
  organization: Organization
  locale?: string
  className?: string
}

export default function ClientChatContainer({ agent, organization, locale = 'en', className = '' }: ClientChatContainerProps) {
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

      {/* Input Area - Mobile Optimized Full Width */}
      <div className="border-t border-gray-200 bg-white">
        <div className="px-4 py-3 safe-area-inset-bottom">
          <div className="flex gap-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                disabled={loading}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium touch-manipulation min-h-[44px] flex items-center"
            >
              {loading ? '...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}