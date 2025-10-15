import React from 'react'
import ChatModeSelector from './ChatModeSelector'
import VoiceInputButton from './VoiceInputButton'
import { AuthState, Message } from '../../../shared/types'
import { ChatContextType } from '../services/chatContextMessages'
import { useTranslations } from 'next-intl'

type ChatMode = 'business' | 'client'

interface ChatInputProps {
  input: string
  setInput: (input: string) => void
  handleSend: () => void
  handleInputFocus: () => void
  handleOTPFlow: () => Promise<void>
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  uploading: boolean
  otpLoading: string
  chatLoading: boolean
  authState: AuthState
  isMobile: boolean
  chatContext: ChatContextType
  setChatContext: (context: ChatContextType) => void
  currentOnboardingQuestion?: string
  isOnboardingActive?: boolean
  chatMode?: ChatMode
  onModeSwitch?: (mode: ChatMode) => void
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  handleSend,
  handleInputFocus,
  handleOTPFlow,
  inputRef,
  fileInputRef,
  handleFileChange,
  uploading,
  otpLoading,
  chatLoading,
  authState,
  isMobile,
  chatContext,
  setChatContext,
  currentOnboardingQuestion,
  isOnboardingActive,
  chatMode,
  onModeSwitch
}) => {
  const t = useTranslations('chat')

  return (
    <div 
      className="dark px-4 py-4 flex-shrink-0" 
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        paddingBottom: isMobile ? 'max(env(safe-area-inset-bottom), 16px)' : undefined 
      }}
    >
      <div className="w-full max-w-none"> 
        <input
          type="file"
          ref={fileInputRef as React.RefObject<HTMLInputElement>}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          disabled={uploading}
        />
        <div 
          className="rounded-2xl shadow-lg border p-3" 
          style={{ 
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)'
          }}
        >
          <div className="w-full">
            <textarea
              placeholder={isOnboardingActive && currentOnboardingQuestion ? currentOnboardingQuestion : t('inputPlaceholder')}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
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
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              className={`w-full px-3 py-3 focus:outline-none resize-none font-medium min-h-[2.75rem] max-h-[6rem] leading-relaxed ${isOnboardingActive ? 'placeholder-blue-300' : 'placeholder-gray-400'}`}
              style={{ 
                color: '#ffffff', 
                caretColor: '#ffffff',
                backgroundColor: 'transparent',
                WebkitTextFillColor: '#ffffff'
              }}
              rows={1}
              disabled={uploading || otpLoading !== 'none'}
              onFocus={handleInputFocus}
            />
          </div>
          <div className="flex justify-between items-center pt-3">
            <ChatModeSelector 
              context={chatContext} 
              onSelect={setChatContext} 
              chatMode={chatMode}
              onModeSwitch={onModeSwitch}
            />
            <div className="flex gap-2">
              {/* Voice Input with Auto-stop on silence - transcribed text appears in input for manual review */}
              <VoiceInputButton
                onTranscription={(text) => {
                  // Place transcribed text in input for manual review before sending
                  setInput(text)
                }}
                disabled={uploading || chatLoading || otpLoading !== 'none'}
                isMobile={isMobile}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={`flex-shrink-0 rounded-full focus:ring-2 focus:outline-none disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg ${isMobile ? 'p-3 min-h-[2.5rem] min-w-[2.5rem]' : 'p-2'}`}
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  '--tw-ring-color': 'var(--border-focus)'
                } as React.CSSProperties}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                title={t('uploadTitle')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className={`flex-shrink-0 rounded-full bg-blue-600 text-white hover:bg-blue-500 focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg ${isMobile ? 'p-3 min-h-[2.5rem] min-w-[2.5rem]' : 'p-2'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
          {uploading && (
            <div className="flex items-center space-x-2 mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{t('uploading')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatInput 