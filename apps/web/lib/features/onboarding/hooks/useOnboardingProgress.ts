import { useState, useEffect } from 'react'

export function useOnboardingCompletion(organizationId?: string, currentPhase?: string | null) {
  const [isCompleted, setIsCompleted] = useState(false)

  // Initialize as incomplete
  useEffect(() => {
    if (!organizationId) {
      setIsCompleted(false)
      return
    }

    console.log('🔄 [ONBOARDING] Initializing completion status for organization:', organizationId)
    setIsCompleted(false)
  }, [organizationId])

  // Listen for SSE phase changes to determine completion status
  useEffect(() => {
    if (!organizationId || !currentPhase) return

    console.log('🔄 [ONBOARDING] Phase changed:', currentPhase)

    // When we receive switchingMode phase, it means onboarding is completed
    if (currentPhase === 'switchingMode') {
      console.log('✅ [ONBOARDING] switchingMode detected - onboarding completed!')
      setIsCompleted(true)
    }
    
    // Handle vibe card generation phases (these happen after completion)
    const vibeCardPhases = [
      'generatingVibeCard',
      'analyzingBusiness', 
      'craftingStory',
      'selectingColors',
      'generatingVibeImage',
      'finalizingVibeCard'
    ]
    
    if (vibeCardPhases.includes(currentPhase)) {
      console.log('🎨 [ONBOARDING] Vibe card generation phase - onboarding completed!')
      setIsCompleted(true)
    }
  }, [currentPhase, organizationId])

  return isCompleted
}