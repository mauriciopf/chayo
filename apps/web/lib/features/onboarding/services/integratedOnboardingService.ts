import { supabase } from '@/lib/shared/supabase/client'
import { SetupCompletionService } from './setupCompletionService'
import { BusinessInfoService } from '../../organizations/services/businessInfoService'

export interface OnboardingQuestion {
  field_name: string
  question_template: string
  field_type: 'text' | 'multiple_choice'
  multiple_choices?: string[]
  allow_multiple?: boolean
}

export interface OnboardingProgress {
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

  /** Normalize status signals coming from AI prompts */
  private normalizeStatusSignal(signal?: string | null): 'setup_complete' | null {
    if (!signal) return null
    const s = signal.toLowerCase().trim()
    if (['setup_complete', 'onboarding_complete', 'onboarding_completed', 'completed'].includes(s)) return 'setup_complete'
    return null
  }



  /**
   * Get pending questions for an organization
   */
  async getPendingQuestions(organizationId: string): Promise<OnboardingQuestion[]> {
    try {
      const { data: pendingQuestions, error } = await this.supabaseClient
        .from('business_info_fields')
        .select('field_name, question_template, field_type, multiple_choices, allow_multiple')
        .eq('organization_id', organizationId)
        .eq('is_answered', false)
        .order('created_at', { ascending: true })

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
        allow_multiple: q.allow_multiple
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

      // Get pending questions
      const pendingQuestions = await this.getPendingQuestions(organizationId)

      return {
        isCompleted,
        pendingQuestions
      }
    } catch (error) {
      console.error('Error getting onboarding progress:', error)
      return {
        isCompleted: false,
        pendingQuestions: []
      }
    }
  }



  /**
   * Update onboarding progress based on AI completion signals
   * Simplified: Only handle completion, no stages
   */
  async updateOnboardingProgress(
    organizationId: string,
    params: { statusSignal?: string | null; aiMessage?: string },
    progressEmitter?: (event: string, data?: any) => void
  ): Promise<{
    isCompleted: boolean
    progress: OnboardingProgress
  }> {
    try {
      const normalized = this.normalizeStatusSignal(params.statusSignal)

      // Handle full completion only
      const isCompleted = normalized === 'setup_complete'
        ? await this.setupCompletionService.markAsCompleted(organizationId, { source: 'ai_signal' }, progressEmitter).then(() => true)
        : false
      
      // Return current progress
      const progress = await this.getOnboardingProgress(organizationId)
      return {
        isCompleted,
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
          completion_data: {}
        })
        .eq('organization_id', organizationId)
    } catch (error) {
      console.error('Error resetting onboarding:', error)
      throw error
    }
  }
} 