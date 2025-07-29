import { useState, useEffect } from 'react'
import { IntegratedOnboardingService } from '@/lib/services/integratedOnboardingService'
import { OnboardingProgressData } from '@/components/dashboard/OnboardingProgress'

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
      const onboardingService = new IntegratedOnboardingService()
      const progressData = await onboardingService.getOnboardingProgress(organizationId)
      
      // Get the current question if there are pending questions
      const currentQuestion = progressData.pendingQuestions.length > 0 
        ? progressData.pendingQuestions[0].question_template 
        : undefined

      setProgress({
        totalQuestions: progressData.totalQuestions,
        answeredQuestions: progressData.answeredQuestions,
        currentStage: progressData.currentStage,
        progressPercentage: progressData.progressPercentage,
        isCompleted: progressData.isCompleted,
        currentQuestion,
        stage1Completed: progressData.stage1Completed,
        stage2Completed: progressData.stage2Completed,
        stage3Completed: progressData.stage3Completed
      })
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