import { supabase } from '@/lib/supabase/client'

export async function getConversationKnowledge(agentId: string, maxLength: number = 4000): Promise<string | null> {
  const { data: conversations, error } = await supabase
    .from('conversation_embeddings')
    .select('conversation_segment, metadata')
    .eq('agent_id', agentId)
    .eq('segment_type', 'conversation')
    .order('created_at', { ascending: false })
    .limit(10)
  if (error || !conversations || conversations.length === 0) {
    return null
  }
  let knowledge = ''
  conversations.forEach((conv, index) => {
    const role = conv.metadata?.role || 'user'
    knowledge += `${index + 1}. ${role}: "${conv.conversation_segment}"
`
  })
  if (knowledge.length > maxLength) {
    knowledge = knowledge.substring(0, maxLength) + '...'
  }
  return knowledge
} 