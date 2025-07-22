import React from 'react'
import { AnimatePresence } from 'framer-motion'
import ChatMessage from './ChatMessage'
import { Message } from './types'
import { useTranslations } from 'next-intl'

interface ChatMessagesProps {
  messages: Message[]
  chatLoading: boolean
  chatError: string | null
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, chatLoading, chatError }) => {
  const t = useTranslations('chat')
  return (
    <>
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
    </>
  )
}

export default ChatMessages 