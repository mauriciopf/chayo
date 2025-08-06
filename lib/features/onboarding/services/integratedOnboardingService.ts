import { supabase } from '@/lib/shared/supabase/client'
import { SetupCompletionService } from './setupCompletionService'
import { BusinessInfoService } from '../../organizations/services/businessInfoService'

export interface OnboardingQuestion {
  field_name: string
  question_template: string
  field_type: 'text' | 'multiple_choice'
  multiple_choices?: string[]
  allow_multiple?: boolean
  stage: string
  order: number
}

export interface OnboardingProgress {
  totalQuestions: number
  answeredQuestions: number
  currentStage: string
  progressPercentage: number
  isCompleted: boolean
  pendingQuestions: OnboardingQuestion[]
  stage1Completed: boolean
  stage2Completed: boolean
  stage3Completed: boolean
}

export class IntegratedOnboardingService {
  private supabaseClient: any
  private setupCompletionService: SetupCompletionService
  private businessInfoService: BusinessInfoService

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient || supabase
    this.setupCompletionService = new SetupCompletionService(supabaseClient)
    this.businessInfoService = new BusinessInfoService(supabaseClient)
  }

  /**
   * Initialize onboarding for an organization
   */
  async initializeOnboarding(organizationId: string): Promise<void> {
    try {
      // Check if onboarding is already initialized
      const { data: existingQuestions, error: checkError } = await this.supabaseClient
        .from('business_info_fields')
        .select('*')
        .eq('organization_id', organizationId)
      
      if (checkError) {
        console.error('Error checking existing questions:', checkError)
        throw checkError
      }
      
      if (existingQuestions && existingQuestions.length > 0) {
        console.log('Onboarding already initialized with', existingQuestions.length, 'questions')
        return // Already initialized
      }

      // DO NOT initialize with hardcoded questions
      // Questions will be generated dynamically by the AI based on the conversation
      console.log('Onboarding initialized - questions will be generated dynamically by AI')

      // Initialize setup completion tracking
      await this.setupCompletionService.getOrCreateSetupCompletion(organizationId)
      console.log('Onboarding initialized successfully')
    } catch (error) {
      console.error('Error initializing onboarding:', error)
      throw error
    }
  }

  /**
   * Get pending questions for an organization
   */
  async getPendingQuestions(organizationId: string): Promise<OnboardingQuestion[]> {
    try {
      const { data: pendingQuestions, error } = await this.supabaseClient
        .from('business_info_fields')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_answered', false)
        .order('order', { ascending: true })

      if (error) {
        console.error('Error fetching pending questions:', error)
        return []
      }
      
      console.log('🔍 Raw pending questions from DB:', pendingQuestions?.length || 0)
      if (pendingQuestions && pendingQuestions.length > 0) {
        console.log('🔍 Sample pending question:', JSON.stringify(pendingQuestions[0], null, 2))
      }

      return pendingQuestions?.map((q: any) => ({
        field_name: q.field_name,
        question_template: q.question_template,
        field_type: q.field_type,
        multiple_choices: q.multiple_choices,
        allow_multiple: q.allow_multiple,
        stage: q.stage || 'stage_1',
        order: q.order || 0
      })) || []
    } catch (error) {
      console.error('Error getting pending questions:', error)
      return []
    }
  }

  /**
   * Get onboarding progress
   */
  async getOnboardingProgress(organizationId: string): Promise<OnboardingProgress> {
    try {
      // Get setup completion status
      const setupStatus = await this.setupCompletionService.getSetupStatus(organizationId)
      const isCompleted = setupStatus?.setup_status === 'completed'

      // Get all questions (answered and unanswered)
      const { data: allQuestions, error } = await this.supabaseClient
        .from('business_info_fields')
        .select('is_answered, stage')
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Error fetching questions for progress:', error)
        return {
          totalQuestions: 0,
          answeredQuestions: 0,
          currentStage: 'stage_1',
          progressPercentage: 0,
          isCompleted: false,
          pendingQuestions: [],
          stage1Completed: false,
          stage2Completed: false,
          stage3Completed: false
        }
      }

      const totalQuestions = allQuestions?.length || 0
      const answeredQuestions = allQuestions?.filter((q: any) => q.is_answered).length || 0
      
      // Calculate stage completion based on questions
      const stage1Questions = allQuestions?.filter((q: any) => q.stage === 'stage_1') || []
      const stage2Questions = allQuestions?.filter((q: any) => q.stage === 'stage_2') || []
      const stage3Questions = allQuestions?.filter((q: any) => q.stage === 'stage_3') || []
      
      const stage1Completed = stage1Questions.length > 0 && stage1Questions.every((q: any) => q.is_answered)
      const stage2Completed = stage2Questions.length > 0 && stage2Questions.every((q: any) => q.is_answered)
      const stage3Completed = stage3Questions.length > 0 && stage3Questions.every((q: any) => q.is_answered)
      
      // Get current stage (stage with most unanswered questions)
      const stageCounts = allQuestions?.reduce((acc: Record<string, number>, q: any) => {
        if (!q.is_answered) {
          acc[q.stage || 'stage_1'] = (acc[q.stage || 'stage_1'] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>) || {}

      const currentStage = Object.keys(stageCounts).length > 0 
        ? Object.entries(stageCounts).sort(([,a], [,b]) => (b as number) - (a as number))[0][0]
        : 'stage_1'
      
      // Calculate progress based on new stage structure:
      // Stage 1: 2 questions (0% → 20%)
      // Stage 2: up to 10 dynamic questions (20% → 80%) 
      // Stage 3: 5 logistics questions (80% → 100%)
      let progressPercentage = 0
      if (isCompleted) {
        progressPercentage = 100
      } else {
        const stage1Answered = stage1Questions.filter((q: any) => q.is_answered).length
        const stage2Answered = stage2Questions.filter((q: any) => q.is_answered).length
        const stage3Answered = stage3Questions.filter((q: any) => q.is_answered).length
        
        if (stage3Completed) {
          progressPercentage = 100
        } else if (stage2Completed) {
          progressPercentage = 80
        } else if (stage1Completed) {
          progressPercentage = 20
        } else {
          // Calculate incremental progress within current stage
          if (currentStage === 'stage_1' && stage1Questions.length > 0) {
            // Stage 1: Each question = 10% (2 questions = 20% total)
            progressPercentage = Math.round((stage1Answered / Math.max(stage1Questions.length, 2)) * 20)
          } else if (currentStage === 'stage_2' && stage2Questions.length > 0) {
            // Stage 2: 20% base + up to 60% more (each question = 6%)
            progressPercentage = 20 + Math.round((stage2Answered / Math.max(stage2Questions.length, 10)) * 60)
          } else if (currentStage === 'stage_3' && stage3Questions.length > 0) {
            // Stage 3: 80% base + up to 20% more (each question = 4%)
            progressPercentage = 80 + Math.round((stage3Answered / Math.max(stage3Questions.length, 5)) * 20)
          } else {
            progressPercentage = answeredQuestions > 0 ? 5 : 0
          }
        }
      }

      // Get pending questions
      const pendingQuestions = await this.getPendingQuestions(organizationId)

      return {
        totalQuestions,
        answeredQuestions,
        currentStage,
        progressPercentage,
        isCompleted,
        pendingQuestions,
        stage1Completed,
        stage2Completed,
        stage3Completed
      }
    } catch (error) {
      console.error('Error getting onboarding progress:', error)
      return {
        totalQuestions: 0,
        answeredQuestions: 0,
        currentStage: 'stage_1',
        progressPercentage: 0,
        isCompleted: false,
        pendingQuestions: [],
        stage1Completed: false,
        stage2Completed: false,
        stage3Completed: false
      }
    }
  }

  /**
   * Process AI response and update progress
   */
  async processAIResponse(organizationId: string, aiMessage: string, userResponse: string): Promise<{
    isCompleted: boolean
    nextQuestion?: OnboardingQuestion
    progress: OnboardingProgress
  }> {
    try {
      // Check for completion signal
      const isCompleted = await this.setupCompletionService.processCompletionSignal(organizationId, aiMessage)
      
      if (isCompleted) {
        const progress = await this.getOnboardingProgress(organizationId)
        return {
          isCompleted: true,
          progress
        }
      }

      // Get current pending question
      const pendingQuestions = await this.getPendingQuestions(organizationId)
      const currentQuestion = pendingQuestions[0]

      if (!currentQuestion) {
        const progress = await this.getOnboardingProgress(organizationId)
        return {
          isCompleted: false,
          progress
        }
      }

      // Validate if the user answered the current question
      const validationResult = await this.businessInfoService.validateAnswerWithAI(
        userResponse,
        currentQuestion.question_template
      )

      if (validationResult.answered && validationResult.answer) {
        try {
          // Update the question as answered
          await this.businessInfoService.updateQuestionAsAnswered(
            organizationId,
            currentQuestion.field_name,
            validationResult.answer,
            validationResult.confidence || 0.8
          )

          // Update setup completion progress
          const progress = await this.getOnboardingProgress(organizationId)
          await this.setupCompletionService.updateProgress(
            organizationId,
            progress.answeredQuestions,
            progress.currentStage,
            { [currentQuestion.field_name]: validationResult.answer }
          )

          // Get next question
          const nextQuestions = await this.getPendingQuestions(organizationId)
          const nextQuestion = nextQuestions[0]

          return {
            isCompleted: false,
            nextQuestion,
            progress: await this.getOnboardingProgress(organizationId)
          }
        } catch (error) {
          console.error('Error processing user response:', error)
          // Return current progress even if update fails
          const progress = await this.getOnboardingProgress(organizationId)
          return {
            isCompleted: false,
            nextQuestion: currentQuestion,
            progress
          }
        }
      }

      // Question not answered, return current progress
      const progress = await this.getOnboardingProgress(organizationId)
      return {
        isCompleted: false,
        nextQuestion: currentQuestion,
        progress
      }
    } catch (error) {
      console.error('Error processing AI response:', error)
      const progress = await this.getOnboardingProgress(organizationId)
      return {
        isCompleted: false,
        progress
      }
    }
  }

  /**
   * Get the next question to ask
   */
  async getNextQuestion(organizationId: string): Promise<OnboardingQuestion | null> {
    try {
      const pendingQuestions = await this.getPendingQuestions(organizationId)
      
      console.log('🔍 Pending questions:', pendingQuestions.length)
      if (pendingQuestions.length > 0) {
        console.log('🔍 Next question:', pendingQuestions[0].question_template)
      }

      return pendingQuestions[0] || null
    } catch (error) {
      console.error('Error getting next question:', error)
      return null
    }
  }

  /**
   * Check if onboarding is completed
   */
  async isOnboardingCompleted(organizationId: string): Promise<boolean> {
    try {
      return await this.setupCompletionService.isSetupCompleted(organizationId)
    } catch (error) {
      console.error('Error checking onboarding completion:', error)
      return false
    }
  }

  /**
   * Reset onboarding for an organization
   */
  async resetOnboarding(organizationId: string): Promise<void> {
    try {
      // Mark all questions as unanswered
      await this.supabaseClient
        .from('business_info_fields')
        .update({ is_answered: false })
        .eq('organization_id', organizationId)

      // Reset setup completion
      await this.supabaseClient
        .from('setup_completion')
        .update({ 
          setup_status: 'in_progress',
          completed_at: null,
          answered_questions: 0,
          current_stage: 'stage_1',
          stage_progress: {},
          completion_data: {}
        })
        .eq('organization_id', organizationId)
    } catch (error) {
      console.error('Error resetting onboarding:', error)
      throw error
    }
  }
} 