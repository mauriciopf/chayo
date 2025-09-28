'use client'

import { useState, useEffect } from 'react'
import { ChatContextType, getSystemMessageForContext } from '../services/chatContextMessages'
import { useOnboardingCompletion } from '../../onboarding/hooks/useOnboardingCompletion'
import { Message } from '@/lib/shared/types'

interface UseBusinessModeChatProps {
  organizationId?: string
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  sendMessage: (messageContent: string) => Promise<void>
  unlockQRCode?: () => void
  onNavigateToQR?: () => void
  currentPhase?: string | null
}

export function useBusinessModeChat({
  organizationId,
  setMessages,
  sendMessage,
  unlockQRCode,
  onNavigateToQR,
  currentPhase
}: UseBusinessModeChatProps) {
  // Chat context state
  const [chatContext, setChatContext] = useState<ChatContextType>('business_setup')
  
  // Onboarding completion status using database + SSE-based hook
  const { isCompleted: isOnboardingCompleted, loading: onboardingLoading } = useOnboardingCompletion(organizationId, currentPhase)
  const [showCompletion, setShowCompletion] = useState(false)
  
  // Simple sendMessage wrapper - SSE events handle progress updates automatically
  const wrappedSendMessage = async (messageContent: string) => {
    await sendMessage(messageContent)
    // Note: Progress updates are handled by SSE events, no manual refresh needed
  }
  
  // Persistent flag using localStorage
  const getCompletionModalShownKey = (orgId: string) => `onboarding_modal_shown_${orgId}`
  const [hasShownCompletionModal, setHasShownCompletionModal] = useState(() => {
    if (typeof window !== 'undefined' && organizationId) {
      return localStorage.getItem(getCompletionModalShownKey(organizationId)) === 'true'
    }
    return false
  })

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

  // Show vibe card generation modal when onboarding completes
  useEffect(() => {
    console.log('🔄 [MODAL-DEBUG] Onboarding completion changed:', {
      isCompleted: isOnboardingCompleted,
      hasShownCompletionModal,
      organizationId,
      shouldShowModal: isOnboardingCompleted && !hasShownCompletionModal && organizationId
    })
    
    // Only show vibe card generation modal once when setup is completed
    if (isOnboardingCompleted && !hasShownCompletionModal && organizationId) {
      console.log('✅ [MODAL-DEBUG] Showing vibe card generation modal - all conditions met!')
      setShowCompletion(true)
      setHasShownCompletionModal(true)
      // Persist the flag to localStorage
      localStorage.setItem(getCompletionModalShownKey(organizationId), 'true')
    }
  }, [isOnboardingCompleted, hasShownCompletionModal, organizationId])

  // Update hasShownCompletionModal when organizationId changes
  useEffect(() => {
    if (organizationId) {
      const hasShown = localStorage.getItem(getCompletionModalShownKey(organizationId)) === 'true'
      setHasShownCompletionModal(hasShown)
    }
  }, [organizationId])

  // Note: SSE phase detection is now handled directly in useOnboardingCompletion hook

  return {
    // State
    chatContext,
    isOnboardingCompleted,
    showCompletion,
    hasShownCompletionModal,
    
    // Actions
    handleQuickReply,
    handleMultipleChoiceSelect,
    setChatContext,
    setShowCompletion,
    sendMessage: wrappedSendMessage,
    
    // Handlers for components
    onContinueCompletion: () => {
      setShowCompletion(false)
      // Simple QR unlock logic: if onboarding is completed, unlock QR
      if (isOnboardingCompleted && unlockQRCode) {
        unlockQRCode()
      }
    },
    onNavigateToQR
  }
}