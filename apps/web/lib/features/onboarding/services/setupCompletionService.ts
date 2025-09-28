import { supabase } from '@/lib/shared/supabase/client'
import { YamlPromptLoader } from '../../chat/services/systemPrompt/YamlPromptLoader'
import { VibeCardService } from './vibeCardService'

export interface SetupCompletionStatus {
  id: string
  organization_id: string
  setup_status: 'in_progress' | 'completed' | 'abandoned'
  completed_at?: string
  completion_data: Record<string, any>
  created_at: string
  updated_at: string
}

export class SetupCompletionService {
  private supabaseClient: any
  private vibeCardService: VibeCardService

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient || supabase
    this.vibeCardService = new VibeCardService(supabaseClient)
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
   * Update setup completion progress (simplified - just marks as in progress)
   */
  async updateProgress(organizationId: string): Promise<void> {
    try {
      await this.supabaseClient
        .from('setup_completion')
        .update({
          setup_status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
    } catch (error) {
      console.error('Error updating setup progress:', error)
      throw error
    }
  }

  /**
   * Mark setup as completed with vibe card generation
   */
  async markAsCompleted(organizationId: string, completionData: Record<string, any>): Promise<void> {
    console.log('🎯 [SETUP-COMPLETION] markAsCompleted called for organization:', organizationId)
    console.log('🎯 [SETUP-COMPLETION] Completion data:', completionData)
    
    try {
      console.log('🎨 [SETUP-COMPLETION] Starting vibe card completion for organization:', organizationId)
      
      // Use vibe card service to complete onboarding with enhanced vibe data
      const success = await this.vibeCardService.completeOnboardingWithVibeCard(organizationId)
      
      if (!success) {
        // Fallback to basic completion if vibe card generation fails
        console.warn('⚠️ Vibe card generation failed, falling back to basic completion')
        await this.supabaseClient
          .from('setup_completion')
          .update({
            setup_status: 'completed',
            completed_at: new Date().toISOString(),
            completion_data: { ...completionData, vibe_card_generation_failed: true },
            updated_at: new Date().toISOString()
          })
          .eq('organization_id', organizationId)
      }
      
      console.log('✅ Setup completion finished for organization:', organizationId)
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