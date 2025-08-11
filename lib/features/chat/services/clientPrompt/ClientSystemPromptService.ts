import { embeddingService } from '@/lib/shared/services/embeddingService'
import type { EmbeddingResult } from '@/lib/shared/services/embedding/types'
import { getLocaleInstructions } from '@/lib/features/chat/services/systemPrompt/i18nPromptUtils'
import { ToolIntentService } from '@/lib/features/tools/shared/services/toolIntentService'
import { generateEmbeddings } from '@/lib/shared/services/embedding/EmbeddingGenerator'

export class ClientSystemPromptService {
  /**
   * Build a client-facing system prompt for the AI assistant using RAG (conversation_embeddings).
   * - Uses only business knowledge from conversation_embeddings (not business_constraints_view).
   * - Makes the AI assistant focus only on this business.
   */
  static async buildClientSystemPrompt(organizationId: string, userQuery: string = '', locale: string = 'en', supabase: any): Promise<string> {
    let relevantChunks: Array<Pick<EmbeddingResult, 'conversation_segment' | 'metadata'>> = []
    try {
      if (userQuery && userQuery.trim().length > 0) {
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
    let organizationSlug = ''
    
    // Get organization details for FAQ link
    try {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('name, slug')
        .eq('id', organizationId)
        .single()
      
      if (!orgError && orgData) {
        businessName = orgData.name || businessName
        organizationSlug = orgData.slug || ''
      }
    } catch (err) {
      console.error('Error fetching organization details:', err)
    }

    // Fallback: Extract business name from embeddings if not found in organization
    if (businessName === 'this business') {
      for (const chunk of relevantChunks) {
        if (chunk.metadata?.business_name) {
          businessName = chunk.metadata.business_name
          break
        }
      }
    }

    // Get all enabled agent tools for this organization
    let enabledTools: string[] = []
    let faqsEnabled = false
    try {
      const { data: toolsData, error: toolsError } = await supabase
        .from('agent_tools')
        .select('tool_type, enabled')
        .eq('organization_id', organizationId)
        .eq('enabled', true)
      
      if (!toolsError && toolsData) {
        enabledTools = toolsData.map((tool: any) => tool.tool_type)
        faqsEnabled = enabledTools.includes('faqs')
      }
    } catch (err) {
      console.error('Error fetching enabled agent tools:', err)
    }

    // Get language-specific instructions
    const languageInstructions = getLocaleInstructions(locale)
    
    let prompt = `You are Chayo, the AI assistant for ${businessName}. You ONLY answer as the assistant for this specific business. Do NOT answer for other businesses or general topics.

${languageInstructions.responseLanguage}

## Business Knowledge (from internal documents, FAQs, and past conversations):
`;
    if (relevantChunks.length > 0) {
      relevantChunks.forEach((chunk, idx) => {
        prompt += `- ${chunk.conversation_segment.trim()}`
        if (idx < relevantChunks.length - 1) prompt += '\n'
      })
    } else {
      prompt += `- No business knowledge found yet. Please provide more information about the business.`
    }

    // Add intent detection instructions for enabled tools
    if (enabledTools.length > 0) {
      const intentInstructions = ToolIntentService.buildIntentInstructions(enabledTools)
      prompt += `

${intentInstructions}
`
    }

    // Add FAQ information only if tool is enabled (backward compatibility)
    if (faqsEnabled && organizationSlug) {
      const faqLanguage = locale === 'es' ? 'es' : 'en'
      prompt += `

## 📋 FAQ Tool Available:
- If customers specifically ask about FAQs, frequently asked questions, or say they want to see common questions, you can direct them to: /${faqLanguage}/faqs/${organizationSlug}
- ONLY suggest the FAQ page when customers explicitly ask for FAQs or common questions.
- Do NOT automatically suggest FAQs for every question - only when specifically requested.
`
    }

    prompt += `

## Critical Rules:
- You ONLY answer using the business knowledge above.
- Focus on helping customers with questions about this business.${faqsEnabled && organizationSlug ? `
- ONLY direct customers to FAQs when they specifically ask about FAQs or common questions: /${locale === 'es' ? 'es' : 'en'}/faqs/${organizationSlug}` : ''}
- If you do not know the answer, say you do not have that information and ask for more details.
- NEVER answer for other businesses or provide generic advice.
- Always be professional, helpful, and focused on this business.
- If the user asks about something not related to this business, politely redirect them to business topics.
- Use the business name (${businessName}) when appropriate to reinforce the business identity.
- When tools are available, use the JSON response format with proper intent detection as instructed above.
`

    return prompt
  }
} 