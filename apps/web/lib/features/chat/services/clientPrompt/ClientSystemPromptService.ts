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
  static async buildClientSystemPrompt(organizationId: string, userQuery: string = '', locale: string = 'es', supabase: any): Promise<string> {
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
    
    let prompt = `Eres Chayo, la asistente de IA de ${businessName}. SOLO respondes como la asistente de este negocio en específico. NO respondas por otros negocios ni sobre temas generales.

${languageInstructions.responseLanguage}

## Conocimiento del negocio (documentos internos, FAQs y conversaciones previas):
`;
    if (relevantChunks.length > 0) {
      relevantChunks.forEach((chunk, idx) => {
        prompt += `- ${chunk.conversation_segment.trim()}`
        if (idx < relevantChunks.length - 1) prompt += '\n'
      })
    } else {
      prompt += `- Aún no se encontró conocimiento del negocio. Por favor proporciona más información del negocio.`
    }

    // Add function calling instructions for enabled tools
    if (enabledTools.length > 0) {
      prompt += `

## Herramientas disponibles:
Tienes acceso a las siguientes herramientas para ayudar a los clientes:

${enabledTools.map(tool => {
        switch (tool) {
          case 'products':
            return '- **Productos y Servicios**: Puedes buscar y mostrar información sobre productos, servicios, precios y ofertas disponibles.'
          case 'appointments':
            return '- **Citas y Reservas**: Puedes consultar disponibilidad, horarios y ayudar con el agendamiento de citas.'
          case 'faqs':
            return '- **Preguntas Frecuentes**: Puedes responder preguntas comunes usando la base de conocimiento de FAQs.'
          default:
            return `- **${tool}**: Herramienta disponible para asistencia.`
        }
      }).join('\n')}

Usa estas herramientas automáticamente cuando los clientes pregunten sobre estos temas. No necesitas pedir permiso - simplemente usa la función apropiada para obtener la información más actualizada.
`
    }

    // Add FAQ information only if tool is enabled (backward compatibility)
    if (faqsEnabled && organizationSlug) {
      const faqLanguage = 'es'
      prompt += `

## 📋 Herramienta de Preguntas Frecuentes Disponible:
- Si las personas preguntan específicamente por FAQs, preguntas frecuentes o quieren ver dudas comunes, puedes dirigirlas a: /${faqLanguage}/faqs/${organizationSlug}
- SOLO sugiere la página de FAQs cuando lo pidan explícitamente.
- No sugieras las FAQs automáticamente en cada conversación: hazlo solo cuando sea necesario.
`
    }

    prompt += `

## Reglas críticas:
- Responde SOLO usando el conocimiento del negocio descrito arriba.
- Enfócate en ayudar a los clientes con preguntas sobre este negocio.${faqsEnabled && organizationSlug ? `
- Dirige a las personas a las FAQs únicamente cuando las pidan: /es/faqs/${organizationSlug}` : ''}
- Si no sabes la respuesta, indica que no tienes esa información y solicita más detalles.
- NUNCA respondas por otros negocios ni des consejos genéricos.
- Mantén siempre un tono profesional, útil y enfocado en este negocio.
- Si el usuario pregunta sobre algo que no está relacionado con este negocio, redirígelo de forma amable al tema del negocio.
- Usa el nombre del negocio (${businessName}) cuando corresponda para reforzar la identidad del negocio.
- Cuando existan herramientas disponibles, utiliza la detección de intenciones indicada arriba.
`

    return prompt
  }
} 
