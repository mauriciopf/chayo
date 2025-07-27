import type { BusinessConstraints } from './types'
import { getConversationKnowledge } from './ContextAssembler'
import { buildSystemPrompt } from './SystemPromptBuilder'

export class OrganizationSystemPromptService {
  async generateSystemPrompt(
    organizationId: string,
    locale: string = 'en'
  ): Promise<string> {
    const conversationKnowledge = await getConversationKnowledge(organizationId, 4000)
    return buildSystemPrompt(conversationKnowledge, locale)
  }
}

export const organizationSystemPromptService = new OrganizationSystemPromptService() 