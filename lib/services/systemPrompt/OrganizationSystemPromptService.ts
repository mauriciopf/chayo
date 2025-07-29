import type { BusinessConstraints } from './types'
import { getConversationKnowledge } from './ContextAssembler'
import { buildSystemPrompt, type SystemPromptResult } from './SystemPromptBuilder'

export class OrganizationSystemPromptService {
  async generateSystemPrompt(
    organizationId: string,
    locale: string = 'en'
  ): Promise<SystemPromptResult> {
    const conversationKnowledge = await getConversationKnowledge(organizationId, 6000)
    return buildSystemPrompt(conversationKnowledge, locale)
  }
}

export const organizationSystemPromptService = new OrganizationSystemPromptService() 