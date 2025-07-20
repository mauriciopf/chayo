import { createClient } from '@/lib/supabase/client'
import { systemPromptService } from './systemPromptService'
import { embeddingService } from './embeddingService'
import { SupabaseClient } from '@supabase/supabase-js'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatResponse {
  aiMessage: string
  usingRAG: boolean
  agent: {
    id: string
    name: string
    greeting?: string
    tone?: string
  }
}

export interface ChatContext {
  user: any
  organization: any
  agent: any
  locale: string
}

export class ChatService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  /**
   * Process a chat request and generate AI response
   */
  async processChat(
    messages: ChatMessage[],
    agentId: string | null | undefined,
    locale: string = 'en'
  ): Promise<ChatResponse> {
    try {
      // Get user and organization context
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Authentication required')
      }

      // Get or create organization and agent
      const organization = await this.getOrCreateOrganization(user)
      const agent = await this.getOrCreateAgent(user, organization, agentId || null)
      
      const context: ChatContext = {
        user,
        organization,
        agent,
        locale
      }

      // Generate AI response
      const { aiMessage, usingRAG } = await this.generateAIResponse(messages, context)
      
      // Update WhatsApp trial status if mentioned
      await this.updateWhatsAppTrialStatus(aiMessage, context)
      
      // Store conversation for RAG
      await this.storeConversation(messages, aiMessage, context)

      return {
        aiMessage,
        usingRAG,
        agent: {
          id: agent.id,
          name: agent.name,
          greeting: agent.business_constraints?.greeting,
          tone: agent.business_constraints?.tone
        }
      }
    } catch (error) {
      console.error('Chat service error:', error)
      throw error
    }
  }

  /**
   * Get or create organization for user
   */
  private async getOrCreateOrganization(user: any): Promise<any> {
    // Try to find existing organization
    const { data: membership, error: membershipError } = await this.supabase
      .from('team_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership || membershipError) {
      // Create new organization
      const emailPrefix = user.email?.split('@')[0] || 'user'
      const randomSuffix = Math.random().toString(36).substring(2, 8)
      const slug = `${emailPrefix.replace(/[^a-zA-Z0-9]/g, '')}-${randomSuffix}`
      const name = `${emailPrefix}'s Organization`

      const { data: newOrg, error: orgError } = await this.supabase
        .from('organizations')
        .insert({
          name,
          slug,
          owner_id: user.id
        })
        .select()
        .single()

      if (!orgError && newOrg) {
        // Add user as owner in team_members
        await this.supabase
          .from('team_members')
          .insert({
            organization_id: newOrg.id,
            user_id: user.id,
            role: 'owner',
            status: 'active'
          })

        return newOrg
      }
    } else {
      // Get existing organization
      const { data: org, error: orgError } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', membership.organization_id)
        .single()

      if (!orgError && org) {
        return org
      }
    }

    throw new Error('Failed to get or create organization')
  }

  /**
   * Get or create agent for organization
   */
  private async getOrCreateAgent(user: any, organization: any, agentId: string | null): Promise<any> {
    if (agentId) {
      // Use specified agent if provided
      const { data: agent, error } = await this.supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .eq('organization_id', organization.id)
        .single()
      
      if (!error && agent) {
        return agent
      }
    } else {
      // Find existing agent for this organization, or create one
      const { data: existingAgents, error: fetchError } = await this.supabase
        .from('agents')
        .select('*')
        .eq('organization_id', organization.id)
        .limit(1)

      if (!fetchError && existingAgents && existingAgents.length > 0) {
        return existingAgents[0]
      } else {
        // Create new agent for this business
        const { data: newAgent, error: createError } = await this.supabase
          .from('agents')
          .insert({
            user_id: user.id,
            organization_id: organization.id,
            name: organization.name || 'Business AI Assistant',
            business_constraints: {
              greeting: '¡Hola! I\'m Chayo, your AI business assistant. I\'m here to understand your health and wellness business better. To get started, what type of health or wellness business do you run?',
              goals: ['Gather comprehensive business information', 'Understand business processes', 'Document business operations', 'Learn about products and services', 'Understand customer base'],
              name: organization.name || 'Business AI Assistant',
              industry: 'General Business',
              values: ['Information Accuracy', 'Business Understanding', 'Process Documentation', 'Customer Focus', 'Operational Clarity'],
              policies: ['Only ask business-related questions', 'Gather detailed information about operations', 'Document business processes accurately', 'Maintain focus on business information'],
              contact_info: '',
              custom_rules: ['Only ask questions about their business', 'Never provide advice or information about other topics', 'Focus on gathering business information'],
              whatsapp_trial_mentioned: false,
              business_info_gathered: 0
            }
          })
          .select()
          .single()

        if (!createError && newAgent) {
          return newAgent
        }
      }
    }

    throw new Error('Failed to get or create agent')
  }

  /**
   * Generate AI response using dynamic system prompt with RAG
   */
  private async generateAIResponse(messages: ChatMessage[], context: ChatContext): Promise<{ aiMessage: string; usingRAG: boolean }> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API key not set')
    }

    // Get the last user message for context
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || ''
    
    // Generate enhanced system prompt with training hints
    let systemPrompt: string
    let promptMetadata: any
    let usingRAG = false

    try {
      // Use enhanced system prompt service that handles training hints
      const { EnhancedSystemPromptService } = await import('./enhancedSystemPromptService')
      const enhancedService = new EnhancedSystemPromptService(this.supabase)
      
      const result = await enhancedService.generateEnhancedPrompt(
        context.agent.id,
        messages,
        lastUserMessage,
        context.locale
      )

      systemPrompt = result.finalPrompt
      promptMetadata = result.metadata
      usingRAG = result.metadata.usingRAG
    } catch (error) {
      console.warn('Failed to get enhanced system prompt, using fallback:', error)
      systemPrompt = this.getFallbackSystemPrompt(context)
      
      // Try to extract training hint context for fallback
      try {
        const { TrainingHintService } = await import('./trainingHintService')
        const trainingHintContext = TrainingHintService.extractFromMessages(messages)
        if (trainingHintContext.systemPromptAddition) {
          systemPrompt += trainingHintContext.systemPromptAddition
        }
      } catch (hintError) {
        console.warn('Failed to extract training hints for fallback:', hintError)
      }
      
      usingRAG = false
      promptMetadata = {
        hasTrainingHint: false,
        usingRAG: false
      }
    }

    // Prepare messages with dynamic system prompt (exclude system messages from user chat)
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.filter(m => m.role !== 'system')
    ]

    try {
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: chatMessages,
          temperature: 0.7,
          max_tokens: 1000
        })
      })

      if (!openaiRes.ok) {
        const errorData = await openaiRes.json().catch(() => ({ error: 'Unknown error' }))
        
        // Handle specific OpenAI errors
        if (openaiRes.status === 429) {
          console.error('OpenAI quota exceeded:', errorData)
          return {
            aiMessage: "I apologize, but I'm currently experiencing high demand and cannot process your request right now. Please try again in a few minutes, or contact support if this issue persists.",
            usingRAG
          }
        } else if (openaiRes.status === 401) {
          console.error('OpenAI API key invalid:', errorData)
          return {
            aiMessage: "I apologize, but there's a configuration issue with my AI service. Please contact support for assistance.",
            usingRAG
          }
        } else {
          console.error('OpenAI API error:', errorData)
          return {
            aiMessage: "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment.",
            usingRAG
          }
        }
      } else {
        const data = await openaiRes.json()
        return {
          aiMessage: data.choices?.[0]?.message?.content || '',
          usingRAG
        }
      }
    } catch (error) {
      console.error('Error calling OpenAI API:', error)
      return {
        aiMessage: "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment.",
        usingRAG
      }
    }
  }

  /**
   * Get fallback system prompt when RAG fails
   */
  private getFallbackSystemPrompt(context: ChatContext): string {
    const languageInstructions = context.locale === 'es' 
      ? 'ALWAYS respond in Spanish (Español). Ask all questions in Spanish and maintain conversation in Spanish throughout. NEVER mix Spanish and English in the same response.'
      : 'ALWAYS respond in English. Ask all questions in English and maintain conversation in English throughout. NEVER mix Spanish and English in the same response.'

    return `You are Chayo, an AI business assistant. Your ONLY purpose is to gather information about this specific business.

## LANGUAGE REQUIREMENT:
${languageInstructions}

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
- You speak in a ${context.agent.business_constraints?.tone || 'professional'} tone

## Business Context:
- Business Name: ${context.agent.name || 'Unknown - need to gather this information'}
- Industry: Unknown - need to gather this information

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

## Response Style:
- If you don't know their business type, ALWAYS start with: "What type of business do you run?"
- If you know their business type but not the name, ask: "What is the name of your business?"
- Ask ONE specific question at a time about their business
- If they go off-topic, politely redirect: "That's interesting, but let's focus on your business. [Ask business question]"
- Never provide information about other topics
- Always end with a business-related question
- Be friendly but focused on business information gathering
- Use "you" and "your business" instead of referring to a business name you don't know
- Your responses should be 1-2 sentences maximum, followed by a business question

Remember: Your ONLY job is to understand their business. Do not provide advice, information, or responses about anything else.`
  }

  /**
   * Update WhatsApp trial status if mentioned
   */
  private async updateWhatsAppTrialStatus(aiMessage: string, context: ChatContext): Promise<void> {
    // Check if WhatsApp trial was mentioned
    const whatsappTrialMentioned = aiMessage.toLowerCase().includes('whatsapp') && 
                                  aiMessage.toLowerCase().includes('trial') && 
                                  aiMessage.toLowerCase().includes('3-day')

    // Update agent's business constraints if WhatsApp trial was mentioned
    if (whatsappTrialMentioned && context.agent.business_constraints && !context.agent.business_constraints.whatsapp_trial_mentioned) {
      try {
        const updatedConstraints = {
          ...context.agent.business_constraints,
          whatsapp_trial_mentioned: true
        }
        
        await this.supabase
          .from('agents')
          .update({ business_constraints: updatedConstraints })
          .eq('id', context.agent.id)
      } catch (error) {
        console.warn('Failed to update agent WhatsApp trial status:', error)
      }
    }
  }

  /**
   * Store conversation for RAG
   */
  private async storeConversation(messages: ChatMessage[], aiMessage: string, context: ChatContext): Promise<void> {
    try {
      // Create conversation segments from the messages
      const conversationSegments = messages.map(msg => ({
        agent_id: context.agent.id,
        organization_id: context.organization?.id,
        conversation_segment: msg.content,
        segment_type: 'conversation',
        metadata: {
          role: msg.role,
          source: 'chat_interface',
          agent_name: context.agent.name,
          user_id: context.user.id,
          timestamp: new Date().toISOString()
        }
      }))

      // Add the AI response as a segment
      conversationSegments.push({
        agent_id: context.agent.id,
        organization_id: context.organization?.id,
        conversation_segment: aiMessage,
        segment_type: 'conversation',
        metadata: {
          role: 'assistant',
          source: 'chat_interface',
          agent_name: context.agent.name,
          user_id: context.user.id,
          timestamp: new Date().toISOString()
        }
      })

      // Store conversations with embeddings for RAG
      await this.supabase.from('conversation_embeddings').insert(conversationSegments)
      
      // Also store embeddings for better RAG performance
      try {
        const segmentsForEmbedding = conversationSegments.map(segment => ({
          text: segment.conversation_segment,
          type: 'conversation' as const,
          metadata: segment.metadata
        }))
        
        // Use the same Supabase client for embedding service
        const embeddingService = new (await import('./embeddingService')).EmbeddingService(this.supabase)
        await embeddingService.storeConversationEmbeddings(context.agent.id, segmentsForEmbedding)
      } catch (error) {
        console.warn('Failed to store embeddings (this is optional):', error)
      }

              // Extract and update business information
        try {
          const businessInfoService = new (await import('./businessInfoService')).BusinessInfoService(this.supabase)
          
          // Combine all user messages for business info extraction
          const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join(' ')
          
          if (userMessages.trim()) {
            const extractedInfo = await businessInfoService.extractBusinessInfo(context.organization.id, userMessages)
            
            if (extractedInfo.length > 0) {
              await businessInfoService.updateBusinessInfoFields(context.organization.id, extractedInfo)
              console.log(`Extracted ${extractedInfo.length} business info fields from conversation`)
            }
          }
        } catch (error) {
          console.warn('Failed to extract business info:', error)
        }

        // 🔄 WRITABLE MEMORY UPDATES - Process memory updates from conversation
        try {
          const embeddingService = new (await import('./embeddingService')).EmbeddingService(this.supabase)
          
          // Check if conversation contains memory updates (business info changes)
          const conversationText = messages.map(m => m.content).join(' ')
          const memoryUpdateKeywords = [
            'business hours changed', 'updated hours', 'new hours',
            'moved location', 'new address', 'relocated',
            'changed phone', 'new phone', 'updated contact',
            'price change', 'updated pricing', 'new rates',
            'service change', 'new service', 'updated service',
            'policy change', 'updated policy', 'new policy'
          ]

          const hasMemoryUpdate = memoryUpdateKeywords.some(keyword => 
            conversationText.toLowerCase().includes(keyword)
          )

          if (hasMemoryUpdate) {
            console.log('🔄 Detected potential memory update in conversation')
            
            // Extract the specific update information
            const updateInfo = await this.extractMemoryUpdate(conversationText, context.agent.id)
            
            if (updateInfo) {
              const result = await embeddingService.updateMemory(
                context.agent.id,
                updateInfo,
                'auto' // Use automatic conflict resolution
              )
              
              console.log(`Memory update result: ${result.action} (${result.memoryId})`)
              
              if (result.conflicts && result.conflicts.length > 0) {
                console.log(`Resolved ${result.conflicts.length} memory conflicts`)
              }
            }
          }
        } catch (error) {
          console.warn('Failed to process memory updates:', error)
        }
    } catch (error) {
      console.warn('Failed to store conversation:', error)
    }
  }

  /**
   * 🔍 Extract memory update information from conversation text
   */
  private async extractMemoryUpdate(conversationText: string, agentId: string): Promise<any> {
    try {
      const { default: OpenAI } = await import('openai')
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      const extractionPrompt = `
Analyze this conversation and extract any business information updates that should be stored in memory.

CONVERSATION: "${conversationText}"

Look for updates to:
- Business hours
- Location/address
- Contact information
- Pricing
- Services
- Policies
- Any other business details

If you find a clear business update, respond with JSON:
{
  "text": "extracted update text",
  "type": "knowledge",
  "reason": "what was updated",
  "confidence": 0.0-1.0
}

If no clear update is found, respond with: null
`

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: extractionPrompt }],
        temperature: 0.1,
        max_tokens: 300
      })

      const content = response.choices[0].message.content?.trim()
      
      if (content === 'null' || !content) {
        return null
      }

      try {
        const extracted = JSON.parse(content)
        return {
          text: extracted.text,
          type: extracted.type || 'knowledge',
          metadata: {
            source: 'chat_memory_update',
            agent_id: agentId,
            extracted_at: new Date().toISOString(),
            confidence: extracted.confidence || 0.8
          },
          reason: extracted.reason,
          confidence: extracted.confidence || 0.8
        }
      } catch (parseError) {
        console.warn('Failed to parse memory update extraction:', parseError)
        return null
      }

    } catch (error) {
      console.error('Error extracting memory update:', error)
      return null
    }
  }
}

// Export singleton instance
export const chatService = new ChatService() 