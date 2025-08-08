'use client'

import React, { useEffect, useState, useRef } from 'react'
import { thinkingMessageService, ThinkingContext, OnboardingProgressData } from '../services/ThinkingMessageService'
import { Loader2 } from 'lucide-react'

interface ThinkingMessageProps {
  context: ThinkingContext
  isVisible: boolean
  className?: string
  onboardingProgress?: OnboardingProgressData // Add onboarding data
  organizationId?: string // Add organization ID for real data
  currentPhase?: string | null
}

export default function ThinkingMessage({ 
  context, 
  isVisible, 
  className = "text-sm text-gray-500 ml-2",
  onboardingProgress,
  organizationId,
  currentPhase
}: ThinkingMessageProps) {
  const [currentMessage, setCurrentMessage] = useState<string>('')
  const instanceIdRef = useRef<string>()
  const streamRef = useRef<any>(null)

  // Generate unique instance ID
  useEffect(() => {
    if (!instanceIdRef.current) {
      instanceIdRef.current = `thinking-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    }
  }, [])

  useEffect(() => {
    if (!instanceIdRef.current) return

    try {
      if (isVisible) {
        // Create new message stream with onboarding progress and organization ID
        streamRef.current = thinkingMessageService.createMessageStream(context, instanceIdRef.current, onboardingProgress, organizationId)
        
        // Set up message change callback
        if (streamRef.current && typeof streamRef.current.onMessageChange === 'function') {
          streamRef.current.onMessageChange((message: string, index: number, total: number) => {
            setCurrentMessage(message)
          })
        }
        
        // Start the stream
        if (streamRef.current && typeof streamRef.current.start === 'function') {
          streamRef.current.start()
        }
        
        // Set initial message immediately
        if (streamRef.current && typeof streamRef.current.getCurrentMessage === 'function') {
          setCurrentMessage(streamRef.current.getCurrentMessage())
        }
      } else {
        // Stop the stream when not visible
        if (streamRef.current && typeof streamRef.current.stop === 'function') {
          streamRef.current.stop()
        }
      }
    } catch (error) {
      console.error('ThinkingMessage error:', error)
      setCurrentMessage('AI is thinking...')
    }

    // Cleanup function
    return () => {
      try {
        if (streamRef.current && typeof streamRef.current.stop === 'function') {
          streamRef.current.stop()
        }
      } catch (error) {
        console.error('ThinkingMessage cleanup error:', error)
      }
    }
  }, [context, isVisible, onboardingProgress, organizationId])

  // Update context when onboarding progress changes
  useEffect(() => {
    if (streamRef.current && onboardingProgress && typeof streamRef.current.updateContext === 'function') {
      streamRef.current.updateContext(onboardingProgress)
    }
  }, [onboardingProgress])

  // Update current phase to adjust messages
  useEffect(() => {
    if (!streamRef.current || !currentPhase) return
    try {
      if (typeof streamRef.current.updatePhase === 'function') {
        streamRef.current.updatePhase(currentPhase)
      }
    } catch {}
  }, [currentPhase])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        if (instanceIdRef.current) {
          thinkingMessageService.cleanup(instanceIdRef.current)
        }
      } catch (error) {
        console.error('ThinkingMessage unmount cleanup error:', error)
      }
    }
  }, [])

  if (!isVisible || !currentMessage) {
    return null
  }

  return (
    <span className={className}>
      {currentMessage}
      <span className="inline-flex ml-1">
        <span className="animate-pulse">.</span>
        <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
        <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
      </span>
    </span>
  )
}