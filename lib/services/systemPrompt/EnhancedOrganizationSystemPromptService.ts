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
  constructor(private supabaseClient: any) {}

  /**
   * Generate a complete system prompt with training hints and RAG context
   */
  async generateEnhancedPrompt(
    agentId: string,
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
        agentId,
        userQuery,
        locale
      )

      // Step 3: Combine base prompt with training hint additions
      const finalPrompt = this.combinePrompts(baseSystemPrompt, trainingHintContext)

      // Step 4: Analyze the final prompt for metadata
      const metadata = this.analyzePrompt(baseSystemPrompt, finalPrompt, trainingHintContext)

      // Step 5: Log for debugging
      this.logPromptGeneration(agentId, userQuery, metadata)

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
    if (!trainingHintContext.systemPromptAddition) {
      return basePrompt
    }

    return basePrompt + '\n' + trainingHintContext.systemPromptAddition
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