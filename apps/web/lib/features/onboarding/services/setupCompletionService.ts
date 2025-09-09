import { supabase } from '@/lib/shared/supabase/client'
import { YamlPromptLoader } from '../../chat/services/systemPrompt/YamlPromptLoader'

export interface SetupCompletionStatus {
  id: string
  organization_id: string
  setup_status: 'in_progress' | 'completed' | 'abandoned'
  completed_at?: string
  total_questions: number
  answered_questions: number
  completion_data: Record<string, any>
  created_at: string
  updated_at: string
}

export class SetupCompletionService {
  private supabaseClient: any

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient || supabase
  }

  /**
   * Get or create setup completion record for an organization
   */
  async getOrCreateSetupCompletion(organizationId: string): Promise<SetupCompletionStatus> {
    try {
      // Try to get existing record
      const { data: existing, error } = await this.supabaseClient
        .from('setup_completion')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

      if (existing && !error) {
        return existing
      }

      // Create new record for dynamic onboarding
      const { data: newRecord, error: createError } = await this.supabaseClient
        .from('setup_completion')
        .insert({
          organization_id: organizationId,
          setup_status: 'in_progress',
          total_questions: 0, // Dynamic onboarding - no fixed question count
          answered_questions: 0,
          completion_data: {}
        })
        .select()
        .single()

      if (createError || !newRecord) {
        throw new Error(`Failed to create setup completion record: ${createError?.message}`)
      }

      return newRecord
    } catch (error) {
      console.error('Error in getOrCreateSetupCompletion:', error)
      throw error
    }
  }

  /**
   * Update setup completion progress
   */
  async updateProgress(
    organizationId: string, 
    answeredQuestions: number
  ): Promise<void> {
    try {
      await this.supabaseClient
        .from('setup_completion')
        .update({
          answered_questions: answeredQuestions,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
    } catch (error) {
      console.error('Error updating setup progress:', error)
      throw error
    }
  }

  /**
   * Mark setup as completed
   */
  async markAsCompleted(organizationId: string, completionData: Record<string, any>): Promise<void> {
    try {
      await this.supabaseClient
        .from('setup_completion')
        .update({
          setup_status: 'completed',
          completed_at: new Date().toISOString(),
          completion_data: completionData,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
    } catch (error) {
      console.error('Error marking setup as completed:', error)
      throw error
    }
  }

  /**
   * Check if setup is completed
   */
  async isSetupCompleted(organizationId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseClient
        .from('setup_completion')
        .select('setup_status')
        .eq('organization_id', organizationId)
        .single()

      if (error || !data) {
        return false
      }

      return data.setup_status === 'completed'
    } catch (error) {
      console.error('Error checking setup completion:', error)
      return false
    }
  }

  /**
   * Get setup completion status
   */
  async getSetupStatus(organizationId: string): Promise<SetupCompletionStatus | null> {
    try {
      const { data, error } = await this.supabaseClient
        .from('setup_completion')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

      if (error || !data) {
        return null
      }

      return data
    } catch (error) {
      console.error('Error getting setup status:', error)
      return null
    }
  }

  // Legacy processor removed. Use explicit statusSignal handling upstream.



  /**
   * Extract completion data from AI message
   */
  private extractCompletionData(aiMessage: string): Record<string, any> {
    const data: Record<string, any> = {
      completed_at: new Date().toISOString(),
      message: aiMessage
    }

    // Extract any structured data from the message
    const summaryMatch = aiMessage.match(/## Summary[\s\S]*?(?=##|$)/i)
    if (summaryMatch) {
      data.summary = summaryMatch[0].trim()
    }

    return data
  }

} 