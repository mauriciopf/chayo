import { supabase } from '@/lib/shared/supabase/client'
import { generateSlugFromName } from '@/lib/shared/utils/text'
import OpenAI from 'openai'

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

/**
 * Clean interface for business questions (structured objects only)
 * Used for storing questions without fragile regex parsing
 */
export interface BusinessQuestion {
  question_template: string
  field_name: string
  field_type: 'text' | 'multiple_choice'
  multiple_choices?: string[]
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
        const rawQuestion = questions[0] // Only take the first question
        const singleQuestion: BusinessQuestion = {
          question_template: rawQuestion.question_template,
          field_name: rawQuestion.field_name,
          field_type: rawQuestion.field_type as 'text' | 'multiple_choice',
          multiple_choices: rawQuestion.multiple_choices
        }
        await this.storeBusinessQuestion(organizationId, singleQuestion)
        return [singleQuestion] // Return as array for backward compatibility
      }

      return questions || []
    } catch (error) {
      console.error('Error generating business questions:', error)
      return []
    }
  }

  /**
   * Store a single business question with AI quality validation
   * Always uses structured objects - no regex parsing
   */
  public async storeBusinessQuestion(organizationId: string, question: BusinessQuestion): Promise<void> {
    try {
      // 🚀 AI-driven quality validation
      const isRelevant = await this.isBusinessRelevantInformation(
        `Question: "${question.question_template}" for field "${question.field_name}"`, 
        'ai', 
        'question_generation'
      )
      
      if (!isRelevant) {
        console.log('⚠️ Question failed quality validation:', question.question_template)
        return
      }

      // Check if this question already exists
      const { data: existingQuestion } = await supabase
        .from('business_info_fields')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('field_name', question.field_name)
        .eq('is_answered', false)
        .single()
      
      if (existingQuestion) {
        console.log('📝 Question already exists:', question.field_name)
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
      
      console.log('✅ Successfully stored business question:', question.field_name)
    } catch (error) {
      console.error('Error storing business question:', error)
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
   * Validate if information is relevant for business knowledge storage
   * @param message - The message content to evaluate
   * @param messageType - Whether it's from 'user' or 'ai'
   * @param context - Optional context about the conversation purpose
   * @returns Promise<boolean> - true if relevant, false if not
   */
  async isBusinessRelevantInformation(
    message: string,
    messageType: 'user' | 'ai',
    context?: 'embedding_storage' | 'question_generation' | 'general'
  ): Promise<boolean> {
    try {
      // Basic validation only
      if (!message || message.trim().length === 0) {
        return false
      }

      // Build the system prompt
      const basePrompt = `You are an AI business information relevance evaluator. Your role is to dynamically assess whether conversation content contains valuable business information worth storing.

CRITICAL: Respond with ONLY "relevant" or "irrelevant" - no explanation, no other text.

Analyze this ${messageType} message and determine if it contains business value:

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

      // Use AI to evaluate relevance  
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })

      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo', // Fast and reliable for this classification task
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 5, // Just need "relevant" or "irrelevant"
        temperature: 0, // Maximum consistency for binary classification
      })

      const result = response.choices[0]?.message?.content?.toLowerCase().trim()
      
      // More robust parsing - check for relevant indicators
      const isRelevant = result ? result.includes('relevant') && !result.includes('irrelevant') : true
      
      console.log(`📊 Business relevance evaluation: "${message.substring(0, 50)}..." -> ${isRelevant ? 'RELEVANT' : 'IRRELEVANT'}`)
      
      return isRelevant
      
    } catch (error) {
      console.error('Error checking business relevance:', error)
      // Default to storing if evaluation fails to avoid data loss
      return true
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