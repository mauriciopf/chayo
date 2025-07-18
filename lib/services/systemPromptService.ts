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

export interface SystemPromptConfig {
  includeConversations: boolean
  includeFaqs: boolean
  includeExamples: boolean
  maxContextLength: number
  temperature: number
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
    config: SystemPromptConfig = {
      includeConversations: true,
      includeFaqs: true,
      includeExamples: true,
      maxContextLength: 4000,
      temperature: 0.7
    },
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

      // Parse business constraints
      const constraints = await this.parseBusinessConstraints(agent)

      // Build the system prompt with language context
      let systemPrompt = await this.buildBasePromptDynamic(agentId, constraints, locale)

      // Add conversation knowledge if enabled
      if (config.includeConversations) {
        const conversationKnowledge = await this.getConversationKnowledge(agentId, config.maxContextLength)
        if (conversationKnowledge) {
          systemPrompt += `\n\n## Business Conversation Knowledge:\n${conversationKnowledge}`
        }
      }

      // Add FAQs if enabled
      if (config.includeFaqs) {
        const faqKnowledge = await this.getFaqKnowledge(agentId)
        if (faqKnowledge) {
          systemPrompt += `\n\n## Frequently Asked Questions:\n${faqKnowledge}`
        }
      }

      // Add examples if enabled
      if (config.includeExamples) {
        const exampleKnowledge = await this.getExampleKnowledge(agentId)
        if (exampleKnowledge) {
          systemPrompt += `\n\n## Example Interactions:\n${exampleKnowledge}`
        }
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
   * Parse business constraints from agent data using the new database function
   */
  private async parseBusinessConstraints(agent: any): Promise<BusinessConstraints> {
    try {
      // Get business constraints using the database function
      const { data: constraintsData, error } = await this.supabase
        .rpc('get_agent_business_constraints', { agent_uuid: agent.id })

      if (error || !constraintsData) {
        console.warn('Failed to get business constraints from database function, using fallback:', error)
        // Fallback to basic constraints
        return {
          name: agent.name || 'Business',
          tone: 'professional',
          whatsapp_trial_mentioned: false,
          business_info_gathered: 0
        }
      }

      const constraints: BusinessConstraints = {
        name: constraintsData.name || agent.name || 'Business',
        tone: constraintsData.tone || 'professional',
        whatsapp_trial_mentioned: constraintsData.whatsapp_trial_mentioned || false,
        business_info_gathered: constraintsData.business_info_gathered || 0,
        // Add all other fields from the constraints
        ...constraintsData
      }

      console.log('Parsed business constraints from database function:', constraints)
      return constraints
    } catch (error) {
      console.error('Error parsing business constraints:', error)
      // Fallback to basic constraints
      return {
        name: agent.name || 'Business',
        tone: 'professional',
        whatsapp_trial_mentioned: false,
        business_info_gathered: 0
      }
    }
  }

  // Helper: Get or create a question template for a field
  private async getOrCreateFieldQuestion(agentId: string, field: string): Promise<string> {
    // Get the organization_id from the agent
    const { data: agent, error: agentError } = await this.supabase
      .from('agents')
      .select('organization_id')
      .eq('id', agentId)
      .single()
    
    if (agentError || !agent) {
      throw new Error('Agent not found')
    }
    
    // 1. Try to get from business_info_fields for this organization
    const { data, error } = await this.supabase
      .from('business_info_fields')
      .select('question_template')
      .eq('organization_id', agent.organization_id)
      .eq('field_name', field)
      .single();
    if (data?.question_template) return data.question_template;

    // 2. If not found, generate with LLM
    const prompt = `Generate a friendly, business-focused question to ask a user about their "${field}" in the context of business onboarding.`;
    const apiKey = process.env.OPENAI_API_KEY;
    let question = `Can you tell me about your ${field.replace('_', ' ')}?`;
    try {
      const llmRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 50,
          temperature: 0.5
        })
      });
      const llmData = await llmRes.json();
      question = llmData.choices?.[0]?.message?.content?.trim() || question;
    } catch (err) {
      console.warn('LLM question generation failed, using fallback:', err);
    }
    // 3. Store in business_info_fields for future use
    try {
      await this.supabase.from('business_info_fields').insert({
        organization_id: agent.organization_id,
        field_name: field,
        field_type: 'text',
        is_answered: false,
        question_template: question
      });
    } catch (e) {
      // Ignore insert errors (e.g., duplicate field)
    }
    return question;
  }

  /**
   * Build the base system prompt with business constraints
   */
  private async buildBasePromptDynamic(agentId: string, constraints: BusinessConstraints, locale: string = 'en'): Promise<string> {
    const supabase = this.supabase
    
    // Get the organization_id from the agent
    const { data: agent, error: agentError } = await this.supabase
      .from('agents')
      .select('organization_id')
      .eq('id', agentId)
      .single()
    
    if (agentError || !agent) {
      throw new Error('Agent not found')
    }
    
    // 1. Get business info from the new dynamic system using organization_id
    const businessInfoService = new (await import('./businessInfoService')).BusinessInfoService(this.supabase)
    const businessInfo = await businessInfoService.getBusinessInfo(agent.organization_id)
    const pendingQuestions = await businessInfoService.getPendingQuestions(agent.organization_id)
    
    // 2. Build business constraints entirely from business_info_fields
    const dynamicConstraints: BusinessConstraints = {
      name: constraints.name, // Keep agent name as fallback
      tone: constraints.tone, // Keep agent tone as fallback
      whatsapp_trial_mentioned: constraints.whatsapp_trial_mentioned || false,
      business_info_gathered: businessInfo.length // Count from business_info_fields
    }
    
    // Populate all business information from business_info_fields
    for (const field of businessInfo) {
      (dynamicConstraints as any)[field.field_name] = field.field_value
    }
    
    // 3. Get questions for missing information
    const questions = pendingQuestions.map(q => q.question_template)
    
    // 4. If no pending questions, generate new ones
    if (questions.length === 0) {
      const userMessages = "Initial conversation" // This will be replaced with actual context
      const newQuestionObjects = await businessInfoService.generateBusinessQuestions(agent.organization_id, userMessages)
      const newQuestions = newQuestionObjects.map(q => q.question_template)
      questions.push(...newQuestions)
    }
    
    // 5. Check if OpenAI is available (if no questions could be generated)
    const openaiAvailable = process.env.OPENAI_API_KEY && questions.length > 0
    // Add language instructions based on locale
    const languageInstructions = locale === 'es' 
      ? 'ALWAYS respond in Spanish (Español). Ask all questions in Spanish and maintain conversation in Spanish throughout.'
      : 'ALWAYS respond in English. Ask all questions in English and maintain conversation in English throughout.'

    let prompt = `You are Chayo, an AI business assistant. Your ONLY purpose is to gather information about this specific business.

## LANGUAGE REQUIREMENT:
${languageInstructions}

## CRITICAL RULES:\n- You ONLY ask questions about THEIR BUSINESS\n- You NEVER provide information about other topics\n- You NEVER give generic advice or responses\n- You ONLY focus on understanding their business operations\n- If they ask about anything not related to their business, redirect them back to business topics\n- If you don't know their business name or details, ALWAYS start by asking about their business\n\n## Your Role:\n- You are a business information gatherer\n- You ask specific questions about their business to understand it better\n- You help them document their business processes and information\n- You speak in a ${dynamicConstraints.tone} tone\n\n## Business Context:\n- Business Name: ${(dynamicConstraints as any).business_name || (dynamicConstraints as any).name || 'Unknown - need to gather this information'}\n- Business Type: ${(dynamicConstraints as any).business_type || 'Unknown - need to gather this information'}\n- Industry: ${(dynamicConstraints as any).industry || (dynamicConstraints as any).business_type || 'Unknown - need to gather this information'}\n${(dynamicConstraints as any).products_services ? `- Products/Services: ${Array.isArray((dynamicConstraints as any).products_services) ? (dynamicConstraints as any).products_services.join(', ') : (dynamicConstraints as any).products_services}` : ''}\n${(dynamicConstraints as any).target_customers ? `- Target Customers: ${(dynamicConstraints as any).target_customers}` : ''}\n${(dynamicConstraints as any).challenges ? `- Main Challenges: ${Array.isArray((dynamicConstraints as any).challenges) ? (dynamicConstraints as any).challenges.join(', ') : (dynamicConstraints as any).challenges}` : ''}\n${(dynamicConstraints as any).business_goals ? `- Business Goals: ${Array.isArray((dynamicConstraints as any).business_goals) ? (dynamicConstraints as any).business_goals.join(', ') : (dynamicConstraints as any).business_goals}` : ''}\n`
    
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
      prompt += `\n## WhatsApp Trial Information:\n${dynamicConstraints.whatsapp_trial_mentioned ? 'The WhatsApp trial has already been mentioned to this user. Do not mention it again.' : `Once you have gathered basic business information (business type, name, and at least 3-4 other details), mention:\n"Great! I now have a good understanding of your business. Did you know that you can get a 3-day free trial of our WhatsApp AI assistant? This allows your customers to chat with an AI that knows all about your business - handling customer inquiries, appointments, and more. Would you like to learn more about setting up your WhatsApp AI trial?"`}
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
   * Get FAQ knowledge for the agent
   */
  private async getFaqKnowledge(agentId: string): Promise<string | null> {
    try {
      const { data: faqs, error } = await this.supabase
        .from('conversation_embeddings')
        .select('conversation_segment, metadata')
        .eq('agent_id', agentId)
        .eq('segment_type', 'faq')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error || !faqs || faqs.length === 0) {
        return null
      }

      let faqKnowledge = 'Common questions and answers:\n\n'
      
      faqs.forEach((faq, index) => {
        faqKnowledge += `Q${index + 1}: ${faq.conversation_segment}\n`
      })

      return faqKnowledge
    } catch (error) {
      console.error('Error getting FAQ knowledge:', error)
      return null
    }
  }

  /**
   * Get example interactions for the agent
   */
  private async getExampleKnowledge(agentId: string): Promise<string | null> {
    try {
      const { data: examples, error } = await this.supabase
        .from('conversation_embeddings')
        .select('conversation_segment, metadata')
        .eq('agent_id', agentId)
        .eq('segment_type', 'example')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error || !examples || examples.length === 0) {
        return null
      }

      let exampleKnowledge = 'Example interactions to follow:\n\n'
      
      examples.forEach((example, index) => {
        exampleKnowledge += `Example ${index + 1}: ${example.conversation_segment}\n`
      })

      return exampleKnowledge
    } catch (error) {
      console.error('Error getting example knowledge:', error)
      return null
    }
  }

  /**
   * Build response guidelines based on business constraints
   */
  private buildResponseGuidelines(constraints: BusinessConstraints): string {
    let guidelines = '\n\n## Response Guidelines:\n'
    
    guidelines += `- ONLY ask questions about ${constraints.name} and their business\n`
    guidelines += `- Maintain a ${constraints.tone} tone while gathering information\n`
    guidelines += '- NEVER provide information, advice, or responses about other topics\n'
    guidelines += '- If they ask about anything not business-related, redirect: "Let\'s focus on your business. [Ask business question]"\n'
    guidelines += '- Ask ONE specific business question at a time\n'
    guidelines += '- Always end with a business-related question\n'
    guidelines += '- Do not give advice, suggestions, or information - only gather information\n'
    guidelines += '- If they ask "what can you do", say: "I\'m here to understand your business better. Let me ask you some questions about your business."\n'
    
    if (constraints.contact_info) {
      guidelines += `- Only mention contact information if specifically asked about it: ${constraints.contact_info}\n`
    }
    
    guidelines += '- Your responses should be 1-2 sentences maximum, followed by a business question\n'
    guidelines += '- Never provide explanations about other topics or general information\n'
    if (constraints.whatsapp_trial_mentioned) {
      guidelines += '- The WhatsApp trial has already been mentioned. Do not mention it again.\n'
    } else {
      guidelines += '- Once you have gathered business type, name, and at least 3-4 other business details, mention the WhatsApp trial opportunity\n'
      guidelines += '- Only mention the WhatsApp trial once per conversation, after sufficient business information is gathered\n'
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
    locale: string = 'en',
    config: SystemPromptConfig = {
      includeConversations: true,
      includeFaqs: true,
      includeExamples: true,
      maxContextLength: 4000,
      temperature: 0.7
    }
  ): Promise<string> {
    try {
      // Get base system prompt with language context
      let systemPrompt = await this.generateSystemPrompt(agentId, config, locale)

      // Add relevant document chunks for RAG
      const documentContext = await this.getRelevantDocumentChunks(agentId, userQuery, 3)
      if (documentContext) {
        systemPrompt += '\n\n' + documentContext
      }

      // Add relevant conversation context based on user query
      if (config.includeConversations) {
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