import { supabase } from '@/lib/shared/supabase/client'

export async function getConversationKnowledge(organizationId: string, maxLength: number = 4000): Promise<string | null> {
  const { data: conversations, error } = await supabase
    .from('conversation_embeddings')
    .select('conversation_segment, metadata')
    .eq('organization_id', organizationId)
    .eq('segment_type', 'conversation')
    .order('created_at', { ascending: false })
    .limit(5) // Reduced from 10 to 5 to avoid duplicates
  if (error || !conversations || conversations.length === 0) {
    return null
  }
  
  const uniqueConversations = new Set<string>()
  let knowledge = ''
  let conversationIndex = 1
  
  conversations.forEach((conv) => {
    try {
      // Parse the JSON conversation segment
      const conversationData = JSON.parse(conv.conversation_segment)
      const messages = conversationData.messages || []
      
      // Extract just the conversation content and deduplicate
      messages.forEach((msg: any) => {
        const role = msg.role || 'user'
        const content = msg.content || ''
        if (content.trim()) {
          const conversationKey = `${role}: "${content}"`
          if (!uniqueConversations.has(conversationKey)) {
            uniqueConversations.add(conversationKey)
            knowledge += `${conversationIndex}. ${conversationKey}\n`
            conversationIndex++
          }
        }
      })
    } catch (parseError) {
      // Fallback to using the raw segment if JSON parsing fails
      const role = conv.metadata?.role || 'user'
      const conversationKey = `${role}: "${conv.conversation_segment}"`
      if (!uniqueConversations.has(conversationKey)) {
        uniqueConversations.add(conversationKey)
        knowledge += `${conversationIndex}. ${conversationKey}\n`
        conversationIndex++
      }
    }
  })
  
  if (knowledge.length > maxLength) {
    knowledge = knowledge.substring(0, maxLength) + '...'
  }
  return knowledge
} 