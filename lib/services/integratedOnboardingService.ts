import { supabase } from '@/lib/supabase/client'
import { SetupCompletionService } from './setupCompletionService'
import { BusinessInfoService } from './businessInfoService'

export interface OnboardingQuestion {
  field_name: string
  question_template: string
  field_type: 'text' | 'multiple_choice'
  multiple_choices?: string[]
  allow_multiple?: boolean
  show_other?: boolean
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
      const existingQuestions = await this.getPendingQuestions(organizationId)
      if (existingQuestions.length > 0) {
        return // Already initialized
      }

      // Get all questions from ServerYamlPromptLoader (Stage 1 and Stage 3 only for now)
      // Only import on server-side to avoid client-side issues
      if (typeof window === 'undefined') {
        const { ServerYamlPromptLoader } = await import('./systemPrompt/ServerYamlPromptLoader')
        const allQuestions = await ServerYamlPromptLoader.getAllQuestions()
        
        // Store questions in business_info_fields table (Stage 1 and Stage 3)
        const questionsToStore = allQuestions.map((q: any, index: number) => ({
          organization_id: organizationId,
          field_name: q.field_name,
          field_type: q.type === 'open_ended' ? 'text' : q.type, // Convert open_ended to text for database
          is_answered: false,
          question_template: q.question,
          multiple_choices: q.options || null,
          allow_multiple: q.multiple || false,
          show_other_option: q.other || false, // Use show_other_option to match database column
          stage: q.stage,
          order: index + 1
        }))
        
        const { data: insertResult, error: insertError } = await this.supabaseClient
          .from('business_info_fields')
          .insert(questionsToStore)
          .select()
        
        if (insertError) {
          console.error('Error inserting questions:', insertError)
          throw insertError
        }
      }

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

      return pendingQuestions?.map((q: any) => ({
        field_name: q.field_name,
        question_template: q.question_template,
        field_type: q.field_type,
        multiple_choices: q.multiple_choices,
        allow_multiple: q.allow_multiple,
        show_other: q.show_other_option, // Map from database column to interface
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
          pendingQuestions: []
        }
      }

      const totalQuestions = allQuestions?.length || 0
      const answeredQuestions = allQuestions?.filter((q: any) => q.is_answered).length || 0
      
      // Calculate progress based on completion status rather than just question count
      let progressPercentage = 0
      if (isCompleted) {
        progressPercentage = 100
      } else if (totalQuestions > 0) {
        // Show progress within current stage
        progressPercentage = Math.round((answeredQuestions / totalQuestions) * 100)
      }

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

      // Get pending questions
      const pendingQuestions = await this.getPendingQuestions(organizationId)

      return {
        totalQuestions,
        answeredQuestions,
        currentStage,
        progressPercentage,
        isCompleted,
        pendingQuestions
      }
    } catch (error) {
      console.error('Error getting onboarding progress:', error)
      return {
        totalQuestions: 0,
        answeredQuestions: 0,
        currentStage: 'stage_1',
        progressPercentage: 0,
        isCompleted: false,
        pendingQuestions: []
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