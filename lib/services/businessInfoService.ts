import { supabase } from '@/lib/supabase/client'

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
  /**
   * Generate dynamic questions for business information gathering
   */
  async generateBusinessQuestions(organizationId: string, currentConversation: string): Promise<{question_template: string, field_name: string}[]> {
    let answeredFieldNames: string[] = []
    
    try {
      // Get existing answered fields
      const { data: answeredFields } = await supabase
        .from('business_info_fields')
        .select('field_name')
        .eq('organization_id', organizationId)
        .eq('is_answered', true)

      answeredFieldNames = answeredFields?.map(f => f.field_name) || []

      // Get existing unanswered questions
      const { data: existingQuestions } = await supabase
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
        console.error('OpenAI API key not set, cannot generate business questions')
        throw new Error('OpenAI API key is required for dynamic question generation')
      }

      const prompt = `Based on this conversation context, generate 3-5 specific questions to gather missing business information. 

Current conversation context: "${currentConversation.substring(0, 500)}"

Already answered fields: ${answeredFieldNames.join(', ') || 'None'}

Generate questions that:
1. Are specific to this business type and context
2. Haven't been answered yet
3. Will help understand their business better
4. Are natural and conversational
5. Focus on business operations and customer needs

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
    const extractedInfo: ExtractedInfo[] = []
    
    try {
      // Get ALL questions to match against (not just pending ones)
      // This allows us to extract answers even if questions were just created
      const { data: existingFields } = await supabase
        .from('business_info_fields')
        .select('field_name, question_template, is_answered')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true })

      if (!existingFields || existingFields.length === 0) {
        return extractedInfo
      }

      // Filter to only unanswered questions for the prompt context
      const unansweredFields = existingFields.filter(f => !f.is_answered)

      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        console.warn('OpenAI API key not set, skipping business info extraction')
        return extractedInfo
      }

      const questionsContext = unansweredFields.map(f => `${f.field_name}: ${f.question_template}`).join('\n')

      const prompt = `Analyze this conversation and extract business information that answers the pending questions.

Pending questions:
${questionsContext}

Conversation: "${conversation}"

IMPORTANT: You MUST respond with ONLY valid JSON. No explanations, no text, ONLY JSON.

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
- Examples of Spanish terms that might answer questions:
  * "braces" → unique_approaches (orthodontic techniques)
  * "limpieza dental" → unique_approaches (dental cleaning services)
  * "secretaria de salud" → partnerships (government health partnerships)
  * "vecinos de la colonia" → target_market (local community residents)
  * "certificaciones" → business_qualifications
  * "medidas de seguridad" → safety_measures

Response format:
- If information found: [{"field_name": "example", "field_value": "value", "confidence": 0.8}]
- If no information found: []

RESPOND WITH ONLY JSON - NO OTHER TEXT.`

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
          try {
            // Try to parse as JSON
            const parsed = JSON.parse(content)
            if (Array.isArray(parsed)) {
              extractedInfo.push(...parsed.map(item => ({
                ...item,
                source: 'conversation' as const
              })))
            } else {
              console.warn('AI response is not an array:', parsed)
            }
          } catch (parseError) {
            // Fallback: If AI returned text saying "empty array", treat as empty
            if (content.toLowerCase().includes('empty array') || 
                content.toLowerCase().includes('no relevant information') ||
                content.toLowerCase().includes('return should be')) {
              // Don't add anything to extractedInfo (empty result)
            } else {
              console.error('Unexpected AI response format - not JSON and not empty explanation')
              console.error('Raw AI response:', content)
            }
          }
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
          const { error: updateError } = await supabase
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
      const { data: fields, error } = await supabase
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
      const { data: fields, error } = await supabase
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