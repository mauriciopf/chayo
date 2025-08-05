import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useVoiceRecording } from '../hooks/useVoiceRecording'

interface VoiceInputButtonProps {
  onTranscription: (text: string) => void
  disabled?: boolean
  isMobile?: boolean
  autoSend?: boolean // Enable auto-send functionality
  onSendMessage?: (message: string) => void // Callback for auto-sending
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscription,
  disabled = false,
  isMobile = false,
  autoSend = false,
  onSendMessage
}) => {
  const t = useTranslations('chat.voiceInput')
  const [error, setError] = useState<string | null>(null)

  const {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    cancelRecording,
    isSupported
  } = useVoiceRecording({
    onTranscription: (text) => {
      onTranscription(text)
      setError(null)
    },
    onError: (errorMessage) => {
      setError(errorMessage)
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000)
    },
    autoSend,
    onSendMessage
  })

  if (!isSupported) {
    return null // Don't show button if voice recording is not supported
  }

  const handleClick = () => {
    if (isRecording) {
      stopRecording()
    } else if (!isProcessing) {
      startRecording()
    }
  }

  const getButtonContent = () => {
    if (isProcessing) {
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    }

    if (isRecording) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 6h12v12H6z" />
        </svg>
      )
    }

    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z" />
        <path d="M19 10v1a7 7 0 01-14 0v-1a1 1 0 012 0v1a5 5 0 0010 0v-1a1 1 0 112 0z" />
        <path d="M12 18.5a1 1 0 01-1-1v-1a1 1 0 012 0v1a1 1 0 01-1 1z" />
        <path d="M9 21h6a1 1 0 010 2H9a1 1 0 010-2z" />
      </svg>
    )
  }

  const getButtonColor = () => {
    if (isRecording) {
      return 'bg-red-600 hover:bg-red-500'
    }
    if (isProcessing) {
      return 'bg-yellow-600 hover:bg-yellow-500'
    }
    return 'bg-gray-700 hover:bg-gray-600'
  }

  const getTooltip = () => {
    if (isRecording) return t('stopRecording')
    if (isProcessing) return t('processing')
    return t('startRecording')
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={`flex-shrink-0 rounded-full text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg ${getButtonColor()} ${isMobile ? 'p-3 min-h-[2.5rem] min-w-[2.5rem]' : 'p-2'}`}
        title={getTooltip()}
      >
        {getButtonContent()}
      </button>

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute -top-1 -right-1">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Error tooltip */}
      {error && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg max-w-48 text-center">
            {error}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-600"></div>
        </div>
      )}

      {/* Long press cancel on mobile */}
      {isRecording && isMobile && (
        <div className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>{t('stopRecording')}</span>
            </div>
            <button
              onClick={cancelRecording}
              className="mt-2 text-red-400 hover:text-red-300 text-xs underline"
            >
              {t('cancel', { fallback: 'Cancel' })}
            </button>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  )
}

export default VoiceInputButton