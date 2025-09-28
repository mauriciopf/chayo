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
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, chatLoading, chatError, onOptionSelect, thinkingContext = 'default', organizationId, currentPhase }) => {
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
        {chatLoading && (
          <div className="py-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-start">
                <div className="flex items-start space-x-4 max-w-3xl">
                  <div 
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    <svg className="w-5 h-5" style={{ color: 'var(--text-primary)' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div 
                      className="inline-block rounded-2xl px-4 py-3 shadow-sm border"
                      style={{ 
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-secondary)'
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
                          context={thinkingContext} 
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