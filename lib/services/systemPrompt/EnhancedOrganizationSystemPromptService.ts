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
  // Centralized prompt configurations
  public static readonly PROMPT_CONFIG = {
    // Main system prompt instructions
    SYSTEM_INSTRUCTIONS: {
      MULTIPLE_CHOICE_PERCENTAGE: 99,
      MULTIPLE_CHOICE_FORMAT: `FOR MULTIPLE CHOICE QUESTIONS, use this exact format:
QUESTION: [Your question here]
OPTIONS: ["Option 1", "Option 2", "Option 3"]
MULTIPLE: [true/false]
OTHER: [true/false]

IMPORTANT: You MUST use this format for ~99% of your questions. Only use open questions for business names, addresses, or unique identifiers.`,
      OPEN_QUESTION_FORMAT: `FOR OPEN QUESTIONS (business names, addresses, unique identifiers), just ask the question directly without any formatting:
"What is your business name?"`,
      REQUIREMENT_NOTE: "This is a REQUIREMENT, not a suggestion.",
      CRITICAL_HEADER: `CRITICAL INSTRUCTION - READ THIS FIRST:
You MUST use multiple choice format for ~{PERCENTAGE}% of your questions and the rest for open questions. This is NOT optional.

{MULTIPLE_CHOICE_FORMAT}

{OPEN_QUESTION_FORMAT}

{REQUIREMENT_NOTE}

ENFORCEMENT: Every time you ask a question, you MUST follow this format. If you don't follow the format, the system will not work properly.

CRITICAL RULE: When asking questions, you MUST choose between:
1. MULTIPLE CHOICE format (99% of questions) - Use the exact format above
2. OPEN QUESTION format (only for business names, addresses, unique identifiers)

You CANNOT ask open-ended questions about business operations, policies, services, etc. - these MUST be multiple choice.

IMPORTANT: Your primary goal is to gather information that will help you communicate effectively with the business's clients. Focus on understanding:
- What clients typically ask about
- What information clients need to know
- How the business handles common client inquiries
- What policies and procedures clients should be aware of

Now, here is your base prompt:`,
      REMINDER_SECTION: `REMINDER - QUESTION FORMAT REQUIREMENT:
For MULTIPLE CHOICE questions ({PERCENTAGE}% of questions), use this format:
QUESTION: [question]
OPTIONS: ["option1", "option2", "option3"]
MULTIPLE: [true/false]
OTHER: [true/false]

For OPEN QUESTIONS (business names, addresses, unique identifiers), just ask directly:
"What is your business name?"

CRITICAL: You CANNOT ask open-ended questions about business operations, policies, services, etc. - these MUST be multiple choice.

The system will automatically detect the format and display appropriate options.`
    },

    // Business question generation prompt
    BUSINESS_QUESTIONS: {
      CONTEXT_LIMIT: 500,
      TEMPERATURE: 0.7, // Higher temperature for creative question generation
      MAX_TOKENS: 500,
      PROMPT_TEMPLATE: `Based on this conversation context, generate 1 specific question to gather missing business information that will help you communicate effectively with clients. 

Current conversation context: "{CONTEXT}"

Already answered fields: {ANSWERED_FIELDS}

Generate 1 question that:
1. Is specific to this business type and context
2. Hasn't been asked yet (check the "Already answered fields" list to avoid duplicates)
3. Will help you understand what clients need to know about this business
4. Is natural and conversational
5. Focuses on client-facing information: policies, procedures, services, pricing, hours, etc.
6. ONLY gathers information - do not provide advice or suggestions
7. MUST be different from any questions already asked

CRITICAL INSTRUCTION: ~{PERCENTAGE}% of questions should be MULTIPLE CHOICE. Only use OPEN QUESTIONS for:
- Business names (e.g., "What's your business name?")
- Specific addresses or locations
- Unique identifiers that cannot be standardized
- Custom values that don't fit predefined categories

CRITICAL RULE: You CANNOT ask open-ended questions about business operations, policies, services, etc. - these MUST be multiple choice.

For multiple choice questions:
- Use allow_multiple: true for questions where users can select multiple options (e.g., "Which services do you offer?")
- Use show_other: true to include "Other (please specify)" option for flexibility
- Provide 2-4 relevant options that cover common scenarios
- Think creatively about how to structure choices to capture most common answers

IMPORTANT: Focus on gathering information that clients will need to know. Think about what questions clients typically ask and what information they need.

CRITICAL: Do NOT generate questions that have already been asked. Check the "Already answered fields" list carefully and generate a completely different question.

Examples of good multiple choice questions for client communication:
- Common client inquiries: ["Pricing questions", "Appointment scheduling", "Service availability", "Policy questions"]
- Client communication preferences: ["Phone calls", "Text messages", "Email", "In-person visits"]
- Service delivery: ["In-office", "Home visits", "Virtual consultations", "Mobile services"]
- Payment options: ["Cash only", "Insurance accepted", "Credit cards", "Payment plans"]
- Operating hours: ["Morning only", "Afternoon only", "Full day", "Evening hours"]

Return only 1 question as a JSON array with this structure:
[
  {
    "question_template": "What type of health or wellness business do you run?",
    "field_name": "business_type",
    "field_type": "multiple_choice",
    "multiple_choices": ["Dental Clinic", "Medical Practice", "Wellness Center", "Specialty Clinic"],
    "allow_multiple": false,
    "show_other": true
  }
]`,
      EXAMPLES: {
        MULTIPLE_CHOICE: [
          {
            question_template: "What type of health or wellness business do you run?",
            field_name: "business_type",
            field_type: "multiple_choice",
            multiple_choices: ["Dental Clinic", "Medical Practice", "Wellness Center", "Specialty Clinic"],
            allow_multiple: false,
            show_other: true
          }
        ],
        OPEN_QUESTION: [
          {
            question_template: "What is your business name?",
            field_name: "business_name",
            field_type: "text"
          }
        ]
      }
    },

    // Answer validation prompt
    ANSWER_VALIDATION: {
      TEMPERATURE: 0.1, // Low temperature for precise validation
      MAX_TOKENS: 200,
      PROMPT_TEMPLATE: `Check if the user's response answers this specific question.

QUESTION: "{QUESTION}"

USER'S RESPONSE: "{RESPONSE}"

TASK: Determine if the user answered the question and extract their answer.

RULES:
- Accept partial answers that clearly relate to the question
- For yes/no questions: accept "yes", "no", "yeah", "nope", etc.
- For training questions: accept "trained", "training", "yes they are", etc.
- For service questions: accept any mention of the service
- Be lenient with short, direct answers
- Only reject if completely unrelated or unclear

Return JSON:
{"answered": true, "answer": "user's answer", "confidence": 0.9}

Confidence scores:
- 0.9-1.0: Direct, clear answer
- 0.7-0.8: Clear but indirect answer  
- 0.5-0.6: Partial but relevant answer
- Below 0.5: Reject

If not answered, return: {"answered": false}

RESPOND WITH ONLY JSON - NO OTHER TEXT.`
    },

    // Memory update extraction prompt
    MEMORY_EXTRACTION: {
      TEMPERATURE: 0.1, // Low temperature for precise extraction
      MAX_TOKENS: 300,
      PROMPT_TEMPLATE: `Analyze this conversation and determine if it contains any business information updates that should be stored in the AI's memory.

CONVERSATION: "{CONVERSATION}"

Consider the following types of business updates:
- Business hours, operating schedule, or availability changes
- Location, address, or service area updates
- Contact information (phone, email, website) changes
- Pricing, rates, or cost updates
- New or modified services offered
- Policy changes (returns, refunds, appointments, etc.)
- Business name or branding updates
- Staff or team changes
- Equipment or technology updates
- Any other business-relevant information that customers should know

IMPORTANT: Only extract information that is:
1. Clearly stated as a change or update
2. Specific and actionable
3. Relevant to customers or business operations
4. Not just general conversation or questions

If you find a clear business update, respond with ONLY valid JSON (no markdown formatting, no backticks):
{
  "text": "the specific updated information in a clear, concise format",
  "type": "knowledge",
  "reason": "brief description of what was updated",
  "confidence": 0.0-1.0 (how confident you are this is an actual update)
}

If no clear business update is found, respond with: null

Examples of what to extract:
- "We now offer 24/7 customer support" → extract
- "Our new address is 123 Main St" → extract  
- "What are your hours?" → do NOT extract (just a question)
- "I'm thinking of changing our hours" → do NOT extract (not confirmed)`
    },

    // Base system prompt configuration
    BASE_SYSTEM_PROMPT: {
      IDENTITY: "You are Chayo, the AI assistant for the business. Your role is to act as a messenger between the business and their clients, helping clients get the information they need.",
      BUSINESS_KNOWLEDGE_SECTION: "## Business Conversation Knowledge:\n{CONVERSATION_KNOWLEDGE}",
      LANGUAGE_SECTION: "## Response only in the language of the business: \n{LOCALE}",
      GUIDELINES_SECTION: `## Response Guidelines:
- Your primary purpose is to gather information that will help you communicate effectively with clients.
- Focus on understanding what clients need to know about the business.
- Ask questions about client-facing information: policies, procedures, services, pricing, hours, etc.
- Gather information about common client inquiries and how the business handles them.
- Maintain a professional tone.
- NEVER provide information, advice, or responses about other topics.
- Ask ONE specific question at a time.
- Always end with a relevant question.
- Do not give advice, suggestions, or information - only gather information.
- CRITICAL: Use multiple choice format for ~99% of questions (see format instructions above).
- For open questions (business names, addresses), ask directly without formatting.
- EVERY question you ask must follow the exact format specified in the instructions above.
- NEVER ask open-ended questions about business operations, policies, services, etc. - these MUST be multiple choice.`,
      PROMPT_TEMPLATE: `{IDENTITY}

{BUSINESS_KNOWLEDGE_SECTION}

{LANGUAGE_SECTION}

{GUIDELINES_SECTION}`
    }
  }

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
    const config = EnhancedOrganizationSystemPromptService.PROMPT_CONFIG.SYSTEM_INSTRUCTIONS
    
    // Generate the critical header using the template
    let criticalHeader = config.CRITICAL_HEADER
      .replace('{PERCENTAGE}', config.MULTIPLE_CHOICE_PERCENTAGE.toString())
      .replace('{MULTIPLE_CHOICE_FORMAT}', config.MULTIPLE_CHOICE_FORMAT)
      .replace('{OPEN_QUESTION_FORMAT}', config.OPEN_QUESTION_FORMAT)
      .replace('{REQUIREMENT_NOTE}', config.REQUIREMENT_NOTE)
    
    // Start with the base prompt (business identity, knowledge, guidelines)
    let finalPrompt = basePrompt

    // Add critical multiple choice instructions after the base prompt
    finalPrompt += '\n\n' + criticalHeader

    // Add training hint additions if available
    if (trainingHintContext.systemPromptAddition) {
      finalPrompt += '\n' + trainingHintContext.systemPromptAddition
    }

    // Add additional multiple choice instructions at the end as reinforcement
    let reminderSection = config.REMINDER_SECTION
      .replace('{PERCENTAGE}', config.MULTIPLE_CHOICE_PERCENTAGE.toString())
    
    finalPrompt += '\n\n' + reminderSection

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
   * Generate the prompt for answer validation
   */
  private generateAnswerValidationPrompt(question: string, conversation: string): string {
    const config = EnhancedOrganizationSystemPromptService.PROMPT_CONFIG.ANSWER_VALIDATION
    
    return config.PROMPT_TEMPLATE
      .replace('{QUESTION}', question)
      .replace('{RESPONSE}', conversation)
  }

  /**
   * Generate the prompt for business questions
   */
  private generateBusinessQuestionsPrompt(
    currentConversation: string, 
    answeredFieldNames: string[]
  ): string {
    const config = EnhancedOrganizationSystemPromptService.PROMPT_CONFIG.BUSINESS_QUESTIONS
    const systemConfig = EnhancedOrganizationSystemPromptService.PROMPT_CONFIG.SYSTEM_INSTRUCTIONS
    
    return config.PROMPT_TEMPLATE
      .replace('{CONTEXT}', currentConversation.substring(0, config.CONTEXT_LIMIT))
      .replace('{ANSWERED_FIELDS}', answeredFieldNames.join(', ') || 'None')
      .replace('{PERCENTAGE}', systemConfig.MULTIPLE_CHOICE_PERCENTAGE.toString())
  }

  /**
   * Generate business questions for information gathering
   */
  async generateBusinessQuestions(
    currentConversation: string, 
    answeredFieldNames: string[]
  ): Promise<{question_template: string, field_name: string, field_type: string, multiple_choices?: string[], allow_multiple?: boolean, show_other?: boolean}[]> {
    try {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        console.error('OpenAI API key not set, cannot generate business questions')
        return []
      }

      const config = EnhancedOrganizationSystemPromptService.PROMPT_CONFIG.BUSINESS_QUESTIONS
      const prompt = this.generateBusinessQuestionsPrompt(currentConversation, answeredFieldNames)

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: config.TEMPERATURE,
          max_tokens: config.MAX_TOKENS
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
   * Check if a single question was answered in the conversation
   */
  async validateAnswerWithAI(
    conversation: string, 
    question: string
  ): Promise<{answered: boolean, answer?: string, confidence?: number}> {
    try {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        console.warn('OpenAI API key not set, skipping answer validation')
        return { answered: false }
      }

      const config = EnhancedOrganizationSystemPromptService.PROMPT_CONFIG.ANSWER_VALIDATION
      const prompt = this.generateAnswerValidationPrompt(question, conversation)

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: config.TEMPERATURE,
          max_tokens: config.MAX_TOKENS
        })
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content
        
        if (content) {
          try {
            const parsed = JSON.parse(content)
            
            if (parsed.answered === true) {
              return {
                answered: true,
                answer: parsed.answer,
                confidence: parsed.confidence
              }
            } else {
              return { answered: false }
            }
          } catch (parseError) {
            console.error('Failed to parse JSON response:', parseError)
            return { answered: false }
          }
        }
      } else {
        console.error('OpenAI API error:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error validating answer with AI:', error)
    }

    return { answered: false }
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