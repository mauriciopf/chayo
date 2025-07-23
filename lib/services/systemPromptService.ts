import type { BusinessConstraints } from './systemPrompt/types'
import { fetchBusinessConstraints } from './systemPrompt/BusinessConstraintsFetcher'
import { getConversationKnowledge } from './systemPrompt/ContextAssembler'
import { buildSystemPrompt } from './systemPrompt/SystemPromptBuilder'

export class SystemPromptService {
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

export const systemPromptService = new SystemPromptService() 