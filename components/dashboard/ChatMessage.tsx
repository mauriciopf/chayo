import React from "react"
import { useTranslations } from 'next-intl'

interface ChatMessageProps {
  role: "user" | "ai" | "system"
  content: string
  timestamp?: Date
  usingRAG?: boolean
}

export default function ChatMessage({ role, content, timestamp, usingRAG }: ChatMessageProps) {
  const t = useTranslations('chat')
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`flex ${role === "user" ? "flex-row-reverse" : "flex-row"} items-start space-x-4 max-w-3xl`}>
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
              <div className={`inline-block ${role === "user" ? "bg-purple-600 text-white" : "bg-white text-gray-900"} rounded-2xl px-4 py-3 shadow-sm max-w-2xl`}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{content}</div>
                {usingRAG && role === "ai" && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('usingRAG')}
                  </div>
                )}
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