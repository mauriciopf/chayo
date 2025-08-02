import { OrganizationSystemPromptService } from './OrganizationSystemPromptService'
import { TrainingHintService, type TrainingHintContext } from '../trainingHintService'
import { YamlPromptLoader } from './YamlPromptLoader'

export interface SystemPromptResult {
  systemContent: string
  userContent: string
}

/**
 * Enhanced system prompt service that combines base system prompts with training hints
 */
export class EnhancedOrganizationSystemPromptService {
  
  constructor() {}

  async generateEnhancedPrompt(
    organizationId: string,
    messages: any[],
    userQuery: string,
    locale: string = 'en'
  ): Promise<{ systemContent: string }> {
    try {
      // Get training hints for enhanced context
      const trainingHintContext = TrainingHintService.extractFromMessages(messages)
      
      // Build the enhanced system prompt using YAML configuration
      const systemContent = await this.buildSystemPrompt(trainingHintContext, locale)
      
      return {
        systemContent
      }
    } catch (error) {
      console.error('Error generating enhanced prompt:', error)
      // Fallback to basic prompt
      return {
        systemContent: await YamlPromptLoader.getFallbackPrompt()
      }
    }
  }

  private async buildSystemPrompt(trainingHintContext: TrainingHintContext, locale: string): Promise<string> {
    // Build training context string
    let trainingContext = ''
    if (trainingHintContext.systemPromptAddition) {
      trainingContext += trainingHintContext.systemPromptAddition
    }
    if (trainingHintContext.hasActiveHint && trainingHintContext.hint) {
      trainingContext += `\nActive training focus: ${trainingHintContext.hint.label} - ${trainingHintContext.hint.description}`
    }
    
    // Use YAML loader to build the system prompt
    return await YamlPromptLoader.buildSystemPrompt(locale, trainingContext)
  }



  // Legacy methods for backward compatibility
  async generateBusinessQuestions(
    currentConversation: string, 
    answeredFieldNames: string[]
  ): Promise<{question_template: string, field_name: string, field_type: string, multiple_choices?: string[], allow_multiple?: boolean}[]> {
    // This method is now handled by the main system prompt
    return []
  }

  async validateAnswerWithAI(
    conversation: string, 
    question: string
  ): Promise<{answered: boolean, answer?: string, confidence?: number}> {
    try {
      const { default: OpenAI } = await import('openai')
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      const validationPrompt = `Analyze this conversation to determine if the user answered the question.

Question: "${question}"

Conversation: "${conversation}"

Respond with JSON only:
{
  "answered": true/false,
  "answer": "extracted answer if answered",
  "confidence": 0.0-1.0
}`

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: validationPrompt }],
        temperature: 0.1,
        max_tokens: 200
      })

      const content = response.choices[0].message.content?.trim()
      
      if (!content) {
        return { answered: false }
      }

      try {
        const result = JSON.parse(content)
        return {
          answered: result.answered || false,
          answer: result.answer,
          confidence: result.confidence || 0.5
        }
      } catch (parseError) {
        return { answered: false }
      }
    } catch (error) {
      return { answered: false }
    }
  }
} 