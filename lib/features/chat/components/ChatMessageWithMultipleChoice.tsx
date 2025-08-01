'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import ChatMessage from './ChatMessage'
import MultipleChoice from './MultipleChoice'

interface ChatMessageWithMultipleChoiceProps {
  message: {
    id: string
    role: 'ai' | 'user' | 'system'
    content: string
    timestamp: Date
    multipleChoices?: string[]
    allowMultiple?: boolean
    showOtherOption?: boolean
  }
  onOptionSelect?: (selectedOptions: string | string[]) => void
  disabled?: boolean
}

export default function ChatMessageWithMultipleChoice({ 
  message, 
  onOptionSelect,
  disabled = false 
}: ChatMessageWithMultipleChoiceProps) {
    const [hasSelectedOption, setHasSelectedOption] = useState(false)

  // Extract multiple choice data from raw content if not already parsed
  const extractMultipleChoiceData = (() => {
    if (!message.multipleChoices || message.multipleChoices.length === 0) {
      if (message.content.includes('OPTIONS:') && message.content.includes('QUESTION:')) {
        // Extract options
        const optionsMatch = message.content.match(/OPTIONS:\s*(.+?)(?=\n|MULTIPLE:|OTHER:|$)/i)
        if (optionsMatch) {
          try {
            const options = JSON.parse(optionsMatch[1].trim())
            if (Array.isArray(options) && options.length >= 2) {
              // Extract flags
              const multipleMatch = message.content.match(/MULTIPLE:\s*(true|false)/i)
              const allowMultiple = multipleMatch ? multipleMatch[1].toLowerCase() === 'true' : false
              
              const otherMatch = message.content.match(/OTHER:\s*(true|false)/i)
              const showOtherOption = otherMatch ? otherMatch[1].toLowerCase() === 'true' : false
              
              return {
                options,
                allowMultiple,
                showOtherOption
              }
            }
          } catch (e) {
            // Silently fail if parsing fails
          }
        }
      }
    }
    return null
  })()

  // Safeguard: Check if the content contains raw multiple choice data and clean it
  const cleanContent = (() => {
    if (message.content.includes('OPTIONS:') || message.content.includes('QUESTION:')) {
      // Remove the raw formatting if it somehow got through
      return message.content
        .replace(/QUESTION:\s*.+?(?=\n|OPTIONS:|$)/gi, '')
        .replace(/OPTIONS:\s*.+?(?=\n|MULTIPLE:|OTHER:|$)/gi, '')
        .replace(/MULTIPLE:\s*(true|false)/gi, '')
        .replace(/OTHER:\s*(true|false)/gi, '')
        .replace(/\n\s*\n/g, '\n')
        .trim() || "Please select an option:"
    }
    return message.content
  })()

  const handleOptionSelect = (selectedOptions: string | string[]) => {
    setHasSelectedOption(true)
    if (onOptionSelect) {
      onOptionSelect(selectedOptions)
    }
  }

  return (
    <div className="space-y-3">
      {/* AI message with integrated multiple choice options */}
      {message.role === 'ai' && 
       ((message.multipleChoices && message.multipleChoices.length > 0) || extractMultipleChoiceData) && 
       !hasSelectedOption ? (
        <div className="py-6 bg-gray-50">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-start">
              <div className="flex items-start space-x-4 w-full">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="w-[70%] bg-white text-gray-900 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="mb-3">
                      <p className="text-sm">{cleanContent}</p>
                    </div>
                    
                    {/* Multiple choice options integrated into the chat bubble */}
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="mt-3 pt-3 border-t border-gray-100"
                    >
                      <MultipleChoice
                        options={extractMultipleChoiceData?.options || message.multipleChoices || []}
                        onSelect={handleOptionSelect}
                        disabled={disabled}
                        className="w-full"
                        allowMultiple={extractMultipleChoiceData?.allowMultiple ?? message.allowMultiple ?? false}
                        showOtherOption={extractMultipleChoiceData?.showOtherOption ?? message.showOtherOption ?? false}
                      />
                    </motion.div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Regular chat message for non-multiple choice messages */
        <ChatMessage 
          role={message.role}
          content={cleanContent}
          timestamp={message.timestamp}
        />
      )}
    </div>
  )
} 