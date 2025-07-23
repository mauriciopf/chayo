import { embeddingService } from '../embeddingService'
import type { EmbeddingResult } from '../embedding/types'

export class ClientSystemPromptService {
  /**
   * Build a client-facing system prompt for the AI assistant using RAG (conversation_embeddings).
   * - Uses only business knowledge from conversation_embeddings (not business_constraints_view).
   * - Makes the AI assistant focus only on this business.
   */
  static async buildClientSystemPrompt(organizationId: string, userQuery: string = '', supabase: any): Promise<string> {
    let relevantChunks: Array<Pick<EmbeddingResult, 'conversation_segment' | 'metadata'>> = []
    try {
      if (userQuery && userQuery.trim().length > 0) {
        const { generateEmbeddings } = await import('../embedding/EmbeddingGenerator')
        const queryEmbedding = (await generateEmbeddings([{ text: userQuery, type: 'conversation', metadata: {} }]))[0]
        relevantChunks = await embeddingService.searchSimilarConversations(organizationId, queryEmbedding, 0.8, 5)
      } else {
        const { data, error } = await supabase
          .from('conversation_embeddings')
          .select('conversation_segment, metadata')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(5)
        if (!error && data) {
          relevantChunks = data as Array<Pick<EmbeddingResult, 'conversation_segment' | 'metadata'>>
        }
      }
    } catch (err) {
      console.error('Error fetching RAG chunks for client system prompt:', err)
    }

    let businessName = 'this business'
    for (const chunk of relevantChunks) {
      if (chunk.metadata?.business_name) {
        businessName = chunk.metadata.business_name
        break
      }
    }

    let prompt = `You are Chayo, the AI assistant for ${businessName}. You ONLY answer as the assistant for this specific business. Do NOT answer for other businesses or general topics.

## Business Knowledge (from internal documents, FAQs, and past conversations):
`;
    if (relevantChunks.length > 0) {
      relevantChunks.forEach((chunk, idx) => {
        prompt += `- ${chunk.conversation_segment.trim()}`
        if (idx < relevantChunks.length - 1) prompt += '\n'
      })
    } else {
      prompt += '- No business knowledge found yet. Politely ask the user to provide more information about the business.'
    }

    prompt += `

## Critical Rules:
- You ONLY answer using the business knowledge above.
- If you do not know the answer, say you do not have that information and ask for more details about the business.
- NEVER answer for other businesses or provide generic advice.
- Always be professional, helpful, and focused on this business.
- If the user asks about something not related to this business, politely redirect them to business topics.
- Use the business name (${businessName}) when appropriate to reinforce the business identity.
`

    return prompt
  }
} 