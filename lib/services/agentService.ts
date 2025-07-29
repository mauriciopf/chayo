import { supabase } from '@/lib/supabase/client'
import { getFilledBusinessInfoFieldCount } from './businessInfoFieldService'

export class AgentService {
  private supabaseClient: any

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient || supabase
  }

  async getAgentChatLinkForOrganization(organizationId: string) {
    const { data, error } = await this.supabaseClient
      .from('agent_channels')
      .select('*, agent:agents(*)')
      .eq('organization_id', organizationId)
      .eq('channel', 'agent_chat_link')
      .maybeSingle()
    if (error) throw error
    return data
  }

  async createAgentAndChannelForOrganization(organizationId: string, name: string) {
    // Create agent
    const { data: agent, error: agentError } = await this.supabaseClient
      .from('agents')
      .insert([{ organization_id: organizationId, name }])
      .select('*')
      .single()
    if (agentError) throw agentError

    // Create agent_channel
    const { data: channel, error: channelError } = await this.supabaseClient
      .from('agent_channels')
      .insert([{ agent_id: agent.id, organization_id: organizationId, channel: 'agent_chat_link' }])
      .select('*')
      .single()
    if (channelError) throw channelError

    return { agent, channel }
  }

  getThreshold(): number {
    return 10 // This could be made configurable via environment variable or database
  }

  async maybeCreateAgentChatLinkIfThresholdMet(
    organization: { id: string, slug: string }
  ) {
    // Check if onboarding is completed
    const { IntegratedOnboardingService } = await import('./integratedOnboardingService')
    const onboardingService = new IntegratedOnboardingService()
    const progress = await onboardingService.getOnboardingProgress(organization.id)
    
    let agentChatLink = await this.getAgentChatLinkForOrganization(organization.id)
    
    // Only create agent chat link if onboarding is completed and no agent chat link exists
    if (progress.isCompleted && !agentChatLink) {
      agentChatLink = await this.createAgentAndChannelForOrganization(
        organization.id,
        organization.slug
      )
    }
    return agentChatLink
  }
}

// Export singleton instance for backward compatibility
export const agentService = new AgentService()

// Export individual functions for backward compatibility
export const getAgentChatLinkForOrganization = (organizationId: string) => agentService.getAgentChatLinkForOrganization(organizationId)
export const createAgentAndChannelForOrganization = (organizationId: string, name: string) => agentService.createAgentAndChannelForOrganization(organizationId, name)
export const maybeCreateAgentChatLinkIfThresholdMet = (organization: { id: string, slug: string }) => agentService.maybeCreateAgentChatLinkIfThresholdMet(organization) 