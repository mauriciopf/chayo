import { OrganizationSystemPromptService } from './OrganizationSystemPromptService'
import { TrainingHintService, type TrainingHintContext } from '../trainingHintService'

export interface SystemPromptResult {
  finalPrompt: string
  metadata: {
    basePromptLength: number
    trainingHintContext: TrainingHintContext
    hasDocumentContext: boolean
    hasConversationContext: boolean
    usingRAG: boolean
    systemPromptLength: number
  }
}

/**
 * Enhanced system prompt service that combines base system prompts with training hints
 */
export class EnhancedOrganizationSystemPromptService {
  constructor() {}

  /**
   * Generate a complete system prompt with training hints and RAG context
   */
  async generateEnhancedPrompt(
    organizationId: string,
    messages: any[],
    userQuery: string,
    locale: string = 'en'
  ): Promise<SystemPromptResult> {
    try {
      // Step 1: Extract training hint context from messages
      const trainingHintContext = TrainingHintService.extractFromMessages(messages)

      // Step 2: Generate base system prompt using existing service
      const organizationSystemPromptService = new OrganizationSystemPromptService()
      const baseSystemPrompt = await organizationSystemPromptService.generateSystemPrompt(
        organizationId,
        organizationId, // Use organizationId as both agentId and organizationId
        locale
      )

      // Step 3: Combine base prompt with training hint additions
      const finalPrompt = this.combinePrompts(baseSystemPrompt, trainingHintContext)

      // Step 4: Analyze the final prompt for metadata
      const metadata = this.analyzePrompt(baseSystemPrompt, finalPrompt, trainingHintContext)

      // Step 5: Log for debugging
      this.logPromptGeneration(organizationId, userQuery, metadata)

      return {
        finalPrompt,
        metadata
      }
    } catch (error) {
      console.warn('Enhanced system prompt generation failed, using fallback:', error)
      
      // Fallback to basic prompt
      const fallbackPrompt = this.getFallbackPrompt()
      return {
        finalPrompt: fallbackPrompt,
        metadata: {
          basePromptLength: fallbackPrompt.length,
          trainingHintContext: TrainingHintService.extractFromMessages(messages),
          hasDocumentContext: false,
          hasConversationContext: false,
          usingRAG: false,
          systemPromptLength: fallbackPrompt.length
        }
      }
    }
  }

  /**
   * Combine base system prompt with training hint additions
   */
  private combinePrompts(basePrompt: string, trainingHintContext: TrainingHintContext): string {
    // Start with CRITICAL multiple choice instructions at the very beginning
    let finalPrompt = `CRITICAL INSTRUCTION - READ THIS FIRST:
You MUST use multiple choice format for ~90% of your questions. This is NOT optional.

WHEN ASKING QUESTIONS, you MUST use this exact format:
QUESTION: [Your question here]
OPTIONS: ["Option 1", "Option 2", "Option 3"]
MULTIPLE: [true/false]
OTHER: [true/false]

EXAMPLES:
QUESTION: How are you currently handling customer inquiries and complaints?
OPTIONS: ["Phone Support", "Email Support", "Live Chat", "Social Media"]
MULTIPLE: false
OTHER: true

QUESTION: Which services do you offer?
OPTIONS: ["Consultation", "Treatment", "Follow-up", "Emergency Care"]
MULTIPLE: true
OTHER: true

QUESTION: What are your operating hours?
OPTIONS: ["Morning only", "Afternoon only", "Full day", "Evening hours"]
MULTIPLE: false
OTHER: true

ONLY use open questions (without OPTIONS format) for:
- Business names (e.g., "What's your business name?")
- Specific addresses or locations
- Unique identifiers that cannot be standardized

EVERY OTHER QUESTION MUST USE THE MULTIPLE CHOICE FORMAT ABOVE.
This is a REQUIREMENT, not a suggestion.

Now, here is your base prompt:
`

    finalPrompt += basePrompt

    // Add training hint additions if available
    if (trainingHintContext.systemPromptAddition) {
      finalPrompt += '\n' + trainingHintContext.systemPromptAddition
    }

    // Add additional multiple choice instructions at the end as reinforcement
    finalPrompt += '\n\nREMINDER - MULTIPLE CHOICE REQUIREMENT:\n'
    finalPrompt += 'You MUST use the multiple choice format for most questions:\n'
    finalPrompt += 'QUESTION: [question]\n'
    finalPrompt += 'OPTIONS: ["option1", "option2", "option3"]\n'
    finalPrompt += 'MULTIPLE: [true/false]\n'
    finalPrompt += 'OTHER: [true/false]\n'
    finalPrompt += '\nThe system will automatically detect this format and display clickable options.\n'
    finalPrompt += 'If you do not use this format, users cannot select options and must type their answers.'

    return finalPrompt
  }

  /**
   * Analyze the generated prompt to extract metadata
   */
  private analyzePrompt(
    basePrompt: string, 
    finalPrompt: string, 
    trainingHintContext: TrainingHintContext
  ) {
    const hasDocumentContext = finalPrompt.includes('Relevant Document Information')
    const hasConversationContext = finalPrompt.includes('Relevant Previous Conversations')
    const usingRAG = hasDocumentContext || hasConversationContext

    return {
      basePromptLength: basePrompt.length,
      trainingHintContext,
      hasDocumentContext,
      hasConversationContext,
      usingRAG,
      systemPromptLength: finalPrompt.length
    }
  }

  /**
   * Log prompt generation details for debugging
   */
  private logPromptGeneration(agentId: string, userQuery: string, metadata: any) {
    console.log(`Enhanced System Prompt for agent ${agentId}:`, {
      userQuery: userQuery.substring(0, 100) + (userQuery.length > 100 ? '...' : ''),
      basePromptLength: metadata.basePromptLength,
      finalPromptLength: metadata.systemPromptLength,
      hasTrainingHint: metadata.trainingHintContext.hasActiveHint,
      trainingHintLabel: metadata.trainingHintContext.hint?.label || 'None',
      hasDocumentContext: metadata.hasDocumentContext,
      hasConversationContext: metadata.hasConversationContext,
      usingRAG: metadata.usingRAG
    })
  }

  /**
   * Generate business questions for information gathering
   */
  async generateBusinessQuestions(
    organizationId: string, 
    currentConversation: string, 
    answeredFieldNames: string[]
  ): Promise<{question_template: string, field_name: string, field_type: string, multiple_choices?: string[], allow_multiple?: boolean, show_other?: boolean}[]> {
    try {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        console.error('OpenAI API key not set, cannot generate business questions')
        return []
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

CRITICAL INSTRUCTION: ~90% of questions should be MULTIPLE CHOICE. Only use OPEN QUESTIONS for:
- Business names (e.g., "What's your business name?")
- Specific addresses or locations
- Unique identifiers that cannot be standardized
- Custom values that don't fit predefined categories

For multiple choice questions:
- Use allow_multiple: true for questions where users can select multiple options (e.g., "Which services do you offer?")
- Use show_other: true to include "Other (please specify)" option for flexibility
- Provide 2-4 relevant options that cover common scenarios
- Think creatively about how to structure choices to capture most common answers

Examples of good multiple choice questions:
- Business type: ["Dental Clinic", "Medical Practice", "Wellness Center", "Specialty Clinic"]
- Services: ["Consultation", "Treatment", "Follow-up", "Emergency Care"]
- Target market: ["Adults", "Children", "Seniors", "Families"]
- Operating hours: ["Morning only", "Afternoon only", "Full day", "Evening hours"]
- Payment methods: ["Cash only", "Insurance", "Credit cards", "Payment plans"]

Return only the questions as a JSON array of objects with this structure:
[
  {
    "question_template": "What is the name of your health business?",
    "field_name": "business_name",
    "field_type": "text"
  },
  {
    "question_template": "What type of health or wellness business do you run?",
    "field_name": "business_type",
    "field_type": "multiple_choice",
    "multiple_choices": ["Dental Clinic", "Medical Practice", "Wellness Center", "Specialty Clinic"],
    "allow_multiple": false,
    "show_other": true
  },
  {
    "question_template": "Which services do you offer?",
    "field_name": "services_offered",
    "field_type": "multiple_choice",
    "multiple_choices": ["Consultation", "Treatment", "Follow-up", "Emergency Care"],
    "allow_multiple": true,
    "show_other": true
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
              const validQuestions = questions.filter((q: any) => 
                q.question_template && q.field_name && q.field_type &&
                typeof q.question_template === 'string' && 
                typeof q.field_name === 'string' &&
                typeof q.field_type === 'string' &&
                (q.field_type === 'text' || q.field_type === 'multiple_choice') &&
                (q.field_type !== 'multiple_choice' || (
                  q.multiple_choices && 
                  Array.isArray(q.multiple_choices) && 
                  q.multiple_choices.length >= 2 && 
                  q.multiple_choices.length <= 4
                ))
              )
              
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
   * Extract business information from conversation
   */
  async extractBusinessInfo(
    organizationId: string, 
    conversation: string, 
    unansweredFields: any[]
  ): Promise<{field_name: string, field_value: string, confidence: number, source: 'conversation'}[]> {
    try {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        console.warn('OpenAI API key not set, skipping business info extraction')
        return []
      }

      const questionsContext = unansweredFields.map((f: any) => `${f.field_name}: ${f.question_template}`).join('\n')

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
- For multiple choice questions, extract the selected option(s) as the field_value
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
              return parsed.map(item => ({
                ...item,
                source: 'conversation' as const
              }))
            } else {
              console.warn('AI response is not an array:', parsed)
            }
          } catch (parseError) {
            // Fallback: If AI returned text saying "empty array", treat as empty
            if (content.toLowerCase().includes('empty array') || 
                content.toLowerCase().includes('no relevant information') ||
                content.toLowerCase().includes('return should be')) {
              return []
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

    return []
  }

  /**
   * Get a basic fallback prompt when generation fails
   */
  private getFallbackPrompt(): string {
    return `You are Chayo, an AI business assistant. Your role is to gather comprehensive information about the user's business through thoughtful questions. 

Key responsibilities:
- Ask relevant business-related questions
- Gather detailed information about operations, customers, and processes
- Maintain a professional and helpful tone
- Focus on understanding the business better

Always ask follow-up questions to gather more specific details about the business.`
  }
} 