import { useState, useEffect } from 'react'
import { OnboardingProgressData } from '../components/OnboardingProgress'

export function useOnboardingProgress(organizationId?: string) {
  const [progress, setProgress] = useState<OnboardingProgressData>({
    totalQuestions: 0,
    answeredQuestions: 0,
    currentStage: 'stage_1',
    progressPercentage: 0,
    isCompleted: false,
    stage1Completed: false,
    stage2Completed: false,
    stage3Completed: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProgress = async () => {
    if (!organizationId) return

    setLoading(true)
    setError(null)

    try {
      // Use API endpoint instead of server-side service
      const response = await fetch('/api/onboarding-status')
      if (response.ok) {
        const { progress: progressData } = await response.json()
        
        setProgress({
          totalQuestions: progressData.totalQuestions,
          answeredQuestions: progressData.answeredQuestions,
          currentStage: progressData.currentStage,
          progressPercentage: progressData.progressPercentage,
          isCompleted: progressData.isCompleted,
          currentQuestion: undefined, // API doesn't return pending questions for client safety
          stage1Completed: progressData.stage1Completed,
          stage2Completed: progressData.stage2Completed,
          stage3Completed: progressData.stage3Completed
        })
      } else {
        throw new Error('Failed to fetch onboarding status')
      }
    } catch (err) {
      console.error('Failed to fetch onboarding progress:', err)
      setError('Failed to load onboarding progress')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (organizationId) {
      fetchProgress()
    }
  }, [organizationId])

  const refreshProgress = () => {
    fetchProgress()
  }

  return {
    progress,
    loading,
    error,
    refreshProgress
  }
} 