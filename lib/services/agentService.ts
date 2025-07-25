import { SupabaseClient } from '@supabase/supabase-js'
import { getFilledBusinessInfoFieldCount } from './businessInfoFieldService'

export async function getAgentChatLinkForOrganization(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from('agent_channels')
    .select('*, agent:agents(*)')
    .eq('organization_id', organizationId)
    .eq('channel', 'agent_chat_link')
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createAgentAndChannelForOrganization(supabase: SupabaseClient, organizationId: string, name: string) {
  // Create agent
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .insert([{ organization_id: organizationId, name }])
    .select('*')
    .single()
  if (agentError) throw agentError

  // Create agent_channel
  const { data: channel, error: channelError } = await supabase
    .from('agent_channels')
    .insert([{ agent_id: agent.id, organization_id: organizationId, channel: 'agent_chat_link' }])
    .select('*')
    .single()
  if (channelError) throw channelError

  return { agent, channel }
}

export async function maybeCreateAgentChatLinkIfThresholdMet(
  supabase: SupabaseClient,
  organization: { id: string, slug: string },
  threshold = 10
) {
  const filledFields = await getFilledBusinessInfoFieldCount(supabase, organization.id)
  let agentChatLink = await getAgentChatLinkForOrganization(supabase, organization.id)
  if (filledFields > threshold && !agentChatLink) {
    agentChatLink = await createAgentAndChannelForOrganization(
      supabase,
      organization.id,
      organization.slug
    )
  }
  return agentChatLink
} 