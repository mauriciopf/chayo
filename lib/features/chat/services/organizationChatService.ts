import { supabase } from '@/lib/shared/supabase/client'
import { generateSlugFromName } from '@/lib/shared/utils/text'
import { getFilledBusinessInfoFieldCount } from '../../organizations/services/businessInfoFieldService'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatResponse {
  aiMessage: string
  multipleChoices?: string[]
  allowMultiple?: boolean
  showOtherOption?: boolean
  setupCompleted?: boolean
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
      
      // Initialize integrated onboarding service
      const { IntegratedOnboardingService } = await import('../../onboarding/services/integratedOnboardingService')
      const onboardingService = new IntegratedOnboardingService()
      
      // Initialize onboarding if not already done
      await onboardingService.initializeOnboarding(organization.id)
      
      // Get current onboarding progress
      const progress = await onboardingService.getOnboardingProgress(organization.id)
      
      // For initial messages (empty messages array), check if onboarding is completed
      if (messages.length === 0) {
        console.log('🔍 Processing initial message - onboarding completed:', progress.isCompleted)
        // If onboarding is completed, just generate a greeting
        if (progress.isCompleted) {
          const aiResponse = await this.generateAIResponse([], context)
          return {
            aiMessage: aiResponse.aiMessage,
            multipleChoices: aiResponse.multipleChoices,
            allowMultiple: aiResponse.allowMultiple,
            showOtherOption: aiResponse.showOtherOption,
            organization,
            setupCompleted: true
          }
        }
        
        // If onboarding is not completed, check for existing pending questions first
        const existingQuestion = await onboardingService.getNextQuestion(organization.id)
        
        if (existingQuestion) {
          // Return the existing pending question instead of generating a new one
          console.log('🔍 Returning existing pending question:', existingQuestion.question_template)
          return {
            aiMessage: existingQuestion.question_template,
            multipleChoices: existingQuestion.multiple_choices || undefined,
            allowMultiple: existingQuestion.allow_multiple || false,
            showOtherOption: existingQuestion.show_other || false,
            organization,
            setupCompleted: false
          }
        }
        
        // Only generate a new question if no pending questions exist
        console.log('🔍 No pending questions found, generating new onboarding question')
        const aiResponse = await this.generateAIResponse([], context)
        
        // Question storage is now handled automatically in generateAIResponse
        
        return {
          aiMessage: aiResponse.aiMessage,
          multipleChoices: aiResponse.multipleChoices,
          allowMultiple: aiResponse.allowMultiple,
          showOtherOption: aiResponse.showOtherOption,
          organization,
          setupCompleted: progress.isCompleted
        }
      }
      
      // Handle user responses to onboarding questions
      const userMessages = messages.filter(m => m.role === 'user')
      const assistantMessages = messages.filter(m => m.role === 'assistant')
      
      // If this is a user response to an onboarding question (has user message and assistant message)
      if (userMessages.length > 0 && assistantMessages.length > 0 && !progress.isCompleted) {
        // Process the user's response to the current onboarding question
        const lastUserMessage = userMessages[userMessages.length - 1].content
        const lastAssistantMessage = assistantMessages[assistantMessages.length - 1].content
        
        // Process the response and get the next question
        const processingResult = await onboardingService.processAIResponse(
          organization.id,
          lastAssistantMessage, // The question that was asked
          lastUserMessage // The user's response
        )
        
        // Generate the next question dynamically from AI
        const aiResponse = await this.generateAIResponse(messages, context)
        
        // Question storage is now handled automatically in generateAIResponse
        
        return {
          aiMessage: aiResponse.aiMessage,
          multipleChoices: aiResponse.multipleChoices,
          allowMultiple: aiResponse.allowMultiple,
          showOtherOption: aiResponse.showOtherOption,
          organization,
          setupCompleted: aiResponse.aiMessage.includes('STATUS: setup_complete')
        }
      }
      
      // If onboarding is completed, proceed with normal chat
      if (progress.isCompleted) {
        const { aiMessage, multipleChoices, allowMultiple, showOtherOption } = await this.generateAIResponse(messages, context)
        return {
          aiMessage,
          multipleChoices,
          allowMultiple,
          showOtherOption,
          organization,
          setupCompleted: true
        }
      }
      
      // Get the next question to ask
      const nextQuestion = await onboardingService.getNextQuestion(organization.id)
      
      if (nextQuestion) {
        // Return the next question instead of generating a new AI response
        return {
          aiMessage: nextQuestion.question_template,
          multipleChoices: nextQuestion.multiple_choices || undefined,
          allowMultiple: nextQuestion.allow_multiple || false,
          showOtherOption: nextQuestion.show_other || false,
          organization,
          setupCompleted: false
        }
      }

      // Generate AI response only if no pending questions
      const { aiMessage, multipleChoices, allowMultiple, showOtherOption } = await this.generateAIResponse(messages, context)
      
      // Process the AI response for onboarding progress
      const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || ''
      const processingResult = await onboardingService.processAIResponse(
        organization.id,
        aiMessage,
        lastUserMessage
      )
      
      // Update WhatsApp trial status if mentioned
      await this.updateWhatsAppTrialStatus(aiMessage, context)
      
      return {
        aiMessage,
        multipleChoices,
        allowMultiple,
        showOtherOption,
        organization,
        setupCompleted: processingResult.isCompleted
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
    
    // Note: Pending questions are handled by validateAndUpdatePendingQuestions in processChat
    // This method should only generate new AI responses, not check for pending questions
    
                // Get the last user message for context
      const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || ''
      
      // Generate enhanced system prompt with training hints
      let systemPrompt: string
      try {
        // Get training context from embedding service
        let trainingContext = ''
        try {
          const { embeddingService } = await import('../../../shared/services/embeddingService')
          const conversationText = messages.map(m => m.content).join(' ')
          const memory = await embeddingService.getBusinessKnowledgeSummary(context.organization.id)
          if (memory) {
            trainingContext = memory
          }
        } catch (error) {
          console.warn('Failed to get training context:', error)
        }

        // Use YAML loader for system prompts
        const { YamlPromptLoader } = await import('./systemPrompt/YamlPromptLoader')
        // Check if setup is completed by getting the organization's setup status
        const { IntegratedOnboardingService } = await import('../../onboarding/services/integratedOnboardingService')
        const onboardingService = new IntegratedOnboardingService()
        const progress = await onboardingService.getOnboardingProgress(context.organization.id)
        systemPrompt = await YamlPromptLoader.buildSystemPrompt(context.locale, trainingContext, progress.isCompleted, progress.currentStage)
      } catch (error) {
        console.warn('Failed to get enhanced system prompt, aborting chat:', error)
        return {
          aiMessage: "I'm sorry, but I couldn't retrieve your business knowledge at this time. Please try again later or contact support if the problem persists."
        }
      }
      
      // Prepare messages with full conversation history
      const chatMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.filter(m => m.role === 'user' || m.role === 'assistant')
      ]
    try {
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: chatMessages,
          temperature: 0.9,
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
        const aiResponse = data.choices?.[0]?.message?.content || ''
        
        // Try to parse as JSON first (structured response)
        let businessQuestion: any = null
        let aiMessage = aiResponse
        let multipleChoices: string[] | undefined = undefined
        let allowMultiple = false
        let showOtherOption = false
        
        try {
          // Attempt to parse the response as JSON
          const jsonResponse = JSON.parse(aiResponse.trim())
          
          if (jsonResponse.question_template && jsonResponse.field_name && jsonResponse.field_type) {
            // This is a structured question response
            businessQuestion = {
              question_template: jsonResponse.question_template,
              field_name: jsonResponse.field_name,
              field_type: jsonResponse.field_type,
              multiple_choices: jsonResponse.multiple_choices
            }
            
            aiMessage = jsonResponse.question_template
            
            if (jsonResponse.field_type === 'multiple_choice' && jsonResponse.multiple_choices) {
              multipleChoices = jsonResponse.multiple_choices
              allowMultiple = false // Default for now
              showOtherOption = jsonResponse.multiple_choices.includes('Other')
            }
          }
        } catch (error) {
          // Not JSON or invalid JSON - treat as regular text response
          aiMessage = aiResponse
        }
        
        const result = {
          aiMessage: aiMessage,
          multipleChoices: multipleChoices,
          allowMultiple: allowMultiple,
          showOtherOption: showOtherOption
        }
        
        // Store the question if we have a valid business question
        if (businessQuestion) {
          const { businessInfoService } = await import('../../organizations/services/businessInfoService')
          await businessInfoService.storeBusinessQuestion(context.organization.id, businessQuestion)
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
   * Validate and update any pending questions before generating new AI response
   * This prevents race conditions where questions might be marked as answered after the response is generated
   * Returns the pending question if it wasn't answered, null otherwise
   */
  private async validateAndUpdatePendingQuestions(messages: ChatMessage[], context: ChatContext): Promise<any | null> {
    try {
      const businessInfoService = new (await import('../../organizations/services/businessInfoService')).BusinessInfoService()
      
      // Get the pending unanswered question
      const { data: pendingQuestions } = await this.supabaseClient
        .from('business_info_fields')
        .select('id, question_template, field_name, field_type, multiple_choices, allow_multiple, show_other_option, is_answered')
        .eq('organization_id', context.organization.id)
        .eq('is_answered', false)
        .order('created_at', { ascending: true })
        .limit(1)

      if (pendingQuestions && pendingQuestions.length > 0) {
        const pendingQuestion = pendingQuestions[0]
        const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join(' ')
        
        if (userMessages.trim()) {
          // Check if the pending question was answered
          const validationResult = await businessInfoService.validateAnswerWithAI(
            userMessages, 
            pendingQuestion.question_template
          )
          
          if (validationResult.answered && validationResult.answer && validationResult.confidence) {
            // Update the question as answered
            await businessInfoService.updateQuestionAsAnswered(
              context.organization.id,
              pendingQuestion.field_name,
              validationResult.answer,
              validationResult.confidence
            )
            // Question was answered, return null
            return null
          }
        }
        
        // Question wasn't answered, return the pending question
        return pendingQuestion
      }
      
      return null
    } catch (error) {
      return null
    }
  }

  public async storeConversation(messages: ChatMessage[], aiMessage: string, context: ChatContext): Promise<void> {
    try {
      const { conversationStorageService } = await import('../../../shared/services/conversationStorageService')
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
      
      // 🚀 NEW: AI-driven relevance filtering for embedding storage
      try {
        const { businessInfoService } = await import('../../organizations/services/businessInfoService')
        const { embeddingService } = await import('../../../shared/services/embeddingService')
        
        const userMessage = messages[messages.length - 1]?.content || ''
        
        // Evaluate relevance of both user and AI messages
        const [userRelevant, aiRelevant] = await Promise.all([
          userMessage ? businessInfoService.isBusinessRelevantInformation(userMessage, 'user', 'embedding_storage') : false,
          aiMessage ? businessInfoService.isBusinessRelevantInformation(aiMessage, 'ai', 'embedding_storage') : false
        ])
        
        // Store relevant conversations for embedding/RAG
        if (userRelevant || aiRelevant) {
          const conversationText = messages.map(m => m.content).join(' ')
          
          // Use AI to dynamically detect if this conversation contains business information updates
          const updateInfo = await this.extractMemoryUpdate(conversationText, context.organization.id)
          
          if (updateInfo) {
            const result = await embeddingService.updateMemory(
              context.organization.id,
              updateInfo,
              'auto'
            )
            console.log('📚 Stored relevant business conversation for embeddings')
          }
        } else {
          console.log('⏭️ Skipped storing conversation - not business relevant')
        }
      } catch (error) {
        console.warn('Error in relevance filtering for embeddings:', error)
        // Fallback to storing everything if evaluation fails
      }
    } catch (error) {
      // Silent error handling
    }
  }


  private async extractMemoryUpdate(conversationText: string, organizationId: string): Promise<any> {
    try {
      const { default: OpenAI } = await import('openai')
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      // Use simple memory extraction prompt
      const extractionPrompt = `Analyze this conversation and determine if it contains any business information updates that should be stored in the AI's memory.

CONVERSATION: "${conversationText}"

Consider the following types of business updates:
- Business hours, operating schedule, or availability changes
- Location, address, or service area updates
- Contact information (phone, email, website) changes
- Pricing, rates, or cost updates
- New or modified services offered
- Policy changes (returns, refunds, appointments, etc.)
- Business name or branding updates
- Staff or team changes
- Equipment or technology updates
- Any other business-relevant information that customers should know

IMPORTANT: Only extract information that is:
1. Clearly stated as a change or update
2. Specific and actionable
3. Relevant to customers or business operations
4. Not just general conversation or questions

If you find a clear business update, respond with ONLY valid JSON (no markdown formatting, no backticks):
{
  "text": "the specific updated information in a clear, concise format",
  "type": "knowledge",
  "reason": "brief description of what was updated",
  "confidence": 0.0-1.0 (how confident you are this is an actual update)
}

If no clear business update is found, respond with: null`

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

      // Clean the content to handle markdown code blocks
      let cleanedContent = content
      if (content.includes('```json')) {
        cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      } else if (content.includes('```')) {
        cleanedContent = content.replace(/```\n?/g, '').trim()
      }

      try {
        const extracted = JSON.parse(cleanedContent)
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
        return null
      }

    } catch (error) {
      return null
    }
  }
} 