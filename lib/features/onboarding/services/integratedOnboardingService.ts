import { supabase } from '@/lib/shared/supabase/client'
import { SetupCompletionService } from './setupCompletionService'
import { BusinessInfoService } from '../../organizations/services/businessInfoService'

export interface OnboardingQuestion {
  field_name: string
  question_template: string
  field_type: 'text' | 'multiple_choice'
  multiple_choices?: string[]
  allow_multiple?: boolean
  order: number
}

export interface OnboardingProgress {
  totalQuestions: number
  answeredQuestions: number
  currentStage: string
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

  /** Normalize status signals coming from AI prompts */
  private normalizeStatusSignal(signal?: string | null):
    | 'setup_complete'
    | 'stage_1_complete'
    | 'stage_2_complete'
    | 'stage_3_complete'
    | null {
    if (!signal) return null
    const s = signal.toLowerCase().trim()
    if (['setup_complete', 'onboarding_complete', 'onboarding_completed', 'completed'].includes(s)) return 'setup_complete'
    if (['stage_1_complete', 'stage1_complete', 'stage_one_complete'].includes(s)) return 'stage_1_complete'
    if (['stage_2_complete', 'stage2_complete', 'stage_two_complete'].includes(s)) return 'stage_2_complete'
    if (['stage_3_complete', 'stage3_complete', 'stage_three_complete'].includes(s)) return 'stage_3_complete'
    return null
  }



  /**
   * Get pending questions for an organization
   */
  async getPendingQuestions(organizationId: string): Promise<OnboardingQuestion[]> {
    try {
      const { data: pendingQuestions, error } = await this.supabaseClient
        .from('business_info_fields')
        .select('field_name, question_template, field_type, multiple_choices, allow_multiple, order')
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
        order: q.order || 0
      })) || []
    } catch (error) {
      console.error('Error getting pending questions:', error)
      return []
    }
  }

  /**
   * Get onboarding progress (creates setup tracking if needed)
   */
  async getOnboardingProgress(organizationId: string): Promise<OnboardingProgress> {
    try {
      // Get/create setup completion status (idempotent)
      const setupStatus = await this.setupCompletionService.getOrCreateSetupCompletion(organizationId)
      const isCompleted = setupStatus?.setup_status === 'completed'

      // Get all questions (answered and unanswered)
      const { data: allQuestions, error } = await this.supabaseClient
        .from('business_info_fields')
        .select('is_answered')
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Error fetching questions for progress:', error)
        return {
          totalQuestions: 0,
          answeredQuestions: 0,
          currentStage: 'stage_1',
          isCompleted: false,
          pendingQuestions: [],
          stage1Completed: false,
          stage2Completed: false,
          stage3Completed: false
        }
      }

      const totalQuestions = allQuestions?.length || 0
      const answeredQuestions = allQuestions?.filter((q: any) => q.is_answered).length || 0
      
      // Get stage completion status from setup_completion table (source of truth)
      const stage1Completed = setupStatus?.stage1_completed || false
      const stage2Completed = setupStatus?.stage2_completed || false  
      const stage3Completed = setupStatus?.stage3_completed || false

      // Current stage comes from setup_completion table
      const currentStage = setupStatus?.current_stage || 'stage_1'
      

      // Get pending questions
      const pendingQuestions = await this.getPendingQuestions(organizationId)

      return {
        totalQuestions,
        answeredQuestions,
        currentStage,
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
        isCompleted: false,
        pendingQuestions: [],
        stage1Completed: false,
        stage2Completed: false,
        stage3Completed: false
      }
    }
  }

  /**
   * Synchronize the dynamically calculated stage with setup_completion table
   * This ensures setup_completion.current_stage is always up-to-date for fast page refreshes
   */
  private async synchronizeStageWithSetupCompletion(organizationId: string, calculatedStage: string): Promise<void> {
    try {
      // Get current stage from setup_completion table
      const setupStatus = await this.setupCompletionService.getSetupStatus(organizationId)
      
      if (!setupStatus) {
        console.log('⚠️ No setup completion record found for organization:', organizationId)
        return
      }

      const storedStage = setupStatus.current_stage
      
      // Get current answered questions count from business_info_fields
      const { data: answeredFields, error: answeredError } = await this.supabaseClient
        .from('business_info_fields')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('is_answered', true)

      const currentAnsweredCount = answeredFields?.length || 0
      const storedAnsweredCount = setupStatus.answered_questions

      // Update if either stage or answered count changed
      const needsStageUpdate = storedStage !== calculatedStage
      const needsCountUpdate = storedAnsweredCount !== currentAnsweredCount

      if (needsStageUpdate || needsCountUpdate) {
        console.log(`🔄 STAGE SYNC: Updating setup_completion - Stage: "${storedStage}" → "${calculatedStage}", Answered: ${storedAnsweredCount} → ${currentAnsweredCount}`)
        
        await this.setupCompletionService.updateProgress(
          organizationId,
          currentAnsweredCount, // Update to current answered count
          calculatedStage, // Update to new calculated stage
          setupStatus.stage_progress || {} // Keep existing stage progress
        )
        
        console.log(`✅ STAGE SYNC: Successfully synchronized - Stage: "${calculatedStage}", Answered: ${currentAnsweredCount}`)
      } else {
        console.log(`💚 STAGE SYNC: Everything up-to-date - Stage: "${calculatedStage}", Answered: ${currentAnsweredCount}`)
      }
    } catch (error) {
      console.error('❌ Error synchronizing stage with setup_completion:', error)
      // Don't throw - this is a sync operation, not critical for main flow
    }
  }

  /**
   * Update onboarding progress based on AI completion signals
   * SINGLE RESPONSIBILITY: Only handle progress tracking, not question management
   */
  async updateOnboardingProgress(
    organizationId: string,
    params: { statusSignal?: string | null; aiMessage?: string }
  ): Promise<{
    isCompleted: boolean
    progress: OnboardingProgress
  }> {
    try {
      const normalized = this.normalizeStatusSignal(params.statusSignal)

      // Handle stage signals
      if (normalized === 'stage_1_complete') {
        await this.setupCompletionService.markStageAsCompleted(organizationId, 'stage_1')
      } else if (normalized === 'stage_2_complete') {
        await this.setupCompletionService.markStageAsCompleted(organizationId, 'stage_2')
      } else if (normalized === 'stage_3_complete') {
        await this.setupCompletionService.markStageAsCompleted(organizationId, 'stage_3')
      }

      // Handle full completion
      const isCompleted = normalized === 'setup_complete'
        ? await this.setupCompletionService.markAsCompleted(organizationId, { source: 'ai_signal' }).then(() => true)
        : false
      
      if (isCompleted) {
        const progress = await this.getOnboardingProgress(organizationId)
        return {
          isCompleted: true,
          progress
        }
      }

      // Return current progress
      const progress = await this.getOnboardingProgress(organizationId)
      return {
        isCompleted: false,
        progress
      }
    } catch (error) {
      console.error('Error updating onboarding progress:', error)
      const progress = await this.getOnboardingProgress(organizationId)
      return {
        isCompleted: false,
        progress
      }
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