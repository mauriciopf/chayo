'use client'

import React from 'react'
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useConversationalVoice } from '../hooks/useConversationalVoice'

interface ConversationalVoiceButtonProps {
  onSendMessage: (message: string) => void
  className?: string
}

export default function ConversationalVoiceButton({
  onSendMessage,
  className = ''
}: ConversationalVoiceButtonProps) {
  const t = useTranslations()

  const {
    isListening,
    isProcessing,
    isSpeaking,
    startListening,
    stopListening,
  } = useConversationalVoice({
    onTranscription: (text) => {
      // This will be handled by auto-send, but we can show progress here
      console.log('Current transcript:', text)
    },
    onError: (error) => {
      console.error('Conversational voice error:', error)
      // You could show a toast notification here
    },
    onSendMessage: (message) => {
      console.log('Auto-sending message:', message)
      onSendMessage(message)
    },
    pauseThreshold: 2000, // 2 seconds of silence before auto-send
    volumeThreshold: 0.01 // Sensitivity threshold
  })

  const handleToggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const getButtonState = () => {
    if (isProcessing) return 'processing'
    if (isListening && isSpeaking) return 'speaking'
    if (isListening) return 'listening'
    return 'idle'
  }

  const getButtonColor = () => {
    const state = getButtonState()
    switch (state) {
      case 'speaking':
        return 'bg-red-500 hover:bg-red-600 animate-pulse'
      case 'listening':
        return 'bg-blue-500 hover:bg-blue-600'
      case 'processing':
        return 'bg-yellow-500 hover:bg-yellow-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  const getButtonIcon = () => {
    const state = getButtonState()
    switch (state) {
      case 'speaking':
        return <Volume2 className="w-5 h-5 text-white" />
      case 'listening':
        return <Mic className="w-5 h-5 text-white" />
      case 'processing':
        return <Loader2 className="w-5 h-5 text-white animate-spin" />
      default:
        return <MicOff className="w-5 h-5 text-white" />
    }
  }

  const getTooltipText = () => {
    const state = getButtonState()
    switch (state) {
      case 'speaking':
        return t('conversationalVoice.speaking', { fallback: 'Speaking detected...' })
      case 'listening':
        return t('conversationalVoice.listening', { fallback: 'Listening... speak naturally' })
      case 'processing':
        return t('conversationalVoice.processing', { fallback: 'Processing speech...' })
      default:
        return t('conversationalVoice.startListening', { fallback: 'Start conversation' })
    }
  }

  const getStatusText = () => {
    const state = getButtonState()
    switch (state) {
      case 'speaking':
        return 'Speaking...'
      case 'listening':
        return 'Listening'
      case 'processing':
        return 'Processing...'
      default:
        return 'Talk'
    }
  }

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      {/* Main conversation button */}
      <button
        onClick={handleToggleListening}
        className={`
          relative flex items-center justify-center w-12 h-12 rounded-full
          transition-all duration-200 transform hover:scale-105
          ${getButtonColor()}
          shadow-lg hover:shadow-xl
          focus:outline-none focus:ring-2 focus:ring-blue-300
          ${isListening ? 'ring-2 ring-blue-300' : ''}
        `}
        title={getTooltipText()}
        disabled={isProcessing}
      >
        {getButtonIcon()}
        
        {/* Pulsing ring effect when listening */}
        {isListening && (
          <div className="absolute inset-0 rounded-full bg-blue-400 opacity-30 animate-ping" />
        )}
      </button>

      {/* Status text */}
      <div className="text-xs text-gray-600 dark:text-gray-400 min-h-[16px] text-center">
        {isListening && (
          <span className={`font-medium ${isSpeaking ? 'text-red-600' : 'text-blue-600'}`}>
            {getStatusText()}
          </span>
        )}
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="text-xs text-yellow-600 dark:text-yellow-400 text-center">
          Transcribing speech...
        </div>
      )}

      {/* Instructions when not listening */}
      {!isListening && !isProcessing && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
          Click to start a natural conversation
        </div>
      )}
    </div>
  )
}