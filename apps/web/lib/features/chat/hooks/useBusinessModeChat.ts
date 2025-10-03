'use client'

import { useState, useEffect } from 'react'
import { ChatContextType, getSystemMessageForContext } from '../services/chatContextMessages'
import { Message } from '@/lib/shared/types'
import { ModalEvent, StateEvent } from '@/lib/shared/types/sseEvents'

interface UseBusinessModeChatProps {
  organizationId?: string
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  sendMessage: (messageContent: string) => Promise<void>
  modalEvent: ModalEvent | null
  statusEvent: StateEvent | null
}

export function useBusinessModeChat({
  organizationId,
  setMessages,
  sendMessage,
  modalEvent,
  statusEvent
}: UseBusinessModeChatProps) {
  // Chat context state
  const [chatContext, setChatContext] = useState<ChatContextType>('business_setup')
  
  // Onboarding completion status using SSE status events
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false)
  const [showVibeCardCompletion, setShowVibeCardCompletion] = useState(false)
  
  // Simple sendMessage wrapper - SSE events handle progress updates automatically
  const wrappedSendMessage = async (messageContent: string) => {
    await sendMessage(messageContent)
    // Note: Progress updates are handled by SSE events, no manual refresh needed
  }

  // Handler for quick reply chip click
  const handleQuickReply = (context: ChatContextType) => {
    setChatContext(context)
    const systemMessage = getSystemMessageForContext(context)
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString() + '-sys',
        role: 'system',
        content: systemMessage,
        timestamp: new Date(),
      },
    ])
  }

  // Handler for multiple choice option selection
  const handleMultipleChoiceSelect = async (selectedOptions: string | string[]) => {
    // Handle both single and multiple selections
    const finalInput = Array.isArray(selectedOptions) 
      ? selectedOptions.join(', ') 
      : selectedOptions
    
    // Automatically send the message directly with progress refresh
    await wrappedSendMessage(finalInput)
  }

  // Listen to modal events from SSE
  useEffect(() => {
    if (!modalEvent || !organizationId) return

    console.log('🎭 [MODAL-CONTROL] Modal event received:', {
      action: modalEvent.action,
      modal: modalEvent.modal,
      organizationId
    })
    
    // Handle vibe card generation modal
    if (modalEvent.modal === 'vibeCardGeneration') {
      if (modalEvent.action === 'show') {
        console.log('✅ [MODAL-CONTROL] Showing vibe card modal')
        setShowVibeCardCompletion(true)
      } else if (modalEvent.action === 'hide') {
        console.log('❌ [MODAL-CONTROL] Hiding vibe card modal')
        setShowVibeCardCompletion(false)
      }
    }
  }, [modalEvent, organizationId])

  // Listen to status events from SSE
  useEffect(() => {
    if (!statusEvent) return

    console.log('📡 [STATE] State event received:', {
      change: statusEvent.change,
      from: statusEvent.from,
      to: statusEvent.to
    })
    
    // Update onboarding completion status
    if (statusEvent.change === 'onboarding_completed') {
      console.log('✅ [STATE] Onboarding completed')
      setIsOnboardingCompleted(true)
    } else if (statusEvent.change === 'mode_switch' && statusEvent.from === 'onboarding') {
      console.log('🔄 [STATE] Switching from onboarding to business mode')
      setIsOnboardingCompleted(true)
    }
  }, [statusEvent])

  return {
    // State
    chatContext,
    isOnboardingCompleted,
    showVibeCardCompletion,
    
    // Actions
    handleQuickReply,
    handleMultipleChoiceSelect,
    setChatContext,
    setShowVibeCardCompletion,
    sendMessage: wrappedSendMessage
  }
}