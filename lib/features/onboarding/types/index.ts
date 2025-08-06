export interface OnboardingProgressData {
  totalQuestions: number
  answeredQuestions: number
  currentStage: string
  progressPercentage: number
  isCompleted: boolean
  currentQuestion?: string
  stage1Completed: boolean
  stage2Completed: boolean
  stage3Completed: boolean
}