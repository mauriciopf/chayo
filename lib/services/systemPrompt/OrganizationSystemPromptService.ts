import type { BusinessConstraints } from './types'
import { fetchBusinessConstraints } from './BusinessConstraintsFetcher'
import { getConversationKnowledge } from './ContextAssembler'
import { buildSystemPrompt } from './SystemPromptBuilder'

export class OrganizationSystemPromptService {
  async generateSystemPrompt(
    agentId: string,
    organizationId: string,
    locale: string = 'en'
  ): Promise<string> {
    const constraints = await fetchBusinessConstraints(organizationId)
    const conversationKnowledge = await getConversationKnowledge(agentId, 4000)
    return buildSystemPrompt(agentId, constraints, conversationKnowledge, locale)
  }
}

export const organizationSystemPromptService = new OrganizationSystemPromptService() 