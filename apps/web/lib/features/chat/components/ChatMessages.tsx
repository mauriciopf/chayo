import React from 'react'
import { AnimatePresence } from 'framer-motion'
import ChatMessage from './ChatMessage'
import ChatMessageWithMultipleChoice from './ChatMessageWithMultipleChoice'
import ThinkingMessage from '../../../shared/components/ThinkingMessage'
import { Message } from '../../../shared/types'
import { ThinkingContext } from '../../../shared/services/ThinkingMessageService'
import { useTranslations } from 'next-intl'

interface ChatMessagesProps {
  messages: Message[]
  chatLoading: boolean
  chatError: string | null
  onOptionSelect?: (selectedOptions: string | string[]) => void
  thinkingContext?: ThinkingContext
  organizationId?: string
  currentPhase?: string | null
  otpLoading?: string
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ 
  messages, 
  chatLoading, 
  chatError, 
  onOptionSelect, 
  thinkingContext = 'default', 
  organizationId, 
  currentPhase,
  otpLoading = 'none'
}) => {
    const t = useTranslations('chat')
  

  
  return (
    <>
      <AnimatePresence>
        {messages.map((msg) => {
          // Check for raw JSON that wasn't parsed (backup handling)
          const hasRawJSONData = msg.role === 'ai' && 
            msg.content.includes('"question_template"') && 
            msg.content.includes('"field_type"') &&
            (!msg.multipleChoices || msg.multipleChoices.length === 0)
          
          return (
            <div key={msg.id} data-message-id={msg.id}>
              {(msg.multipleChoices && msg.multipleChoices.length > 0) || hasRawJSONData ? (
                <ChatMessageWithMultipleChoice
                  message={msg}
                  onOptionSelect={onOptionSelect}
                />
              ) : (
                <ChatMessage 
                  role={msg.role} 
                  content={msg.content} 
                  timestamp={msg.timestamp}
                  appointmentLink={msg.appointmentLink}
                  documentSigningLink={msg.documentSigningLink}
                  isToolSuggestion={msg.isToolSuggestion}
                  toolName={msg.toolName}
                />
              )}
            </div>
          )
        })}
        {(chatLoading || otpLoading !== 'none') && (
          <div className="py-4">
            <div className="w-full px-4">
              <div className="flex justify-start">
                <div className="flex items-start gap-3 max-w-[75%]">
                  <div 
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-green-500 to-blue-500 text-white"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div 
                      className="px-4 py-3"
                      style={{ 
                        backgroundColor: 'transparent',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                          <div 
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{ backgroundColor: 'var(--text-muted)' }}
                          ></div>
                          <div 
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{ 
                              backgroundColor: 'var(--text-muted)',
                              animationDelay: '0.1s' 
                            }}
                          ></div>
                          <div 
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{ 
                              backgroundColor: 'var(--text-muted)',
                              animationDelay: '0.2s' 
                            }}
                          ></div>
                        </div>
                        <ThinkingMessage 
                          context={otpLoading === 'sending' ? 'otp_sending' : otpLoading === 'verifying' ? 'otp_verifying' : thinkingContext} 
                          isVisible={true}
                          className="text-sm ml-2"
                          organizationId={organizationId}
                          currentPhase={currentPhase as any}
                          messageType={(currentPhase as any)?.messageType || 'default'}
                        />
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
            appointmentLink={undefined}
            documentSigningLink={undefined}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default ChatMessages 