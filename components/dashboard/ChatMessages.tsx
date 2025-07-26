import React from 'react'
import { AnimatePresence } from 'framer-motion'
import ChatMessage from './ChatMessage'
import ChatMessageWithMultipleChoice from './ChatMessageWithMultipleChoice'
import { Message } from './types'
import { useTranslations } from 'next-intl'

interface ChatMessagesProps {
  messages: Message[]
  chatLoading: boolean
  chatError: string | null
  onOptionSelect?: (selectedOptions: string | string[]) => void
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, chatLoading, chatError, onOptionSelect }) => {
    const t = useTranslations('chat')
  

  
  return (
    <>
      <AnimatePresence>
        {messages.map((msg) => {
          // Additional check: if message content contains raw multiple choice data but wasn't parsed,
          // we should still route it to the multiple choice component
          const hasRawMultipleChoiceData = msg.role === 'ai' && 
            ((msg.content.includes('OPTIONS:') && msg.content.includes('MULTIPLE:')) ||
             (msg.content.includes('QUESTION:') && msg.content.includes('OPTIONS:'))) &&
            (!msg.multipleChoices || msg.multipleChoices.length === 0)
          
          return (
            <div key={msg.id} data-message-id={msg.id}>
              {(msg.multipleChoices && msg.multipleChoices.length > 0) || hasRawMultipleChoiceData ? (
                <ChatMessageWithMultipleChoice
                  message={msg}
                  onOptionSelect={onOptionSelect}
                />
              ) : (
                <ChatMessage 
                  role={msg.role} 
                  content={msg.content} 
                  timestamp={msg.timestamp} 
                />
              )}
            </div>
          )
        })}
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