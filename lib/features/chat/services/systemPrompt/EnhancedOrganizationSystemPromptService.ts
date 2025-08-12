import { ToolIntentService } from '@/lib/features/tools/shared/services'
import { YamlPromptLoader } from './YamlPromptLoader'

export interface SystemPromptResult {
  systemContent: string
  userContent: string
}

/**
 * Enhanced system prompt service for base system prompts
 */
export class EnhancedOrganizationSystemPromptService {
  
  constructor() {}

  async generateEnhancedPrompt(
    locale: string = 'en'
  ): Promise<{ systemContent: string }> {
    try {
      // Build the enhanced system prompt using YAML configuration
      const systemContent = await this.buildSystemPrompt(locale)
      
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

  private async buildSystemPrompt(locale: string): Promise<string> {
    // Use YAML loader to build the system prompt
    return await YamlPromptLoader.buildSystemPrompt(locale)
  }
} 