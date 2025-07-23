import { createClient } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatResponse {
  aiMessage: string
  usingRAG: boolean
}

export interface ChatContext {
  user: any
  organization: any
  locale: string
}

export class OrganizationChatService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  /**
   * Process a chat request and generate AI response
   */
  async processChat(
    messages: ChatMessage[],
    locale: string = 'en'
  ): Promise<ChatResponse> {
    try {
      // Get user and organization context
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Authentication required')
      }

      // Get or create organization
      const organization = await this.getOrCreateOrganization(user)
      
      const context: ChatContext = {
        user,
        organization,
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
        usingRAG
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
      const { EnhancedOrganizationSystemPromptService } = await import('./systemPrompt/EnhancedOrganizationSystemPromptService')
      const enhancedService = new EnhancedOrganizationSystemPromptService(this.supabase)
      
      const result = await enhancedService.generateEnhancedPrompt(
        context.organization.id, // Pass organization ID
        messages,
        lastUserMessage,
        context.locale
      )

      systemPrompt = result.finalPrompt
      promptMetadata = result.metadata
      usingRAG = result.metadata.usingRAG
    } catch (error) {
      console.warn('Failed to get enhanced system prompt, aborting chat:', error)
      return {
        aiMessage: "I'm sorry, but I couldn't retrieve your business knowledge at this time. Please try again later or contact support if the problem persists.",
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
   * Update WhatsApp trial status if mentioned
   */
  private async updateWhatsAppTrialStatus(aiMessage: string, context: ChatContext): Promise<void> {
    // Check if WhatsApp trial was mentioned
    const whatsappTrialMentioned = aiMessage.toLowerCase().includes('whatsapp') && 
                                  aiMessage.toLowerCase().includes('trial') && 
                                  aiMessage.toLowerCase().includes('3-day')

    // Update agent's business constraints if WhatsApp trial was mentioned
    // This logic needs to be re-evaluated as agent is removed from context
    // For now, we'll keep it as is, but it might need adjustment depending on new structure
    // if (whatsappTrialMentioned && context.agent.business_constraints && !context.agent.business_constraints.whatsapp_trial_mentioned) {
    //   try {
    //     const updatedConstraints = {
    //       ...context.agent.business_constraints,
    //       whatsapp_trial_mentioned: true
    //     }
        
    //     await this.supabase
    //       .from('agents')
    //       .update({ business_constraints: updatedConstraints })
    //       .eq('id', context.agent.id)
    //   } catch (error) {
    //     console.warn('Failed to update agent WhatsApp trial status:', error)
    //   }
    // }
  }

  /**
   * Store conversation for RAG
   */
  private async storeConversation(messages: ChatMessage[], aiMessage: string, context: ChatContext): Promise<void> {
    try {
      // Create conversation segments from the messages
      const conversationSegments = messages.map(msg => ({
        organization_id: context.organization?.id,
        conversation_segment: msg.content,
        segment_type: 'conversation',
        metadata: {
          role: msg.role,
          source: 'chat_interface',
          user_id: context.user.id,
          timestamp: new Date().toISOString()
        }
      }))

      // Add the AI response as a segment
      conversationSegments.push({
        organization_id: context.organization?.id,
        conversation_segment: aiMessage,
        segment_type: 'conversation',
        metadata: {
          role: 'assistant',
          source: 'chat_interface',
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
        
        const { embeddingService } = await import('./embeddingService')
        await embeddingService.storeConversationEmbeddings(context.organization.id, segmentsForEmbedding)
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
          const { embeddingService } = await import('./embeddingService')
          
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
            const updateInfo = await this.extractMemoryUpdate(conversationText, context.organization.id) // Pass organization ID
            
            if (updateInfo) {
              const result = await embeddingService.updateMemory(
                context.organization.id, // Pass organization ID
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
  private async extractMemoryUpdate(conversationText: string, organizationId: string): Promise<any> {
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
            organization_id: organizationId,
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