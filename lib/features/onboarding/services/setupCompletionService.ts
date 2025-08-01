import { supabase } from '@/lib/shared/supabase/client'
import { YamlPromptLoader } from '../../chat/services/systemPrompt/YamlPromptLoader'

export interface SetupCompletionStatus {
  id: string
  organization_id: string
  setup_status: 'in_progress' | 'completed' | 'abandoned'
  completed_at?: string
  total_questions: number
  answered_questions: number
  current_stage: string
  stage_progress: Record<string, any>
  completion_data: Record<string, any>
  stage1_completed?: boolean
  stage2_completed?: boolean
  stage3_completed?: boolean
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

      // Create new record
      const allQuestions = await YamlPromptLoader.getAllQuestions()
      const { data: newRecord, error: createError } = await this.supabaseClient
        .from('setup_completion')
        .insert({
          organization_id: organizationId,
          setup_status: 'in_progress',
          total_questions: allQuestions.length,
          answered_questions: 0,
          current_stage: 'stage_1',
          stage_progress: {},
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
    answeredQuestions: number, 
    currentStage: string,
    stageProgress: Record<string, any>
  ): Promise<void> {
    try {
      await this.supabaseClient
        .from('setup_completion')
        .update({
          answered_questions: answeredQuestions,
          current_stage: currentStage,
          stage_progress: stageProgress,
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

  /**
   * Process STATUS signals from AI response
   */
  async processCompletionSignal(organizationId: string, aiMessage: string): Promise<boolean> {
    try {
      // Check for stage-specific completion signals
      if (aiMessage.includes('STATUS: stage_1_complete')) {
        await this.markStageAsCompleted(organizationId, 'stage_1')
      }
      
      if (aiMessage.includes('STATUS: stage_2_complete')) {
        await this.markStageAsCompleted(organizationId, 'stage_2')
      }
      
      if (aiMessage.includes('STATUS: stage_3_complete')) {
        await this.markStageAsCompleted(organizationId, 'stage_3')
      }

      // Check if the message contains the final completion signal
      if (aiMessage.includes('STATUS: setup_complete')) {
        // Extract completion data from the message
        const completionData = this.extractCompletionData(aiMessage)
        
        // Mark setup as completed
        await this.markAsCompleted(organizationId, completionData)
        
        return true
      }

      return false
    } catch (error) {
      console.error('Error processing completion signal:', error)
      return false
    }
  }

  /**
   * Mark a specific stage as completed
   */
  async markStageAsCompleted(organizationId: string, stage: string): Promise<void> {
    try {
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
      }

      // Set the appropriate stage completion flag
      switch (stage) {
        case 'stage_1':
          updateData.stage1_completed = true
          break
        case 'stage_2':
          updateData.stage2_completed = true
          break
        case 'stage_3':
          updateData.stage3_completed = true
          break
      }

      await this.supabaseClient
        .from('setup_completion')
        .update(updateData)
        .eq('organization_id', organizationId)
    } catch (error) {
      console.error(`Error marking stage ${stage} as completed:`, error)
      throw error
    }
  }

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

  /**
   * Get setup progress percentage
   */
  async getProgressPercentage(organizationId: string): Promise<number> {
    try {
      const status = await this.getSetupStatus(organizationId)
      if (!status) {
        return 0
      }

      if (status.setup_status === 'completed') {
        return 100
      }

      const allQuestions = await YamlPromptLoader.getAllQuestions()
      const totalQuestions = allQuestions.length
      
      if (totalQuestions === 0) {
        return 0
      }

      return Math.round((status.answered_questions / totalQuestions) * 100)
    } catch (error) {
      console.error('Error calculating progress percentage:', error)
      return 0
    }
  }
} 