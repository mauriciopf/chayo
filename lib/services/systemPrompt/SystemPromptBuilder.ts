import type { BusinessConstraints } from './types'
import { EnhancedOrganizationSystemPromptService } from './EnhancedOrganizationSystemPromptService'

export function buildSystemPrompt(conversationKnowledge: string | null, locale: string = 'en'): string {
  const config = EnhancedOrganizationSystemPromptService.PROMPT_CONFIG.BASE_SYSTEM_PROMPT
  
  // Build the prompt using the centralized template
  let prompt = config.PROMPT_TEMPLATE
    .replace('{IDENTITY}', config.IDENTITY)
    .replace('{LANGUAGE_SECTION}', config.LANGUAGE_SECTION.replace('{LOCALE}', locale))
    .replace('{GUIDELINES_SECTION}', config.GUIDELINES_SECTION)
  
  // Add business knowledge section if available
  if (conversationKnowledge) {
    prompt = prompt.replace('{BUSINESS_KNOWLEDGE_SECTION}', config.BUSINESS_KNOWLEDGE_SECTION.replace('{CONVERSATION_KNOWLEDGE}', conversationKnowledge))
  } else {
    prompt = prompt.replace('{BUSINESS_KNOWLEDGE_SECTION}', '')
  }
  
  return prompt
} 