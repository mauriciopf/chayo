import type { BusinessConstraints } from './types'
import { EnhancedOrganizationSystemPromptService } from './EnhancedOrganizationSystemPromptService'
import { YamlPromptLoader } from './YamlPromptLoader'

export interface SystemPromptResult {
  systemContent: string
  userContent: string
}

export async function buildSystemPrompt(conversationKnowledge: string | null, locale: string = 'en'): Promise<SystemPromptResult> {
  // Build the system prompt using the YAML configuration
  let systemPrompt = await YamlPromptLoader.buildSystemPrompt(locale)
  
  // Add business knowledge section if available
  if (conversationKnowledge) {
    systemPrompt += `\n\n## 📚 BUSINESS KNOWLEDGE\n${conversationKnowledge}`
  }
  
  return {
    systemContent: systemPrompt,
    userContent: '' // Empty user content as this is system-level prompt
  }
} 