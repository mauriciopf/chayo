import { useState, useEffect } from 'react'

export function useOnboardingCompletion(organizationId?: string, currentPhase?: string | null) {
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(false)

  // 1. Initial database check when component mounts or organizationId changes
  useEffect(() => {
    if (!organizationId) {
      // Silently return for unauthenticated users
      setIsCompleted(false)
      return
    }

    const checkInitialCompletionStatus = async () => {
      console.log('🔄 [ONBOARDING] Checking initial completion status from database for:', organizationId)
      setLoading(true)
      
      try {
        // Check setup_completion table directly
        const response = await fetch('/api/setup-completion-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizationId })
        })
        
        if (response.ok) {
          const { isCompleted: dbCompleted } = await response.json()
          console.log('📊 [ONBOARDING] Database completion status:', dbCompleted)
          setIsCompleted(dbCompleted)
        } else {
          console.warn('⚠️ [ONBOARDING] Failed to fetch completion status, defaulting to incomplete')
          setIsCompleted(false)
        }
      } catch (error) {
        console.error('❌ [ONBOARDING] Error checking completion status:', error)
        setIsCompleted(false)
      } finally {
        setLoading(false)
      }
    }

    checkInitialCompletionStatus()
  }, [organizationId])

  // 2. Listen for real-time SSE phase changes when user just completes onboarding
  useEffect(() => {
    if (!organizationId || !currentPhase) return

    console.log('🔄 [ONBOARDING] SSE Phase changed:', currentPhase)

    // When we receive switchingMode phase, it means onboarding just completed
    if (currentPhase === 'switchingMode') {
      console.log('✅ [ONBOARDING] switchingMode detected - onboarding just completed!')
      setIsCompleted(true)
    }
    
    // Note: Vibe card phases (analyzingBusiness, craftingStory, etc.) are handled 
    // by the VibeCardGenerationModal for progress display, not for completion detection
  }, [currentPhase, organizationId])

  return { isCompleted, loading }
}