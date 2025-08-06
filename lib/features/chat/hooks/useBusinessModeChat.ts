'use client'

import { useState, useEffect } from 'react'
import { ChatContextType, getSystemMessageForContext } from '../services/chatContextMessages'
import { useOnboardingProgress } from '../../onboarding/hooks/useOnboardingProgress'
import { Message } from '@/lib/shared/types'

interface UseBusinessModeChatProps {
  organizationId?: string
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  sendMessage: (messageContent: string) => Promise<void>
  unlockQRCode?: () => void
  onNavigateToQR?: () => void
  refreshOnboardingProgress?: () => void
}

export function useBusinessModeChat({
  organizationId,
  setMessages,
  sendMessage,
  unlockQRCode,
  onNavigateToQR,
  refreshOnboardingProgress: externalRefreshOnboardingProgress
}: UseBusinessModeChatProps) {
  // Chat context state
  const [chatContext, setChatContext] = useState<ChatContextType>('business_setup')
  
  // Onboarding progress state using custom hook
  const { progress: onboardingProgress, refreshProgress: refreshOnboardingProgress } = useOnboardingProgress(organizationId)
  const [showOnboardingProgress, setShowOnboardingProgress] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  
  // Wrapped sendMessage that refreshes onboarding progress after sending
  const wrappedSendMessage = async (messageContent: string) => {
    await sendMessage(messageContent)
    
    // Add a small delay to ensure database transaction is completed
    // before refreshing the progress
    setTimeout(() => {
      if (externalRefreshOnboardingProgress) {
        externalRefreshOnboardingProgress()
      } else {
        refreshOnboardingProgress()
      }
    }, 500) // 500ms delay
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

  // Update onboarding visibility when progress changes
  useEffect(() => {
    console.log('🔄 Onboarding progress changed:', {
      isCompleted: onboardingProgress.isCompleted,
      progressPercentage: onboardingProgress.progressPercentage,
      currentStage: onboardingProgress.currentStage,
      answeredQuestions: onboardingProgress.answeredQuestions,
      totalQuestions: onboardingProgress.totalQuestions,
      willShowProgress: !onboardingProgress.isCompleted
    })
    
    setShowOnboardingProgress(!onboardingProgress.isCompleted)
    
    // Only show completion modal once when setup is completed
    if (onboardingProgress.isCompleted && !hasShownCompletionModal && organizationId) {
      console.log('✅ Showing onboarding completion modal')
      setShowCompletion(true)
      setHasShownCompletionModal(true)
      // Persist the flag to localStorage
      localStorage.setItem(getCompletionModalShownKey(organizationId), 'true')
    }
  }, [onboardingProgress.isCompleted, hasShownCompletionModal, organizationId])

  // Update hasShownCompletionModal when organizationId changes
  useEffect(() => {
    if (organizationId) {
      const hasShown = localStorage.getItem(getCompletionModalShownKey(organizationId)) === 'true'
      setHasShownCompletionModal(hasShown)
    }
  }, [organizationId])

  return {
    // State
    chatContext,
    onboardingProgress,
    showOnboardingProgress,
    showCompletion,
    hasShownCompletionModal,
    
    // Actions
    handleQuickReply,
    handleMultipleChoiceSelect,
    setChatContext,
    setShowCompletion,
    setShowOnboardingProgress,
    refreshOnboardingProgress,
    sendMessage: wrappedSendMessage,
    
    // Handlers for components
    onContinueCompletion: () => {
      setShowCompletion(false)
      setShowOnboardingProgress(false)
      // Unlock QR code when user clicks "Start Using Chayo"
      if (unlockQRCode) {
        unlockQRCode()
      }
    },
    onNavigateToQR
  }
}