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
} 