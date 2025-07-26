import React from "react"
import { useTranslations } from 'next-intl'
import { formatTime } from '@/lib/utils/time'

interface ChatMessageProps {
  role: "user" | "ai" | "system"
  content: string
  timestamp?: Date
}

export default function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const t = useTranslations('chat')

  // Safeguard: Check if the content contains raw multiple choice data and clean it
  const cleanContent = (() => {
    if (role === 'ai' && content.includes('OPTIONS:') && content.includes('MULTIPLE:')) {
      // Remove the raw formatting if it somehow got through
      return content
        .replace(/OPTIONS:\s*.+?(?=\n|MULTIPLE:|OTHER:|$)/gi, '')
        .replace(/MULTIPLE:\s*(true|false)/gi, '')
        .replace(/OTHER:\s*(true|false)/gi, '')
        .replace(/\n\s*\n/g, '\n')
        .trim() || "Please select an option:"
    }
    return content
  })()

  if (role === "system") {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className={`py-6 ${role === "user" ? "bg-white" : "bg-gray-50"}`}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`flex ${role === "user" ? "flex-row-reverse" : "flex-row"} items-start space-x-4 w-full`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              role === "user" 
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" 
                : "bg-gradient-to-r from-green-500 to-blue-500 text-white"
            }`}>
              {role === "user" ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              )}
            </div>

            {/* Message Content */}
            <div className={`flex-1 ${role === "user" ? "text-right" : "text-left"}`}>
              <div className={`${role === "user" ? "inline-block" : "w-[70%]"} ${role === "user" ? "bg-purple-600 text-white" : "bg-white text-gray-900"} rounded-2xl px-4 py-3 shadow-sm`}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{cleanContent}</div>
              </div>
              {timestamp && (
                <div className={`text-xs text-gray-500 mt-2 ${
                  role === "user" ? "text-right" : "text-left"
                }`}>
                  {formatTime(timestamp)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 