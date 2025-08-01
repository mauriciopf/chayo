import { supabase } from '@/lib/shared/supabase/client'
import { generateSlugFromName } from '@/lib/shared/utils/text'

export interface BusinessInfoField {
  id?: string
  organization_id: string
  field_name: string
  field_value?: string
  field_type: 'text' | 'array' | 'boolean' | 'number' | 'multiple_choice'
  is_answered: boolean
  question_template: string
  multiple_choices?: string[]
  confidence?: number
  source?: 'conversation' | 'document' | 'manual'
  created_at?: string
  updated_at?: string
}

export class BusinessInfoService {
  private supabaseClient: any

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient || supabase
  }

    /**
   * Generate dynamic questions for business information gathering
   */
  async generateBusinessQuestions(organizationId: string, currentConversation: string): Promise<{question_template: string, field_name: string, field_type: string, multiple_choices?: string[]}[]> {
    try {
      // Get existing unanswered questions
      const { data: unAnsweredQuestions } = await supabase
        .from('business_info_fields')
        .select('field_name, question_template, field_type, multiple_choices')
        .eq('organization_id', organizationId)
        .eq('is_answered', false)

      // If we have unanswered questions, return them
      if (unAnsweredQuestions && unAnsweredQuestions.length > 0) {
        return unAnsweredQuestions.map(q => ({
          question_template: q.question_template,
          field_name: q.field_name,
          field_type: q.field_type || 'text',
          multiple_choices: q.multiple_choices
        }))
      }

      // Use the EnhancedOrganizationSystemPromptService to generate questions
      const { EnhancedOrganizationSystemPromptService } = await import('../../chat/services/systemPrompt/EnhancedOrganizationSystemPromptService')
      const enhancedService = new EnhancedOrganizationSystemPromptService()
      // Get all existing fields (both answered and unanswered) to prevent duplicates
      const { data: allFields } = await supabase
        .from('business_info_fields')
        .select('field_name')
        .eq('organization_id', organizationId)

      const answeredFieldNames = allFields?.map(f => f.field_name) || []

      // Only generate one question at a time
      const questions = await enhancedService.generateBusinessQuestions(
        currentConversation,
        answeredFieldNames
      )

      // Store only the first question if any were generated
      if (questions && questions.length > 0) {
        const singleQuestion = [questions[0]] // Only take the first question
        await this.storeBusinessQuestions(organizationId, singleQuestion)
        return singleQuestion
      }

      return questions || []
    } catch (error) {
      console.error('Error generating business questions:', error)
      return []
    }
  }

  /**
   * Store generated questions in the database
   */
  public async storeBusinessQuestions(organizationId: string, questions: {question_template: string, field_name: string, field_type: string, multiple_choices?: string[], allow_multiple?: boolean, show_other?: boolean}[]): Promise<void> {
    try {
      const questionFields = questions.map(question => ({
        organization_id: organizationId,
        field_name: question.field_name,
        field_type: question.field_type,
        is_answered: false,
        question_template: question.question_template,
        multiple_choices: question.multiple_choices || null
      }))

      await supabase
        .from('business_info_fields')
        .insert(questionFields)
    } catch (error) {
      console.error('Error storing business questions:', error)
    }
  }





  /**
   * Check if a specific question was answered in the conversation
   */
  async validateAnswerWithAI(conversation: string, question: string): Promise<{answered: boolean, answer?: string, confidence?: number}> {
    try {
      if (!conversation || conversation.length === 0) {
        return { answered: false }
      }

      // Simple validation - if there's a conversation, consider it answered
      // Extract the last user message as the answer
      const lines = conversation.split('\n')
      const userMessages = lines.filter(line => line.trim().length > 0 && !line.startsWith('AI:') && !line.startsWith('Assistant:'))
      
      if (userMessages.length > 0) {
        const lastUserMessage = userMessages[userMessages.length - 1].trim()
        return { 
          answered: true, 
          answer: lastUserMessage,
          confidence: 0.8
        }
      }

      return { answered: false }
    } catch (error) {
      console.error('Error validating answer with AI:', error)
      return { answered: false }
    }
  }

  /**
   * Update a question as answered in the database
   */
  async updateQuestionAsAnswered(
    organizationId: string,
    fieldName: string,
    answer: string,
    confidence: number
  ): Promise<void> {
    try {
      const { error } = await this.supabaseClient
        .from('business_info_fields')
        .update({
          field_value: answer,
          confidence: confidence,
          is_answered: true,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('field_name', fieldName)

      if (error) {
        console.error('Error updating question as answered:', error)
        throw error
      }

      // Special handling: Update organization name when business_name is answered
      if (fieldName === 'business_name' && answer && answer.trim().length > 0) {
        console.log('📝 Updating organization name to:', answer.trim())
        await this.updateOrganizationName(organizationId, answer.trim())
      }
    } catch (error) {
      console.error('Error updating question as answered:', error)
      throw error
    }
  }

  /**
   * Update organization name when business name is provided
   */
  private async updateOrganizationName(organizationId: string, businessName: string): Promise<void> {
    try {
      const { error } = await this.supabaseClient
        .from('organizations')
        .update({
          name: businessName,
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId)

      if (error) {
        console.error('Error updating organization name:', error)
        throw error
      }

      console.log('✅ Successfully updated organization name to:', businessName)
    } catch (error) {
      console.error('Error updating organization name:', error)
      // Don't throw error here - organization name update shouldn't fail the entire onboarding
    }
  }



  /**
   * Get all business information for an organization
   */
  async getBusinessInfo(organizationId: string): Promise<BusinessInfoField[]> {
    try {
      const { data: fields, error } = await this.supabaseClient
        .from('business_info_fields')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_answered', true)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error getting business info:', error)
        return []
      }

      return fields || []
    } catch (error) {
      console.error('Error getting business info:', error)
      return []
    }
  }

  /**
   * Get pending questions for an organization
   */
  async getPendingQuestions(organizationId: string): Promise<BusinessInfoField[]> {
    try {
      const { data: fields, error } = await this.supabaseClient
        .from('business_info_fields')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_answered', false)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error getting pending questions:', error)
        return []
      }

      return fields || []
    } catch (error) {
      console.error('Error getting pending questions:', error)
      return []
    }
  }

  /**
   * Get business information summary for system prompt
   */
  async getBusinessInfoSummary(organizationId: string): Promise<any> {
    try {
      const answeredFields = await this.getBusinessInfo(organizationId)
      
      // Convert to a summary object
      const summary: any = {}
      for (const field of answeredFields) {
        summary[field.field_name] = field.field_value
      }

      return summary
    } catch (error) {
      console.error('Error getting business info summary:', error)
      return {}
    }
  }
}

// Export singleton instance
export const businessInfoService = new BusinessInfoService() 