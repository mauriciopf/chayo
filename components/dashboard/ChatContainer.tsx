'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import ChatMessage from './ChatMessage'
import { Message, Agent, AuthState } from './types'

interface ChatContainerProps {
  messages: Message[]
  chatLoading: boolean
  chatError: string | null
  input: string
  setInput: (input: string) => void
  handleSend: () => void
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
}

export default function ChatContainer({
  messages,
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
  isMobile
}: ChatContainerProps) {
  const t = useTranslations('chat')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col w-full md:rounded-2xl md:border md:border-gray-200 md:shadow-lg bg-white/80 flex-1"
      style={{
        height: isMobile ? 'calc(100dvh - 60px)' : undefined, // Account for mobile header
        maxHeight: isMobile ? 'calc(100dvh - 60px)' : undefined,
        position: 'relative'
      }}
    >
      <div
        className="flex-1 overflow-y-auto px-1 md:px-6 md:py-4"
        ref={chatScrollContainerRef}
        onClick={() => { if (isMobile && !hasUserInteracted) setHasUserInteracted(true); }}
        style={{ 
          scrollPaddingBottom: '20vh'
        }}
      >
        {messages.length === 0 && !chatLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('emptyTitle')}</h3>
              <p className="text-gray-600 mb-4">{t('emptySubtitle')}</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <p className="text-sm text-blue-800 mb-2"><strong>{t('emptyGettingStarted')}</strong></p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• {t('emptyStepBusiness')}</li>
                  <li>• {t('emptyStepChallenges')}</li>
                  <li>• {t('emptyStepUpload')}</li>
                  <li>• {t('emptyStepAsk')}</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        <AnimatePresence>
          {messages.map((msg) => (
            <div key={msg.id} data-message-id={msg.id}>
              <ChatMessage 
                role={msg.role} 
                content={msg.content} 
                timestamp={msg.timestamp} 
                usingRAG={msg.usingRAG}
              />
            </div>
          ))}
          {chatLoading && (
            <div className="py-6 bg-gray-50">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-start">
                  <div className="flex items-start space-x-4 max-w-3xl">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="inline-block bg-white text-gray-900 rounded-2xl px-4 py-3 shadow-sm">
                        <div className="flex items-center space-x-1">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-500 ml-2">{t('loading')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {chatError && (
            <ChatMessage 
              role="ai" 
              content={chatError} 
              timestamp={new Date()} 
            />
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      
      {/* Modern chat input design - 2 rows layout */}
      <div 
        className="bg-gray-50 px-4 py-4 flex-shrink-0"
        style={{
          paddingBottom: isMobile ? 'max(env(safe-area-inset-bottom), 16px)' : undefined
        }}
      >
        <div className={`mx-auto ${isMobile ? 'max-w-none' : 'max-w-4xl'}`}>
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            disabled={uploading}
          />
          
          {/* Modern input container with rounded design */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-3">
            {/* Row 1: Full width input field */}
            <div className="w-full">
              <textarea
                placeholder={t('inputPlaceholder')}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  // Auto-resize using CSS custom properties
                  e.target.style.height = 'auto'
                  e.target.style.height = `min(${e.target.scrollHeight}px, var(--max-input-height, 6rem))`
                }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (authState !== 'authenticated') {
                      await handleOTPFlow()
                    } else {
                      handleSend()
                    }
                  }
                }}
                ref={inputRef as any}
                className="w-full px-0 py-2 focus:outline-none resize-none bg-transparent placeholder-gray-500 text-gray-900 min-h-[2.75rem] max-h-[6rem]"
                rows={1}
                disabled={uploading || otpLoading !== 'none'}
                onFocus={handleInputFocus}
              />
            </div>
            
            {/* Row 2: Action buttons */}
            <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`flex-shrink-0 rounded-xl bg-gray-100/80 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-all duration-200 ${
                isMobile ? 'p-3 min-h-[2.5rem] min-w-[2.5rem]' : 'p-2.5'
              }`}
              title={t('uploadTitle')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <button
              onClick={async () => {
                if (authState !== 'authenticated') {
                  await handleOTPFlow()
                } else {
                  handleSend()
                }
              }}
              disabled={chatLoading || uploading || !input.trim() || otpLoading !== 'none'}
              className={`flex-shrink-0 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm ${
                isMobile ? 'p-3 min-h-[2.5rem] min-w-[2.5rem]' : 'p-2.5'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
            </div>
          </div>
          
          {/* Upload progress indicator */}
          {uploading && (
            <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{t('uploading')}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
} 