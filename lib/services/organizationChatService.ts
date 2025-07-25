import { supabase } from '@/lib/supabase/client'
import { getFilledBusinessInfoFieldCount } from './businessInfoFieldService'

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
  
  /**
   * Process a chat request and generate AI response
   */
  async processChat(
    messages: ChatMessage[],
    locale: string = 'en'
  ): Promise<ChatResponse & { organization: any }> {
    try {
      // Get user and organization context
      const { data: { user }, error: authError } = await supabase.auth.getUser()
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
        usingRAG,
        organization
      }
    } catch (error) {
      throw error
    }
  }
  public async getOrCreateOrganization(user: any): Promise<any> {
    // First, check if user already owns an organization
    const { data: ownedOrg, error: ownedOrgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', user.id)
      .single()
    if (ownedOrg && !ownedOrgError) {
      // Check if user is in team_members, if not add them
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('team_members')
        .select('id')
        .eq('organization_id', ownedOrg.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()
      if (!existingMember && !memberCheckError) {
        await supabase
          .from('team_members')
          .insert({
            organization_id: ownedOrg.id,
            user_id: user.id,
            role: 'owner',
            status: 'active'
          })
      }
      return ownedOrg
    }
    // If no owned organization, check for team membership
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()
    if (membership && !membershipError) {
      // Get existing organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', membership.organization_id)
        .single()
      if (!orgError && org) {
        return org
      }
    }
    // Only create new organization if user has no existing organization or membership
    const emailPrefix = user.email?.split('@')[0] || 'user'
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const slug = `${emailPrefix.replace(/[^a-zA-Z0-9]/g, '')}-${randomSuffix}`
    const name = `${emailPrefix}'s Organization`
    const { data: newOrgId, error: orgError } = await supabase
      .rpc('create_organization_with_owner', {
        org_name: name,
        org_slug: slug,
        owner_id: user.id
      })
    if (!orgError && newOrgId) {
      // Fetch the created organization
      const { data: newOrg, error: fetchError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', newOrgId)
        .single()
      if (fetchError || !newOrg) {
        throw new Error(`Failed to fetch created organization: ${fetchError?.message || 'Unknown error'}`)
      }
      return newOrg
    } else {
      throw new Error(`Failed to create organization: ${orgError?.message || 'Unknown error'}`)
    }
  }
  public async generateAIResponse(messages: ChatMessage[], context: ChatContext): Promise<{ aiMessage: string; usingRAG: boolean }> {
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
      const enhancedService = new EnhancedOrganizationSystemPromptService()
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
  public async storeConversation(messages: ChatMessage[], aiMessage: string, context: ChatContext): Promise<void> {
    try {
      const { conversationStorageService } = await import('./conversationStorageService')
      await conversationStorageService.storeConversationExchange(
        context.organization.id,
        messages[messages.length - 1]?.content || '',
        aiMessage,
        {
          source: 'dashboard_chat',
          user_id: context.user.id,
          organization_name: context.organization.name
        }
      )
      try {
        const businessInfoService = new (await import('./businessInfoService')).BusinessInfoService()
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
      try {
        const { embeddingService } = await import('./embeddingService')
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
          const updateInfo = await this.extractMemoryUpdate(conversationText, context.organization.id)
          if (updateInfo) {
            const result = await embeddingService.updateMemory(
              context.organization.id,
              updateInfo,
              'auto'
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