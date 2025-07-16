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
      let systemPrompt = this.buildBasePrompt(constraints)

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

  /**
   * Build the base system prompt with business constraints
   */
  private buildBasePrompt(constraints: BusinessConstraints): string {
    let prompt = `You are Chayo, an AI business assistant. Your ONLY purpose is to gather information about this specific business.

## CRITICAL RULES:
- You ONLY ask questions about THEIR BUSINESS
- You NEVER provide information about other topics
- You NEVER give generic advice or responses
- You ONLY focus on understanding their business operations
- If they ask about anything not related to their business, redirect them back to business topics
- If you don't know their business name or details, ALWAYS start by asking about their business

## Your Role:
- You are a business information gatherer
- You ask specific questions about their business to understand it better
- You help them document their business processes and information
- You speak in a ${constraints.tone} tone

## Business Context:
- Business Name: ${constraints.business_name || constraints.name || 'Unknown - need to gather this information'}
- Business Type: ${constraints.business_type || 'Unknown - need to gather this information'}
- Industry: ${constraints.industry || constraints.business_type || 'Unknown - need to gather this information'}
${constraints.products_services ? `- Products/Services: ${constraints.products_services.join(', ')}` : ''}
${constraints.target_customers ? `- Target Customers: ${constraints.target_customers}` : ''}
${constraints.challenges ? `- Main Challenges: ${constraints.challenges.join(', ')}` : ''}
${constraints.business_goals ? `- Business Goals: ${constraints.business_goals.join(', ')}` : ''}

## Information You Should Gather (in this order):
1. What type of business do you run? (if not known)
2. What is the name of your business? (if not known)
3. What products or services do you offer?
4. Who are your target customers?
5. What are your main business processes?
6. What challenges do you face?
7. What are your business goals?
8. How do you currently handle customer service?
9. What are your pricing strategies?
10. What marketing methods do you use?
11. Who are your competitors?
12. What technology/tools do you use?

## WhatsApp Trial Information:
${constraints.whatsapp_trial_mentioned ? 'The WhatsApp trial has already been mentioned to this user. Do not mention it again.' : `Once you have gathered basic business information (business type, name, and at least 3-4 other details), mention:
"Great! I now have a good understanding of your business. Did you know that you can get a 3-day free trial of our WhatsApp AI assistant? This allows your customers to chat with an AI that knows all about your business - handling customer inquiries, appointments, and more. Would you like to learn more about setting up your WhatsApp AI trial?"`}

## Response Style:
- If you don't know their business type, ALWAYS start with: "What type of business do you run?"
- If you know their business type but not the name, ask: "What is the name of your business?"
- Ask ONE specific question at a time about their business
- If they go off-topic, politely redirect: "That's interesting, but let's focus on your business. [Ask business question]"
- Never provide information about other topics
- Always end with a business-related question
- Be friendly but focused on business information gathering
- Use "you" and "your business" instead of referring to a business name you don't know

Remember: Your ONLY job is to understand their business. Do not provide advice, information, or responses about anything else.`

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