import { createClient } from '@/lib/supabase/client'
import { embeddingService } from './embeddingService'

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
  private supabase = createClient()

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
    }
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
      const constraints = this.parseBusinessConstraints(agent)

      // Build the system prompt
      let systemPrompt = await this.buildBasePromptDynamic(agentId, constraints)

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
   * Parse business constraints from agent data
   */
  private parseBusinessConstraints(agent: any): BusinessConstraints {
    const constraints: BusinessConstraints = {
      name: agent.name || 'Business',
      tone: agent.tone || 'professional',
      ...agent.business_constraints
    }

    console.log('Parsed business constraints:', constraints)
    return constraints
  }

  // Helper: Get or create a question template for a field
  private async getOrCreateFieldQuestion(field: string): Promise<string> {
    // 1. Try to get from business_info_fields
    const { data, error } = await this.supabase
      .from('business_info_fields')
      .select('question_template')
      .eq('field', field)
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
        field,
        display_name: field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        question_template: question,
        data_type: 'string'
      });
    } catch (e) {
      // Ignore insert errors (e.g., duplicate field)
    }
    return question;
  }

  /**
   * Build the base system prompt with business constraints
   */
  private async buildBasePromptDynamic(agentId: string, constraints: BusinessConstraints): Promise<string> {
    const supabase = this.supabase
    // 1. Get all unique fields from business_info_history for this agent
    const { data: historyRows, error } = await supabase
      .from('business_info_history')
      .select('field')
      .eq('agent_id', agentId)
    let uniqueFields: string[] = []
    if (!error && historyRows) {
      const fieldSet: Set<string> = new Set(historyRows.map((f: any) => f.field))
      uniqueFields = Array.from(fieldSet)
    }
    // 2. If no dynamic fields found, use a small set of core fields
    if (uniqueFields.length === 0) {
      uniqueFields = [
        'business_type',
        'business_name',
        'products_services',
        'target_customers',
        'business_processes',
        'challenges',
        'business_goals',
      ]
    }
    // 3. For each field, if not present or empty in business_constraints, add to missingFields
    const missingFields = uniqueFields.filter(field => {
      const value = (constraints as any)[field]
      if (Array.isArray(value)) return value.length === 0
      return !value
    })
    // 4. For each missing field, fetch or generate a question
    const questions: string[] = []
    for (const field of missingFields) {
      const q = await this.getOrCreateFieldQuestion(field)
      questions.push(q)
    }
    let prompt = `You are Chayo, an AI business assistant. Your ONLY purpose is to gather information about this specific business.\n\n## CRITICAL RULES:\n- You ONLY ask questions about THEIR BUSINESS\n- You NEVER provide information about other topics\n- You NEVER give generic advice or responses\n- You ONLY focus on understanding their business operations\n- If they ask about anything not related to their business, redirect them back to business topics\n- If you don't know their business name or details, ALWAYS start by asking about their business\n\n## Your Role:\n- You are a business information gatherer\n- You ask specific questions about their business to understand it better\n- You help them document their business processes and information\n- You speak in a ${constraints.tone} tone\n\n## Business Context:\n- Business Name: ${constraints.business_name || constraints.name || 'Unknown - need to gather this information'}\n- Business Type: ${constraints.business_type || 'Unknown - need to gather this information'}\n- Industry: ${constraints.industry || constraints.business_type || 'Unknown - need to gather this information'}\n${constraints.products_services ? `- Products/Services: ${constraints.products_services.join(', ')}` : ''}\n${constraints.target_customers ? `- Target Customers: ${constraints.target_customers}` : ''}\n${constraints.challenges ? `- Main Challenges: ${constraints.challenges.join(', ')}` : ''}\n${constraints.business_goals ? `- Business Goals: ${constraints.business_goals.join(', ')}` : ''}\n`
    if (questions.length > 0) {
      prompt += '\n## Information You Should Gather (ask only about missing info):\n'
      questions.forEach((q, idx) => {
        prompt += `${idx + 1}. ${q}\n`
      })
    } else {
      prompt += '\n## All key business information has been gathered.\n'
    }
    prompt += `\n## WhatsApp Trial Information:\n${constraints.whatsapp_trial_mentioned ? 'The WhatsApp trial has already been mentioned to this user. Do not mention it again.' : `Once you have gathered basic business information (business type, name, and at least 3-4 other details), mention:\n"Great! I now have a good understanding of your business. Did you know that you can get a 3-day free trial of our WhatsApp AI assistant? This allows your customers to chat with an AI that knows all about your business - handling customer inquiries, appointments, and more. Would you like to learn more about setting up your WhatsApp AI trial?"`}
\n## Response Style:\n- If you don't know their business type, ALWAYS start with: "What type of business do you run?"\n- If you know their business type but not the name, ask: "What is the name of your business?"\n- Ask ONE specific question at a time about their business\n- If they go off-topic, politely redirect: "That's interesting, but let's focus on your business. [Ask business question]"\n- Never provide information about other topics\n- Always end with a business-related question\n- Be friendly but focused on business information gathering\n- Use "you" and "your business" instead of referring to a business name you don't know\n\nRemember: Your ONLY job is to understand their business. Do not provide advice, information, or responses about anything else.`
    return prompt
  }

  /**
   * Get relevant conversation knowledge for the agent
   */
  private async getConversationKnowledge(agentId: string, maxLength: number): Promise<string | null> {
    try {
      // Get a summary of conversation patterns
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
      // Search for relevant document chunks using embeddings
      const relevantChunks = await embeddingService.searchSimilarConversations(
        agentId,
        userQuery,
        0.6, // Lower threshold for document chunks
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
    config: SystemPromptConfig = {
      includeConversations: true,
      includeFaqs: true,
      includeExamples: true,
      maxContextLength: 4000,
      temperature: 0.7
    }
  ): Promise<string> {
    try {
      // Get base system prompt
      let systemPrompt = await this.generateSystemPrompt(agentId, config)

      // Add relevant document chunks for RAG
      const documentContext = await this.getRelevantDocumentChunks(agentId, userQuery, 3)
      if (documentContext) {
        systemPrompt += '\n\n' + documentContext
      }

      // Add relevant conversation context based on user query
      if (config.includeConversations) {
        const relevantConversations = await embeddingService.searchSimilarConversations(
          agentId,
          userQuery,
          0.7,
          3
        )

        if (relevantConversations.length > 0) {
          systemPrompt += '\n\n## Relevant Previous Conversations:\n'
          relevantConversations.forEach((conv, index) => {
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
}

// Export singleton instance
export const systemPromptService = new SystemPromptService() 