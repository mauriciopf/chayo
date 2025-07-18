import { createClient } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'

export interface BusinessInfoField {
  id?: string
  organization_id: string
  field_name: string
  field_value?: string
  field_type: 'text' | 'array' | 'boolean' | 'number'
  is_answered: boolean
  question_template: string
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
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  /**
   * Generate dynamic questions for business information gathering
   */
  async generateBusinessQuestions(organizationId: string, currentConversation: string): Promise<{question_template: string, field_name: string}[]> {
    let answeredFieldNames: string[] = []
    
    try {
      // Get existing answered fields
      const { data: answeredFields } = await this.supabase
        .from('business_info_fields')
        .select('field_name')
        .eq('organization_id', organizationId)
        .eq('is_answered', true)

      answeredFieldNames = answeredFields?.map(f => f.field_name) || []

      // Get existing unanswered questions
      const { data: existingQuestions } = await this.supabase
        .from('business_info_fields')
        .select('field_name, question_template')
        .eq('organization_id', organizationId)
        .eq('is_answered', false)

      // If we have unanswered questions, return them
      if (existingQuestions && existingQuestions.length > 0) {
        return existingQuestions.map(q => ({
          question_template: q.question_template,
          field_name: q.field_name
        }))
      }

      // Generate new questions dynamically using OpenAI
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        console.warn('OpenAI API key not set, cannot generate business questions')
        return []
      }

      const prompt = `Based on this conversation context, generate 3-5 specific questions to gather missing health and wellness business information. 

Current conversation context: "${currentConversation.substring(0, 500)}"

Already answered fields: ${answeredFieldNames.join(', ') || 'None'}

Generate questions that:
1. Are specific to this health and wellness business type and context
2. Haven't been answered yet
3. Will help understand their health and wellness business better
4. Are natural and conversational
5. Focus on health, wellness, medical, or therapeutic aspects

Return only the questions as a JSON array of objects with this structure:
[
  {
    "question_template": "What is the name of your health business?",
    "field_name": "business_name"
  },
  {
    "question_template": "What type of health or wellness business do you run?",
    "field_name": "business_type"
  }
]`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 500
        })
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content
        
        if (content) {
          try {
            const questions = JSON.parse(content)
            if (Array.isArray(questions)) {
              // Validate the structure
              const validQuestions = questions.filter(q => 
                q.question_template && q.field_name && 
                typeof q.question_template === 'string' && 
                typeof q.field_name === 'string'
              )
              
              // Store these questions in the database
              await this.storeBusinessQuestions(organizationId, validQuestions)
              console.log(`❓ Generated ${validQuestions.length} new questions:`, validQuestions.map(q => q.field_name))
              return validQuestions
            }
          } catch (parseError) {
            console.warn('Failed to parse generated questions:', parseError)
          }
        }
      }
    } catch (error) {
      console.error('Error generating business questions:', error)
    }

    return []
  }

  /**
   * Store generated questions in the database
   */
  private async storeBusinessQuestions(organizationId: string, questions: {question_template: string, field_name: string}[]): Promise<void> {
    try {
      const questionFields = questions.map(question => ({
        organization_id: organizationId,
        field_name: question.field_name,
        field_type: 'text',
        is_answered: false,
        question_template: question.question_template
      }))

      await this.supabase
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
    const extractedInfo: ExtractedInfo[] = []
    
    try {
      // Get ALL questions to match against (not just pending ones)
      // This allows us to extract answers even if questions were just created
      const { data: existingFields } = await this.supabase
        .from('business_info_fields')
        .select('field_name, question_template, is_answered')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true })

      console.log(`🔍 Looking for pending questions for organization ${organizationId}`)
      console.log(`📊 Found ${existingFields?.length || 0} pending questions`)

      if (!existingFields || existingFields.length === 0) {
        console.log(`⚠️ No questions found for organization ${organizationId}. This means no questions have been generated yet.`)
        return extractedInfo
      }

      // Filter to only unanswered questions for the prompt context
      const unansweredFields = existingFields.filter(f => !f.is_answered)
      console.log(`📊 Found ${existingFields.length} total questions, ${unansweredFields.length} unanswered`)

      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        console.warn('OpenAI API key not set, skipping business info extraction')
        return extractedInfo
      }

      const questionsContext = unansweredFields.map(f => `${f.field_name}: ${f.question_template}`).join('\n')

      console.log(`📝 Questions context for extraction:`, questionsContext)

      console.log(`💬 Analyzing conversation: "${conversation}"`)

      const prompt = `Analyze this conversation and extract health and wellness business information that answers the pending questions.

Pending questions:
${questionsContext}

Conversation: "${conversation}"

Return a JSON array of objects with:
- field_name: the field name that was answered
- field_value: the extracted answer
- confidence: confidence score 0-1

Guidelines:
- Be generous in recognizing answers - if the user provides any relevant information, extract it
- Even partial answers should be extracted with appropriate confidence scores
- If the user mentions something related to a question, consider it answered
- The conversation may be in Spanish - translate and interpret Spanish terms appropriately
- Confidence scores: 0.9-1.0 for direct answers, 0.7-0.8 for clear but indirect answers, 0.5-0.6 for partial answers, 0.3-0.4 for implied or related answers
- Only return empty array if absolutely no relevant information is found
- Examples of Spanish terms that might answer questions:
  * "braces" → unique_approaches (orthodontic techniques)
  * "limpieza dental" → unique_approaches (dental cleaning services)
  * "secretaria de salud" → partnerships (government health partnerships)
  * "vecinos de la colonia" → target_market (local community residents)
  * "certificaciones" → business_qualifications
  * "medidas de seguridad" → safety_measures

Only extract information that answers one of the pending questions. If no relevant information is found, return an empty array.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 500
        })
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content
        
        if (content) {
          console.log(`🤖 AI Response: ${content}`)
          try {
            const parsed = JSON.parse(content)
            if (Array.isArray(parsed)) {
              extractedInfo.push(...parsed.map(item => ({
                ...item,
                source: 'conversation' as const
              })))
              console.log(`🔍 Extracted ${parsed.length} potential answers:`, parsed.map(p => `${p.field_name}: ${p.field_value} (confidence: ${p.confidence})`))
            } else {
              console.warn('AI response is not an array:', parsed)
            }
          } catch (parseError) {
            console.warn('Failed to parse business info extraction:', parseError)
            console.warn('Raw AI response:', content)
          }
        } else {
          console.warn('No content in AI response')
        }
      }
    } catch (error) {
      console.error('Error extracting business info:', error)
    }

    return extractedInfo
  }

  /**
   * Update business info fields with extracted information
   */
  async updateBusinessInfoFields(organizationId: string, extractedInfo: ExtractedInfo[]): Promise<void> {
    try {
      for (const info of extractedInfo) {
        if (info.confidence > 0.3) { // Lowered from 0.7 to 0.3 for much better answer recognition
          // Update the field with the answer
          const { error: updateError } = await this.supabase
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
          }
        } else {
          console.log(`❌ Rejected field ${info.field_name} with confidence ${info.confidence} (below threshold 0.3)`)
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
      const { data: fields, error } = await this.supabase
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
      const { data: fields, error } = await this.supabase
        .from('business_info_fields')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_answered', false)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error getting pending questions:', error)
        return []
      }

      console.log(`📋 Found ${fields?.length || 0} pending questions for organization ${organizationId}:`, fields?.map(f => f.field_name))
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