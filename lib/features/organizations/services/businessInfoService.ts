import { supabase } from '@/lib/shared/supabase/client'
import { openAIService } from '@/lib/shared/services/OpenAIService'

export interface BusinessInfoField {
  id?: string
  organization_id: string
  field_name: string
  field_value?: string
  field_type: 'text' | 'array' | 'boolean' | 'number' | 'multiple_choice'
  is_answered: boolean
  question_template: string
  multiple_choices?: string[]
  allow_multiple?: boolean
  confidence?: number
  created_at?: string
  updated_at?: string
}

/**
 * Clean interface for business questions (structured objects only)
 * Used for storing questions without fragile regex parsing
 */
export interface BusinessQuestion {
  question_template: string
  field_name: string
  field_type: 'text' | 'multiple_choice' | 'boolean' | 'number'
  multiple_choices?: string[] | null
}

export class BusinessInfoService {
  private supabaseClient: any

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient || supabase
  }

  /**
   * Store a single business question from AI generation
   * Always uses structured objects - no regex parsing
   */
  public async storeBusinessQuestion(organizationId: string, question: BusinessQuestion): Promise<void> {
    try {
      // Check if this exact question already exists
      const { data: existingQuestion } = await supabase
        .from('business_info_fields')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('question_template', question.question_template)
        .eq('is_answered', false)
        .single()
      
      if (existingQuestion) {
        console.log('📝 [BUSINESS_INFO] Question already exists:', question.question_template.substring(0, 50) + '...')
        return
      }

      // Store the validated question
      await supabase
        .from('business_info_fields')
        .insert({
          organization_id: organizationId,
          field_name: question.field_name,
          field_type: question.field_type,
          is_answered: false,
          question_template: question.question_template,
          multiple_choices: question.multiple_choices || null
        })
      
      console.log('✅ [BUSINESS_INFO] Successfully stored business question:', question.field_name)
    } catch (error) {
      console.error('Error storing business question:', error)
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
      console.log('💾 [BUSINESS_INFO] Updating question as answered:', {
        organizationId,
        fieldName,
        answer,
        confidence
      })
      
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
        console.error('❌ [BUSINESS_INFO] Error updating question as answered:', error)
        throw error
      }

      console.log(`✅ [BUSINESS_INFO] Question marked as answered: ${fieldName} = "${answer}" (confidence: ${confidence})`)

      // Special handling: Update organization name when business_name is answered
      if (fieldName === 'business_name' && answer && answer.trim().length > 0) {
        console.log('📝 [BUSINESS_INFO] Updating organization name to:', answer.trim())
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
      console.log('📋 [BUSINESS_INFO] Getting pending questions for org:', organizationId)
      
      const { data: fields, error } = await this.supabaseClient
        .from('business_info_fields')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_answered', false)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ [BUSINESS_INFO] Error getting pending questions:', error)
        return []
      }

      console.log('📊 [BUSINESS_INFO] Raw pending questions from DB:', fields?.length || 0)
      if (fields && fields.length > 0) {
        console.log('📝 [BUSINESS_INFO] Sample pending question:', JSON.stringify(fields[0], null, 2))
      } else {
        console.log('✅ [BUSINESS_INFO] No pending questions found')
      }

      return fields || []
    } catch (error) {
      console.error('❌ [BUSINESS_INFO] Error in getPendingQuestions:', error)
      return []
    }
  }

  /**
   * Validate if content is relevant for business knowledge storage
   * @param userMessage - The user's message content (or single message for legacy usage)
   * @param aiMessage - The AI's response message content (optional for legacy usage)
   * @param context - Optional context about the conversation purpose
   * @returns Promise<boolean> - true if relevant, false if not
   */
  async isBusinessRelevantInformation(
    userMessage: string,
    aiMessage?: string,
    context?: 'embedding_storage' | 'question_generation' | 'general'
  ): Promise<boolean> {
    try {
      // Basic validation - need at least one message with content
      if (!userMessage || userMessage.trim().length === 0) {
        return false
      }

      // Handle both conversation exchange and single message scenarios
      let contentToAnalyze: string
      let analysisType: string
      
      if (aiMessage && aiMessage.trim().length > 0) {
        // Full conversation exchange - user + AI messages
        contentToAnalyze = `AI: ${aiMessage}\nUser: ${userMessage}`.trim()
        analysisType = 'conversation exchange'
      } else {
        // Single message (legacy usage for question generation)
        contentToAnalyze = userMessage.trim()
        analysisType = 'single message'
      }

      // Build the system prompt
      const basePrompt = `You are an AI business information relevance evaluator. Your role is to dynamically assess whether content contains valuable business information worth storing.

CRITICAL: Respond with ONLY "relevant" or "irrelevant" - no explanation, no other text.

Analyze this ${analysisType} and determine if it contains business value${analysisType === 'conversation exchange' ? '. Consider the FULL CONTEXT - a simple "yes" or "no" response becomes meaningful when combined with the AI\'s question' : ''}:

RELEVANT CONTENT (store this):
- Business operations, services, policies, procedures
- Company details: hours, location, contact info, pricing
- Product/service descriptions, features, benefits
- Customer service processes, workflows, standards
- Industry knowledge, expertise, best practices
- Specific business decisions, changes, updates
- Problem-solving approaches for business issues
- Client interaction patterns and preferences
- Business goals, strategies, competitive advantages
- Regulatory, legal, or compliance information
- Training materials or process documentation

IRRELEVANT CONTENT (do not store):
- Casual conversation with no business context
- Personal topics unrelated to business operations
- Technical errors, system failures, debugging info
- Generic pleasantries, greetings without substance
- Off-topic discussions (weather, sports, news)
- Incomplete thoughts or garbled text
- Test messages or random input
- Conversation management (scheduling, reminders)
- Meta-conversation about the AI system itself

Use your AI judgment to evaluate context and intent. Consider:
- Does this help understand the business better?
- Would this information be useful for future customer interactions?
- Does this reveal something specific about how this business operates?
- Could this information improve customer service or business decisions?`

      // Add context-specific guidance
      let systemPrompt = basePrompt
      if (context === 'embedding_storage') {
        systemPrompt += `

STORAGE CONTEXT: This will be embedded in vector database for semantic search and knowledge retrieval.
Priority: Information that enables better customer support and business understanding.
Focus: Actionable knowledge that can improve future AI responses about this business.`
      } else if (context === 'question_generation') {
        systemPrompt += `

QUESTION GENERATION CONTEXT: This will be analyzed to generate targeted business setup questions.
Priority: Information that reveals business areas needing more detail or clarification.
Focus: Content that suggests gaps in business profile or areas for improvement.`
      } else {
        systemPrompt += `

GENERAL EVALUATION: Standard business relevance assessment for data quality.
Priority: Maintain high-quality business knowledge base without clutter.`
      }

      // Use AI to evaluate relevance via centralized service
  
      
      const aiResponse = await openAIService.callChatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contentToAnalyze }
      ], {
        model: 'gpt-3.5-turbo', // Fast and reliable for this classification task
        maxTokens: 5, // Just need "relevant" or "irrelevant"
        temperature: 0, // Maximum consistency for binary classification
      })

      const result = aiResponse.toLowerCase().trim()
      
      // More robust parsing - check for relevant indicators
      const isRelevant = result ? result.includes('relevant') && !result.includes('irrelevant') : true
      
      console.log(`📊 Business relevance evaluation (${analysisType}): "${contentToAnalyze.substring(0, 100)}..." -> ${isRelevant ? 'RELEVANT' : 'IRRELEVANT'}`)
      
      return isRelevant
      
    } catch (error) {
      console.error('Error checking business relevance:', error)
      // Default to storing if evaluation fails to avoid data loss
      return true
    }
  }

  /**
   * Get answered questions for context in AI responses
   */
  async getAnsweredQuestions(organizationId: string): Promise<BusinessInfoField[]> {
    try {
      console.log('🔍 DEBUG: Getting answered questions for organization:', organizationId)
      
      const { data: answeredQuestions, error } = await this.supabaseClient
        .from('business_info_fields')
        .select('field_name, question_template, field_value, is_answered')
        .eq('organization_id', organizationId)
        .eq('is_answered', true)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ Error fetching answered questions:', error)
        throw error
      }

      console.log(`📋 DEBUG: Found ${answeredQuestions?.length || 0} answered questions:`)
      if (answeredQuestions && answeredQuestions.length > 0) {
        answeredQuestions.forEach((q: any, index: number) => {
          console.log(`  ${index + 1}. ${q.field_name}: "${q.question_template}" = "${q.field_value}"`)
        })
      } else {
        console.log('  No answered questions found')
      }

      return answeredQuestions || []
    } catch (error) {
      console.error('❌ Error in getAnsweredQuestions:', error)
      throw error
    }
  }
}

// Export singleton instance
export const businessInfoService = new BusinessInfoService() 