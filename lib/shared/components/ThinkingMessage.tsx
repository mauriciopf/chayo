'use client'

import React, { useEffect, useState, useRef } from 'react'
import { thinkingMessageService, ThinkingContext } from '../services/ThinkingMessageService'

interface ThinkingMessageProps {
  context: ThinkingContext
  isVisible: boolean
  className?: string
}

export default function ThinkingMessage({ 
  context, 
  isVisible, 
  className = "text-sm text-gray-500 ml-2" 
}: ThinkingMessageProps) {
  const [currentMessage, setCurrentMessage] = useState<string>('')
  const instanceIdRef = useRef<string>()
  const streamRef = useRef<any>(null)

  // Generate unique instance ID
  useEffect(() => {
    if (!instanceIdRef.current) {
      instanceIdRef.current = `thinking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  }, [])

  useEffect(() => {
    if (!instanceIdRef.current) return

    if (isVisible) {
      // Create new message stream
      streamRef.current = thinkingMessageService.createMessageStream(context, instanceIdRef.current)
      
      // Set up message change callback
      streamRef.current.onMessageChange((message: string) => {
        setCurrentMessage(message)
      })
      
      // Start the stream
      streamRef.current.start()
      
      // Set initial message immediately
      setCurrentMessage(streamRef.current.getCurrentMessage())
    } else {
      // Stop the stream when not visible
      if (streamRef.current) {
        streamRef.current.stop()
      }
    }

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.stop()
      }
    }
  }, [context, isVisible])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (instanceIdRef.current) {
        thinkingMessageService.cleanup(instanceIdRef.current)
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