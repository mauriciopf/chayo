import { supabase } from '@/lib/supabase/client'
import { generateSlugFromName } from '@/lib/utils/text'

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

export interface ExtractedInfo {
  field_name: string
  field_value: string
  confidence: number
  source: 'conversation' | 'document' | 'manual'
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
      // Get existing answered fields
      const { data: answeredFields } = await supabase
        .from('business_info_fields')
        .select('field_name')
        .eq('organization_id', organizationId)
        .eq('is_answered', true)

      const answeredFieldNames = answeredFields?.map(f => f.field_name) || []

      // Get existing unanswered questions
      const { data: existingQuestions } = await supabase
        .from('business_info_fields')
        .select('field_name, question_template, field_type, multiple_choices')
        .eq('organization_id', organizationId)
        .eq('is_answered', false)

      // If we have unanswered questions, return them
      if (existingQuestions && existingQuestions.length > 0) {
        return existingQuestions.map(q => ({
          question_template: q.question_template,
          field_name: q.field_name,
          field_type: q.field_type || 'text',
          multiple_choices: q.multiple_choices
        }))
      }

      // Use the EnhancedOrganizationSystemPromptService to generate questions
      const { EnhancedOrganizationSystemPromptService } = await import('./systemPrompt/EnhancedOrganizationSystemPromptService')
      const enhancedService = new EnhancedOrganizationSystemPromptService()
      
      const questions = await enhancedService.generateBusinessQuestions(
        organizationId,
        currentConversation,
        answeredFieldNames
      )

      // Store the generated questions
      if (questions && questions.length > 0) {
        await this.storeBusinessQuestions(organizationId, questions)
        console.log(`❓ Generated ${questions.length} new questions:`, questions.map((q: any) => q.field_name))
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
  private async storeBusinessQuestions(organizationId: string, questions: {question_template: string, field_name: string, field_type: string, multiple_choices?: string[], allow_multiple?: boolean, show_other?: boolean}[]): Promise<void> {
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
   * Extract business information from conversation
   */
  async extractBusinessInfo(organizationId: string, conversation: string): Promise<ExtractedInfo[]> {
    try {
      // Get ALL questions to match against (not just pending ones)
      // This allows us to extract answers even if questions were just created
      const { data: existingFields } = await this.supabaseClient
        .from('business_info_fields')
        .select('field_name, question_template, is_answered')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true })

      if (!existingFields || existingFields.length === 0) {
        return []
      }

      // Filter to only unanswered questions for the prompt context
      const unansweredFields = existingFields.filter((f: BusinessInfoField) => !f.is_answered)

      // Use the EnhancedOrganizationSystemPromptService to extract business info
      const { EnhancedOrganizationSystemPromptService } = await import('./systemPrompt/EnhancedOrganizationSystemPromptService')
      const enhancedService = new EnhancedOrganizationSystemPromptService()
      
      const extractedInfo = await enhancedService.extractBusinessInfo(
        organizationId,
        conversation,
        unansweredFields
      )

      return extractedInfo
    } catch (error) {
      console.error('Error extracting business info:', error)
      return []
    }
  }

  /**
   * Update business info fields with extracted information
   */
  async updateBusinessInfoFields(organizationId: string, extractedInfo: ExtractedInfo[]): Promise<void> {
    try {
      let businessNameUpdated = false
      let newBusinessName = ''

      for (const info of extractedInfo) {
        if (info.confidence > 0.3) { // Lowered from 0.7 to 0.3 for much better answer recognition
          // Update the field with the answer
          const { error: updateError } = await this.supabaseClient
            .from('business_info_fields')
            .update({
              field_value: info.field_value,
              is_answered: true,
              confidence: info.confidence,
              source: info.source,
              updated_at: new Date().toISOString()
            })
            .eq('organization_id', organizationId)
            .eq('field_name', info.field_name)
            .eq('is_answered', false)

          if (updateError) {
            console.error('Error updating business info field:', updateError)
          } else {
            console.log(`✅ Updated field ${info.field_name} for organization ${organizationId} with confidence ${info.confidence}`)
            
            // Track if business_name was updated
            if (info.field_name === 'business_name') {
              businessNameUpdated = true
              newBusinessName = info.field_value
            }
          }
        } else {
          console.log(`❌ Rejected field ${info.field_name} with confidence ${info.confidence} (below threshold 0.3)`)
        }
      }

      // If business_name was updated, also update the organization slug and name
      if (businessNameUpdated && newBusinessName) {
        try {
          const newSlug = generateSlugFromName(newBusinessName)
          const { error: orgUpdateError } = await this.supabaseClient
            .from('organizations')
            .update({ 
              name: newBusinessName,
              slug: newSlug 
            })
            .eq('id', organizationId)

          if (orgUpdateError) {
            console.error('Error updating organization name and slug:', orgUpdateError)
          } else {
            console.log(`✅ Updated organization name to "${newBusinessName}" and slug to "${newSlug}"`)
          }
        } catch (error) {
          console.error('Error updating organization name and slug:', error)
        }
      }

      // Business info count is now calculated dynamically from business_info_fields
      console.log(`Updated ${extractedInfo.length} business info fields for organization ${organizationId}`)
    } catch (error) {
      console.error('Error updating business info fields:', error)
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

      console.log(`📋 Found ${fields?.length || 0} pending questions for organization ${organizationId}:`, fields?.map((f: BusinessInfoField) => f.field_name))
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