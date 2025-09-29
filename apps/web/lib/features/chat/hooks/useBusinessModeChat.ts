'use client'

import { useState, useEffect } from 'react'
import { ChatContextType, getSystemMessageForContext } from '../services/chatContextMessages'
import { useOnboardingCompletion } from '../../onboarding/hooks/useOnboardingCompletion'
import { Message } from '@/lib/shared/types'

interface UseBusinessModeChatProps {
  organizationId?: string
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  sendMessage: (messageContent: string) => Promise<void>
  currentPhase?: string | null
}

export function useBusinessModeChat({
  organizationId,
  setMessages,
  sendMessage,
  currentPhase
}: UseBusinessModeChatProps) {
  // Chat context state
  const [chatContext, setChatContext] = useState<ChatContextType>('business_setup')
  
  // Onboarding completion status using database + SSE-based hook
  const { isCompleted: isOnboardingCompleted, loading: onboardingLoading } = useOnboardingCompletion(organizationId, currentPhase)
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

  // Show vibe card generation modal when vibe card generation starts
  useEffect(() => {
    if (!organizationId || !currentPhase) return

    console.log('🔄 [MODAL-DEBUG] Current phase changed:', {
      currentPhase,
      organizationId,
      showVibeCardCompletion
    })
    
    // Show modal when vibe card generation starts
    if (currentPhase === 'startingVibeCardGeneration' && organizationId) {
      console.log('✅ [MODAL-DEBUG] startingVibeCardGeneration detected - showing vibe card modal!')
      setShowVibeCardCompletion(true)
    }
  }, [currentPhase, organizationId])

  // Note: SSE phase detection is now handled directly in useOnboardingCompletion hook

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