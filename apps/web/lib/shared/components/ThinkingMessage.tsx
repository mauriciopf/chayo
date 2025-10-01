'use client'

import React, { useEffect, useState, useRef } from 'react'
import { thinkingMessageService, ThinkingContext } from '../services/ThinkingMessageService'
import { Shield, Database, Settings, Zap } from 'lucide-react'

interface ThinkingMessageProps {
  context: ThinkingContext
  isVisible: boolean
  className?: string
  organizationId?: string // Add organization ID for real data
  currentPhase?: string | null
  messageType?: 'default' | 'auth' | 'dashboard' | 'onboarding' | 'system' // New message types
}

export default function ThinkingMessage({ 
  context, 
  isVisible, 
  className = "text-sm text-zinc-400 ml-2",
  organizationId,
  currentPhase,
  messageType = 'default'
}: ThinkingMessageProps) {
  const [currentMessage, setCurrentMessage] = useState<string>('')
  const instanceIdRef = useRef<string | undefined>(undefined)
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
        streamRef.current = thinkingMessageService.createMessageStream(context, instanceIdRef.current, undefined, organizationId)
        
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
      setCurrentMessage('La IA está pensando...')
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
  }, [context, isVisible, organizationId])

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

  // Get icon and styling based on message type
  const getIconAndStyling = () => {
    switch (messageType) {
      case 'auth':
        return {
          icon: <Shield className="w-4 h-4 mr-1" />,
          className: "text-sm text-zinc-300 ml-2 flex items-center"
        }
      case 'dashboard':
        return {
          icon: <Database className="w-4 h-4 mr-1" />,
          className: "text-sm text-zinc-300 ml-2 flex items-center"
        }
      case 'onboarding':
        return {
          icon: <Settings className="w-4 h-4 mr-1" />,
          className: "text-sm text-zinc-300 ml-2 flex items-center"
        }
      case 'system':
        return {
          icon: <Zap className="w-4 h-4 mr-1" />,
          className: "text-sm text-zinc-300 ml-2 flex items-center"
        }
      default:
        return {
          icon: null,
          className: className
        }
    }
  }

  const { icon, className: messageClassName } = getIconAndStyling()

  return (
    <span className={messageClassName}>
      {icon}
      {currentMessage}
      <span className="inline-flex ml-1">
        <span className="animate-pulse">.</span>
        <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
        <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
      </span>
    </span>
  )
}
