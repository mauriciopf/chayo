import { supabase } from '@/lib/supabase/client'
import { generateSlugFromName } from '@/lib/utils/text'
import { getFilledBusinessInfoFieldCount } from './businessInfoFieldService'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatResponse {
  aiMessage: string
  multipleChoices?: string[]
  allowMultiple?: boolean
  showOtherOption?: boolean
}

export interface ChatContext {
  user: any
  organization: any
  locale: string
}

export class OrganizationChatService {
  private supabaseClient: any

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient || supabase
  }
  
  /**
   * Process a chat request and generate AI response
   */
  async processChat(
    messages: ChatMessage[],
    locale: string = 'en'
  ): Promise<ChatResponse & { organization: any }> {
    try {
      // Get user and organization context
      const { data: { user }, error: authError } = await this.supabaseClient.auth.getUser()
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
      const { aiMessage, multipleChoices, allowMultiple, showOtherOption } = await this.generateAIResponse(messages, context)
      // Update WhatsApp trial status if mentioned
      await this.updateWhatsAppTrialStatus(aiMessage, context)
      return {
        aiMessage,
        multipleChoices,
        allowMultiple,
        showOtherOption,
        organization
      }
    } catch (error) {
      throw error
    }
  }
  public async getOrCreateOrganization(user: any): Promise<any> {
    // First, check if user already owns an organization
    const { data: ownedOrg, error: ownedOrgError } = await this.supabaseClient
      .from('organizations')
      .select('*')
      .eq('owner_id', user.id)
      .single()
    if (ownedOrg && !ownedOrgError) {
      // Check if user is in team_members, if not add them
      const { data: existingMember, error: memberCheckError } = await this.supabaseClient
        .from('team_members')
        .select('id')
        .eq('organization_id', ownedOrg.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()
      if (!existingMember && !memberCheckError) {
        await this.supabaseClient
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
    const { data: membership, error: membershipError } = await this.supabaseClient
      .from('team_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()
    if (membership && !membershipError) {
      // Get existing organization
      const { data: org, error: orgError } = await this.supabaseClient
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
    const name = `${emailPrefix}'s Organization`
    const slug = generateSlugFromName(name)
    const { data: newOrgId, error: orgError } = await this.supabaseClient
      .rpc('create_organization_with_owner', {
        org_name: name,
        org_slug: slug,
        owner_id: user.id
      })
    if (!orgError && newOrgId) {
      // Fetch the created organization
      const { data: newOrg, error: fetchError } = await this.supabaseClient
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
  public async generateAIResponse(messages: ChatMessage[], context: ChatContext): Promise<{ aiMessage: string; multipleChoices?: string[]; allowMultiple?: boolean; showOtherOption?: boolean }> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API key not set')
    }
    
    // Check if there are pending unanswered questions
    const { data: pendingQuestions } = await this.supabaseClient
      .from('business_info_fields')
      .select('question_template, field_name, field_type, multiple_choices, allow_multiple, show_other_option')
      .eq('organization_id', context.organization.id)
      .eq('is_answered', false)
      .limit(1)
    
    if (pendingQuestions && pendingQuestions.length > 0) {
      // Return the pending question instead of generating a new AI response
      const pendingQuestion = pendingQuestions[0]
      return {
        aiMessage: pendingQuestion.question_template,
        multipleChoices: pendingQuestion.multiple_choices || undefined,
        allowMultiple: pendingQuestion.allow_multiple || false,
        showOtherOption: pendingQuestion.show_other_option || false
      }
    }
    
    // Get the last user message for context
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || ''
    // Generate enhanced system prompt with training hints
    let systemPrompt: string
    let promptMetadata: any
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
    } catch (error) {
      console.warn('Failed to get enhanced system prompt, aborting chat:', error)
      return {
        aiMessage: "I'm sorry, but I couldn't retrieve your business knowledge at this time. Please try again later or contact support if the problem persists."
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
            aiMessage: "I apologize, but I'm currently experiencing high demand and cannot process your request right now. Please try again in a few minutes, or contact support if this issue persists."
          }
        } else if (openaiRes.status === 401) {
          console.error('OpenAI API key invalid:', errorData)
          return {
            aiMessage: "I apologize, but there's a configuration issue with my AI service. Please contact support for assistance."
          }
        } else {
          console.error('OpenAI API error:', errorData)
          return {
            aiMessage: "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment."
          }
        }
      } else {
        const data = await openaiRes.json()
        const aiMessage = data.choices?.[0]?.message?.content || ''
        
        // Parse multiple choice options if present
        const multipleChoiceData = this.parseMultipleChoiceData(aiMessage)
        
        // Only extract question if we successfully parsed multiple choice data
        const finalAiMessage = multipleChoiceData 
          ? this.extractQuestionFromMultipleChoice(aiMessage) 
          : aiMessage
        
        const result = {
          aiMessage: finalAiMessage,
          multipleChoices: multipleChoiceData?.options || undefined,
          allowMultiple: multipleChoiceData?.allowMultiple || false,
          showOtherOption: multipleChoiceData?.showOtherOption || false
        }
        
        // Store the question if it contains a question (multiple choice or regular)
        if (this.containsQuestion(aiMessage)) {
          await this.storeAIGeneratedQuestion(context.organization.id, aiMessage, multipleChoiceData)
        }
        
        return result
      }
    } catch (error) {
      console.error('Error calling OpenAI API:', error)
      return {
        aiMessage: "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment."
      }
    }
  }

  /**
   * Parse multiple choice data from AI response
   */
  private parseMultipleChoiceData(aiMessage: string): { options: string[]; allowMultiple: boolean; showOtherOption: boolean } | null {
    // Check if this looks like a multiple choice response
    const hasQuestion = aiMessage.includes('QUESTION:')
    const hasOptions = aiMessage.includes('OPTIONS:')
    
    if (!hasQuestion || !hasOptions) {
      return null
    }
    
    const optionsMatch = aiMessage.match(/OPTIONS:\s*(.+?)(?=\n|MULTIPLE:|OTHER:|$)/i)
    if (!optionsMatch) {
      return null
    }

    const optionsText = optionsMatch[1].trim()
    
    // Parse JSON array format ONLY
    let options: string[] = []
    
    try {
      options = JSON.parse(optionsText)
    } catch (e) {
      return null
    }
    
    if (!Array.isArray(options) || options.length < 2) {
      return null
    }
    
    // Limit to reasonable number of options
    if (options.length > 10) {
      return null
    }

    // Parse MULTIPLE flag
    const multipleMatch = aiMessage.match(/MULTIPLE:\s*(true|false)/i)
    const allowMultiple = multipleMatch ? multipleMatch[1].toLowerCase() === 'true' : false

    // Parse OTHER flag
    const otherMatch = aiMessage.match(/OTHER:\s*(true|false)/i)
    const showOtherOption = otherMatch ? otherMatch[1].toLowerCase() === 'true' : false
    
    return {
      options,
      allowMultiple,
      showOtherOption
    }
  }

  /**
   * Check if a message contains a question
   */
  private containsQuestion(message: string): boolean {
    // Check for question mark or QUESTION: format
    return message.includes('?') || message.includes('QUESTION:')
  }

  /**
   * Store AI-generated questions in the business_info_fields table
   */
  private async storeAIGeneratedQuestion(organizationId: string, aiMessage: string, multipleChoiceData: { options: string[]; allowMultiple: boolean; showOtherOption: boolean } | null): Promise<void> {
    try {
      // Extract the question text
      const questionText = this.extractQuestionFromMultipleChoice(aiMessage)
      
      // Generate a field name based on the question content
      const fieldName = this.generateFieldNameFromQuestion(questionText)
      
      // Check if this question already exists
      const { data: existingQuestion } = await this.supabaseClient
        .from('business_info_fields')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('field_name', fieldName)
        .eq('is_answered', false)
        .single()
      
      if (existingQuestion) {
        return // Question already exists, don't duplicate
      }
      
      // Store the question in business_info_fields table
      const { error } = await this.supabaseClient
        .from('business_info_fields')
        .insert({
          organization_id: organizationId,
          field_name: fieldName,
          field_type: multipleChoiceData ? 'multiple_choice' : 'text',
          is_answered: false,
          question_template: questionText,
          multiple_choices: multipleChoiceData?.options || null
        })
      
      if (error) {
        console.error('Error storing AI-generated question:', error)
      } else {
        console.log(`📝 Stored AI-generated question: ${fieldName}`)
      }
    } catch (error) {
      console.warn('Failed to store AI-generated question:', error)
    }
  }

  /**
   * Generate a field name from a question text
   */
  private generateFieldNameFromQuestion(questionText: string): string {
    // Convert question to a field name
    const fieldName = questionText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/^(what|how|which|when|where|why|who)\s+/, '') // Remove question words
      .substring(0, 50) // Limit length
    
    return fieldName || 'custom_question'
  }

  /**
   * Extract the question part from a multiple choice response
   */
  private extractQuestionFromMultipleChoice(aiMessage: string): string {
    // First try to extract the question using the QUESTION: field
    const questionMatch = aiMessage.match(/QUESTION:\s*(.+?)(?:\n|OPTIONS:)/i)
    if (questionMatch) {
      return questionMatch[1].trim()
    }
    
    // Fallback: remove all the multiple choice formatting and return just the question
    let cleanedMessage = aiMessage
      .replace(/QUESTION:\s*.+?(?=\n|OPTIONS:|$)/gi, '') // Remove QUESTION section
      .replace(/OPTIONS:\s*.+?(?=\n|MULTIPLE:|OTHER:|$)/gi, '') // Remove OPTIONS section
      .replace(/MULTIPLE:\s*(true|false)/gi, '') // Remove MULTIPLE flag
      .replace(/OTHER:\s*(true|false)/gi, '') // Remove OTHER flag
      .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
      .trim()
    
    // If the cleaned message is empty or just whitespace, return a default message
    if (!cleanedMessage || cleanedMessage.length === 0) {
      return "Please select an option:"
    }
    
    return cleanedMessage
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
        
        // Extract business info from user messages
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