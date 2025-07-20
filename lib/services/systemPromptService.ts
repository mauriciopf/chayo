import { createClient } from '@/lib/supabase/client'
import { embeddingService } from './embeddingService'
import { SupabaseClient } from '@supabase/supabase-js'

export interface BusinessConstraints {
  name: string
  tone: string
  industry?: string
  business_type?: string
  business_name?: string
  products_services?: string[]
  target_customers?: string
  business_processes?: string[]
  challenges?: string[]
  business_goals?: string[]
  customer_service?: string
  pricing_strategies?: string
  marketing_methods?: string[]
  competitors?: string[]
  technology_tools?: string[]
  values?: string[]
  policies?: string[]
  contact_info?: string
  custom_rules?: string[]
  whatsapp_trial_mentioned?: boolean
  business_info_gathered?: number
}



export class SystemPromptService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  /**
   * Generate a comprehensive system prompt for an agent
   */
  async generateSystemPrompt(
    agentId: string,
    locale: string = 'en'
  ): Promise<string> {
    try {
      // Get agent information
      const { data: agent, error: agentError } = await this.supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single()

      if (agentError || !agent) {
        throw new Error('Agent not found')
      }

      // Get business constraints from view
      const constraints = await this.getBusinessConstraints(agent.organization_id)

      // Build the system prompt with language context
      let systemPrompt = await this.buildBasePromptDynamic(agentId, constraints, locale)

      // Add conversation knowledge from previous sessions
      const conversationKnowledge = await this.getConversationKnowledge(agentId, 4000)
      if (conversationKnowledge) {
        systemPrompt += `\n\n## Business Conversation Knowledge:\n${conversationKnowledge}`
      }

      // Add response guidelines
      systemPrompt += this.buildResponseGuidelines(constraints)

      return systemPrompt
    } catch (error) {
      console.error('Error generating system prompt:', error)
      throw new Error('Failed to generate system prompt')
    }
  }

  /**
   * Get business constraints from business_constraints_view
   */
  private async getBusinessConstraints(organizationId: string): Promise<BusinessConstraints> {
    try {
      // Get business constraints directly from the view
      const { data: viewData, error } = await this.supabase
        .from('business_constraints_view').select('business_constraints').eq('organization_id', organizationId).single()

      if (error || !viewData?.business_constraints) {
        console.warn('Failed to get business constraints from view, using fallback:', error)
        // Fallback to basic constraints
        return {
          name: 'Business AI Assistant',
          tone: 'professional',
          whatsapp_trial_mentioned: false,
          business_info_gathered: 0
        }
      }

      const constraints: BusinessConstraints = {
        name: viewData.business_constraints.name || 'Business AI Assistant',
        tone: viewData.business_constraints.tone || 'professional',
        whatsapp_trial_mentioned: viewData.business_constraints.whatsapp_trial_mentioned || false,
        business_info_gathered: viewData.business_constraints.business_info_gathered || 0,
        // Add all other fields from the constraints
        ...viewData.business_constraints
      }

      console.log('Retrieved business constraints from view:', constraints)
      return constraints
    } catch (error) {
      console.error('Error parsing business constraints:', error)
      // Fallback to basic constraints
      return {
        name: 'Business AI Assistant',
        tone: 'professional',
        whatsapp_trial_mentioned: false,
        business_info_gathered: 0
      }
    }
  }



  /**
   * Build the base system prompt with business constraints
   */
  private async buildBasePromptDynamic(agentId: string, constraints: BusinessConstraints, locale: string = 'en'): Promise<string> {
    // Get the organization_id from the agent
    const { data: agent, error: agentError } = await this.supabase
      .from('agents')
      .select('organization_id')
      .eq('id', agentId)
      .single()
    
    if (agentError || !agent) {
      throw new Error('Agent not found')
    }
    
    // Get pending questions from BusinessInfoService
    const businessInfoService = new (await import('./businessInfoService')).BusinessInfoService(this.supabase)
    const pendingQuestions = await businessInfoService.getPendingQuestions(agent.organization_id)
    
    // Get questions for missing information
    const questions = pendingQuestions.map(q => q.question_template)
    
    // If no pending questions, generate new ones
    if (questions.length === 0) {
      const userMessages = "Initial conversation" // This will be replaced with actual context
      const newQuestionObjects = await businessInfoService.generateBusinessQuestions(agent.organization_id, userMessages)
      const newQuestions = newQuestionObjects.map(q => q.question_template)
      questions.push(...newQuestions)
    }
    
    // Check if OpenAI is available (if no questions could be generated)
    const openaiAvailable = process.env.OPENAI_API_KEY && questions.length > 0
    
    // Add language instructions based on locale
    const languageInstructions = locale === 'es' 
      ? 'ALWAYS respond in Spanish (Español). Ask all questions in Spanish and maintain conversation in Spanish throughout. NEVER mix Spanish and English in the same response.'
      : 'ALWAYS respond in English. Ask all questions in English and maintain conversation in English throughout. NEVER mix Spanish and English in the same response.'

    let prompt = `You are Chayo, an AI business assistant. Your ONLY purpose is to gather information about this specific business.

## LANGUAGE REQUIREMENT:
${languageInstructions}

## CRITICAL RULES:\n- You ONLY ask questions about THEIR BUSINESS\n- You NEVER provide information about other topics\n- You NEVER give generic advice or responses\n- You ONLY focus on understanding their business operations\n- If they ask about anything not related to their business, redirect them back to business topics\n- If you don't know their business name or details, ALWAYS start by asking about their business\n\n## Your Role:\n- You are a business information gatherer\n- You ask specific questions about their business to understand it better\n- You help them document their business processes and information\n- You speak in a ${constraints.tone} tone\n\n## Health Business Context:\n- Business Name: ${(constraints as any).business_name || constraints.name || 'Unknown - need to gather this information'}\n- Business Type: ${(constraints as any).business_type || 'Unknown - need to gather this information'}\n- Industry: ${(constraints as any).industry || (constraints as any).business_type || 'Unknown - need to gather this information'}\n${(constraints as any).products_services ? `- Products/Services: ${Array.isArray((constraints as any).products_services) ? (constraints as any).products_services.join(', ') : (constraints as any).products_services}` : ''}\n${(constraints as any).target_customers ? `- Target Customers: ${(constraints as any).target_customers}` : ''}\n${(constraints as any).challenges ? `- Main Business Challenges: ${Array.isArray((constraints as any).challenges) ? (constraints as any).challenges.join(', ') : (constraints as any).challenges}` : ''}\n${(constraints as any).business_goals ? `- Business Goals: ${Array.isArray((constraints as any).business_goals) ? (constraints as any).business_goals.join(', ') : (constraints as any).business_goals}` : ''}\n`
    
    if (!openaiAvailable) {
      prompt += '\n## IMPORTANT: Chayo AI is currently unavailable due to technical issues. Please inform the user that our AI service is temporarily down and ask them to try again later.\n'
    } else if (questions.length > 0) {
      prompt += '\n## Information You Should Gather (ask only about missing info):\n'
      questions.forEach((q, idx) => {
        prompt += `${idx + 1}. ${q}\n`
      })
    } else {
      prompt += '\n## All key business information has been gathered.\n'
    }
    if (openaiAvailable) {
      prompt += `\n## WhatsApp Trial Information:\n${constraints.whatsapp_trial_mentioned ? 'The WhatsApp trial has already been mentioned to this user. Do not mention it again.' : `Once you have gathered basic business information (business type, name, and at least 3-4 other details), mention:\n"Great! I now have a good understanding of your business. Did you know that you can get a 3-day free trial of our WhatsApp AI assistant? This allows your patients to chat with an AI that knows all about your business - handling patient inquiries, appointments, and more. Would you like to learn more about setting up your WhatsApp AI trial?"`}
\n## Response Style:\n- If you don't know their business type, ALWAYS start with: "What type of business do you run?"\n- If you know their business type but not the name, ask: "What is the name of your business?"\n- Ask ONE specific question at a time about their business\n- If they go off-topic, politely redirect: "That's interesting, but let's focus on your business. [Ask business question]"\n- Never provide information about other topics\n- Always end with a business-related question\n- Be friendly but focused on business information gathering\n- Use "you" and "your business" instead of referring to a business name you don't know\n\nRemember: Your ONLY job is to understand their business. Do not provide advice, information, or responses about anything else.`
    } else {
      prompt += `\n## Response Style:\n- Inform the user that Chayo AI is currently unavailable due to technical issues\n- Ask them to try again later\n- Be polite and apologetic about the inconvenience\n- Do not attempt to gather business information or provide any other responses`
    }
    return prompt
  }

  /**
   * Get relevant conversation knowledge for the agent
   */
  private async getConversationKnowledge(agentId: string, maxLength: number): Promise<string | null> {
    try {
      // Get a summary of conversation patterns using the same Supabase client
      const embeddingService = new (await import('./embeddingService')).EmbeddingService(this.supabase)
      const summary = await embeddingService.getBusinessKnowledgeSummary(agentId)
      
      if (!summary || summary.conversation_count === 0) {
        return null
      }

      // Get some example conversations
      const { data: conversations, error } = await this.supabase
        .from('conversation_embeddings')
        .select('conversation_segment, metadata')
        .eq('agent_id', agentId)
        .eq('segment_type', 'conversation')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error || !conversations || conversations.length === 0) {
        return null
      }

      let knowledge = `Based on ${summary.conversation_count} previous conversations, here are key patterns:\n\n`
      
      // Add conversation examples
      conversations.forEach((conv, index) => {
        const role = conv.metadata?.role || 'user'
        knowledge += `${index + 1}. ${role}: "${conv.conversation_segment}"\n`
      })

      // Truncate if too long
      if (knowledge.length > maxLength) {
        knowledge = knowledge.substring(0, maxLength) + '...'
      }

      return knowledge
    } catch (error) {
      console.error('Error getting conversation knowledge:', error)
      return null
    }
  }



  /**
   * Build response guidelines based on business constraints
   */
  private buildResponseGuidelines(constraints: BusinessConstraints): string {
    let guidelines = '\n\n## Response Guidelines:\n'
    
    // Check if we have gathered enough business info (5+) to switch focus
    if ((constraints.business_info_gathered || 0) >= 5) {
      guidelines += `## FOCUS SHIFT: Client Communication Strategy\n`
      guidelines += `- You have gathered sufficient business information (${(constraints.business_info_gathered || 0)} details)\n`
      guidelines += `- NOW FOCUS on understanding what ${constraints.name} wants to communicate to their CLIENTS through Chayo\n`
      guidelines += `- Ask about client communication preferences, messaging tone, and how they want to interact with customers\n`
      guidelines += `- Questions should focus on: "How do you want Chayo to represent your business to clients?", "What key messages should Chayo communicate?", "What tone should Chayo use with your customers?"\n`
      guidelines += `- Gather information about client service approach, communication style, and brand voice\n`
      guidelines += `- Focus on CLIENT-FACING aspects rather than internal business operations\n`
      guidelines += `- IMPORTANT: After gathering 2-3 client communication preferences, mention: "Perfect! Now I have enough information to set up your client chat system. I'll generate a QR code that you can share with your customers so they can chat directly with your personalized Chayo assistant. This will be available in your dashboard shortly."\n\n`
    } else {
      guidelines += `- ONLY ask questions about ${constraints.name} and their business\n`
      guidelines += `- Focus on gathering internal business information first\n`
    }
    
    guidelines += `- Maintain a ${constraints.tone} tone while gathering information\n`
    guidelines += '- NEVER provide information, advice, or responses about other topics\n'
    
    if ((constraints.business_info_gathered || 0) >= 5) {
      guidelines += '- If they ask about anything not client-communication related, redirect: "Let\'s focus on how you want Chayo to communicate with your clients. [Ask client communication question]"\n'
    } else {
      guidelines += '- If they ask about anything not business-related, redirect: "Let\'s focus on your business. [Ask business question]"\n'
    }
    
    guidelines += '- Ask ONE specific question at a time\n'
    guidelines += '- Always end with a relevant question\n'
    guidelines += '- Do not give advice, suggestions, or information - only gather information\n'
    
    if ((constraints.business_info_gathered || 0) >= 5) {
      guidelines += '- If they ask "what can you do", say: "I\'m here to understand how you want Chayo to communicate with your clients. Let me ask you about your client communication preferences."\n'
    } else {
      guidelines += '- If they ask "what can you do", say: "I\'m here to understand your business better. Let me ask you some questions about your business."\n'
    }
    
    if (constraints.contact_info) {
      guidelines += `- Only mention contact information if specifically asked about it: ${constraints.contact_info}\n`
    }
    
    guidelines += '- Your responses should be 1-2 sentences maximum, followed by a relevant question\n'
    guidelines += '- Never provide explanations about other topics or general information\n'
    if (constraints.whatsapp_trial_mentioned) {
      guidelines += '- The WhatsApp trial has already been mentioned. Do not mention it again.\n'
    } else {
      if ((constraints.business_info_gathered || 0) >= 5) {
        guidelines += '- Once you have gathered client communication preferences, mention the WhatsApp trial opportunity\n'
      } else {
        guidelines += '- Once you have gathered business type, name, and at least 3-4 other business details, mention the WhatsApp trial opportunity\n'
      }
      guidelines += '- Only mention the WhatsApp trial once per conversation, after sufficient information is gathered\n'
    }

    return guidelines
  }

  /**
   * Update an agent's system prompt with current knowledge
   */
  async updateAgentSystemPrompt(agentId: string): Promise<void> {
    try {
      const systemPrompt = await this.generateSystemPrompt(agentId)
      
      const { error } = await this.supabase
        .from('agents')
        .update({ system_prompt: systemPrompt })
        .eq('id', agentId)

      if (error) {
        console.error('Error updating system prompt:', error)
        throw new Error('Failed to update system prompt')
      }
    } catch (error) {
      console.error('Error in updateAgentSystemPrompt:', error)
      throw error
    }
  }

  /**
   * Get relevant document chunks for RAG based on user query
   */
  private async getRelevantDocumentChunks(
    agentId: string,
    userQuery: string,
    maxChunks: number = 5
  ): Promise<string | null> {
    try {
      // Search for relevant document chunks using embeddings with server-side client
      const embeddingService = new (await import('./embeddingService')).EmbeddingService(this.supabase)
      const relevantChunks = await embeddingService.searchSimilarConversations(
        agentId,
        userQuery,
        0.4, // Distance threshold for document chunks (lower = more similar)
        maxChunks
      )

      // Filter for document chunks specifically
      const documentChunks = relevantChunks.filter(chunk => 
        chunk.segment_type === 'document' || 
        chunk.metadata?.source === 'document_upload'
      )

      if (documentChunks.length === 0) {
        return null
      }

      let documentContext = '## Relevant Document Information:\n\n'
      
      documentChunks.forEach((chunk, index) => {
        const fileName = chunk.metadata?.file_name || 'Document'
        const chunkNumber = chunk.metadata?.chunk_index || index + 1
        documentContext += `**${fileName} (Chunk ${chunkNumber}):**\n${chunk.conversation_segment}\n\n`
      })

      return documentContext
    } catch (error: any) {
      console.error('Error getting relevant document chunks:', error)
      
      // If it's a quota error, we can still function without RAG
      if (error?.message?.includes('quota exceeded')) {
        console.warn('OpenAI quota exceeded - RAG features temporarily disabled')
        return null
      }
      
      return null
    }
  }

  /**
   * Get a dynamic system prompt for real-time use with enhanced RAG
   */
  async getDynamicSystemPrompt(
    agentId: string,
    userQuery: string,
    locale: string = 'en'
  ): Promise<string> {
    try {
      // Get base system prompt with language context
      let systemPrompt = await this.generateSystemPrompt(agentId, locale)

      // Add relevant document chunks for RAG
      const documentContext = await this.getRelevantDocumentChunks(agentId, userQuery, 3)
      if (documentContext) {
        systemPrompt += '\n\n' + documentContext
      }

      // Add relevant conversation context based on user query
      // Use distance threshold for conversation retrieval with server-side client
      const embeddingService = new (await import('./embeddingService')).EmbeddingService(this.supabase)
      const relevantConversations = await embeddingService.searchSimilarConversations(
        agentId,
        userQuery,
        0.8, // Higher distance threshold (more permissive) for better conversation retrieval
        5   // Increased from 3 to 5 for more context
      )

      if (relevantConversations.length > 0) {
        systemPrompt += '\n\n## Relevant Previous Conversations:\n'
        relevantConversations.forEach((conv, index) => {
          const role = conv.metadata?.role || 'user'
          const distance = conv.distance ? ` (distance: ${conv.distance.toFixed(3)})` : ''
          systemPrompt += `${index + 1}. ${role}: "${conv.conversation_segment}"${distance}\n`
        })
      } else {
        // If no similar conversations found, get recent conversations for context
        const recentConversations = await this.getRecentConversations(agentId, 3)
        if (recentConversations.length > 0) {
          systemPrompt += '\n\n## Recent Conversation Context:\n'
          recentConversations.forEach((conv, index) => {
            const role = conv.metadata?.role || 'user'
            systemPrompt += `${index + 1}. ${role}: "${conv.conversation_segment}"\n`
          })
        }
      }

      // Add instructions for using document context
      if (documentContext) {
        systemPrompt += '\n\n## Instructions for Document Context:\n'
        systemPrompt += '- Use the document information above to provide accurate and relevant responses\n'
        systemPrompt += '- If the user asks about something covered in the documents, reference that information\n'
        systemPrompt += '- If the documents don\'t contain relevant information, say so and offer to help with what you do know\n'
        systemPrompt += '- Always maintain the business tone and context when referencing documents\n'
      }

      return systemPrompt
    } catch (error) {
      console.error('Error getting dynamic system prompt:', error)
      throw new Error('Failed to get dynamic system prompt')
    }
  }

  /**
   * Get recent conversations for context when distance search fails
   */
  private async getRecentConversations(agentId: string, limit: number = 3): Promise<any[]> {
    try {
      const { data: conversations, error } = await this.supabase
        .from('conversation_embeddings')
        .select('conversation_segment, metadata')
        .eq('agent_id', agentId)
        .eq('segment_type', 'conversation')
        .order('created_at', { ascending: false })
        .limit(limit * 2) // Get more to filter out system messages

      if (error || !conversations || conversations.length === 0) {
        return []
      }

      // Filter out very short messages and system-like messages
      const filteredConversations = conversations.filter(conv => 
        conv.conversation_segment.length > 10 && 
        !conv.conversation_segment.toLowerCase().includes('system') &&
        conv.metadata?.role !== 'system'
      ).slice(0, limit)

      return filteredConversations
    } catch (error) {
      console.error('Error getting recent conversations:', error)
      return []
    }
  }
}

// Export singleton instance
export const systemPromptService = new SystemPromptService() 