import { supabase } from '@/lib/shared/supabase/client'
import { generateSlugFromName } from '@/lib/shared/utils/text'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatResponse {
  aiMessage: string
  multipleChoices?: string[]
  allowMultiple?: boolean
  setupCompleted?: boolean
}

export interface ChatContext {
  user: any
  organization: any
  locale: string
}

export type OnboardingState = 
  | 'NOT_STARTED'      // Fresh user, no questions yet
  | 'PROCESSING'       // Handle onboarding - check pending, process responses, generate questions
  | 'COMPLETED'        // All onboarding done, normal chat mode

export class OrganizationChatService {
  private supabaseClient: any

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient || supabase
  }

  /**
   * Determine the current onboarding state for clear decision making
   */
  private async determineOnboardingState(
    organizationId: string, 
    messages: ChatMessage[]
  ): Promise<OnboardingState> {
    // Initialize onboarding service
    const { IntegratedOnboardingService } = await import('../../onboarding/services/integratedOnboardingService')
    const onboardingService = new IntegratedOnboardingService()

    // 1. Check completion status first (simplest check)
    const progress = await onboardingService.getOnboardingProgress(organizationId)
    if (progress.isCompleted) {
      return 'COMPLETED'
    }

    // 2. Check if this is a fresh start (no questions exist and no user messages)
    const nextQuestion = await onboardingService.getNextQuestion(organizationId)
    if (!nextQuestion && messages.length === 0) {
      return 'NOT_STARTED'  // Fresh user, needs first question
    }

    // 3. Everything else is processing - either has pending questions or user interactions
    return 'PROCESSING'  // Handle pending questions, responses, and generation
  }

  /**
   * Handle NOT_STARTED state - generate first onboarding question
   */
  private async handleNotStarted(context: ChatContext): Promise<ChatResponse> {
    console.log('🏁 State: NOT_STARTED - Generating first onboarding question')
    const aiResponse = await this.generateAndStoreAIResponse([], context, 'onboarding')
    
    console.log('🔍 AI Response received:', {
      aiMessage: aiResponse.aiMessage?.substring(0, 100) + '...',
      aiMessageLength: aiResponse.aiMessage?.length,
      hasMultipleChoices: !!aiResponse.multipleChoices,
      allowMultiple: aiResponse.allowMultiple
    })
    
    if (!aiResponse.aiMessage || aiResponse.aiMessage.trim() === '') {
      console.error('❌ Empty aiMessage returned from generateAndStoreAIResponse!')
    }
    
    return {
      aiMessage: aiResponse.aiMessage,
      multipleChoices: aiResponse.multipleChoices,
      allowMultiple: aiResponse.allowMultiple,
      setupCompleted: false
    }
  }

  /**
   * Handle PROCESSING state - onboarding questions with intelligent flow
   */
  private async handleProcessing(messages: ChatMessage[], context: ChatContext): Promise<ChatResponse> {
    console.log('🔄 State: PROCESSING - Onboarding questions with intelligent flow')
    
    // Initialize onboarding service (needed for onboarding questions)
    const { IntegratedOnboardingService } = await import('../../onboarding/services/integratedOnboardingService')
    const onboardingService = new IntegratedOnboardingService()

    // Check if there's a pending onboarding question
    const existingQuestion = await onboardingService.getNextQuestion(context.organization.id)
    
    if (existingQuestion) {
      console.log('📋 Found existing pending onboarding question')
      
      // Check if user sent a message (responding to the pending question)
      const userMessages = messages.filter(m => m.role === 'user')
      
      if (userMessages.length > 0) {
        console.log('💬 User responded to pending onboarding question - processing response and generating next')
        
        // Process the user's response to the pending question
        const assistantMessages = messages.filter(m => m.role === 'assistant')
        
        if (assistantMessages.length > 0) {
          const lastUserMessage = userMessages[userMessages.length - 1].content
          const lastAssistantMessage = assistantMessages[assistantMessages.length - 1].content
          
          // Process the response with backend message (includes STATUS signals)
          await onboardingService.processAIResponse(
            context.organization.id,
            lastAssistantMessage,
            lastUserMessage
          )
        }

        // Generate the next onboarding question
        const aiResponse = await this.generateAndStoreAIResponse(messages, context, 'onboarding')
        
        // If there's a new response with status signals, process it with the onboarding service
        if (aiResponse.backendMessage && aiResponse.statusSignal) {
          // Create a fake assistant message for processing
          const processedResponse = await onboardingService.processAIResponse(
            context.organization.id,
            aiResponse.backendMessage, // Use backend message with STATUS signals
            userMessages[userMessages.length - 1]?.content || ''
          )
        }
        
        // Check if setup is completed based on status signal or backend message
        const setupCompleted = aiResponse.statusSignal === 'setup_complete' || 
                               (aiResponse.backendMessage?.includes('STATUS: setup_complete') ?? false)
        
        return {
          aiMessage: aiResponse.aiMessage, // Clean user-facing message
          multipleChoices: aiResponse.multipleChoices,
          allowMultiple: aiResponse.allowMultiple,
          setupCompleted
        }
      } else {
        console.log('⏳ No user response yet - returning existing pending onboarding question')
        
        // No user message, just return the existing pending question
        return {
          aiMessage: existingQuestion.question_template,
          multipleChoices: existingQuestion.multiple_choices || undefined,
          allowMultiple: existingQuestion.allow_multiple || false,
          setupCompleted: false
        }
      }
    } else {
      console.log('🆕 No pending onboarding question - generating new onboarding question')
      
      // No pending question, generate a new onboarding question
      const aiResponse = await this.generateAndStoreAIResponse(messages, context, 'onboarding')
      
      // If there's a new response with status signals, process it with the onboarding service
      if (aiResponse.backendMessage && aiResponse.statusSignal) {
        // Get the last user message for processing
        const userMessages = messages.filter(m => m.role === 'user')
        const lastUserMessage = userMessages[userMessages.length - 1]?.content || ''
        
        // Process the AI response with backend message (includes STATUS signals)
        await onboardingService.processAIResponse(
          context.organization.id,
          aiResponse.backendMessage,
          lastUserMessage
        )
      }
      
      // Check if setup is completed based on status signal or backend message
      const setupCompleted = aiResponse.statusSignal === 'setup_complete' || 
                             (aiResponse.backendMessage?.includes('STATUS: setup_complete') ?? false)
      
      return {
        aiMessage: aiResponse.aiMessage, // Clean user-facing message
        multipleChoices: aiResponse.multipleChoices,
        allowMultiple: aiResponse.allowMultiple,
        setupCompleted
      }
    }
  }

  /**
   * Handle COMPLETED state - business operations mode with intelligent flow
   */
  private async handleCompleted(messages: ChatMessage[], context: ChatContext): Promise<ChatResponse> {
    console.log('✅ State: COMPLETED - Business operations mode with intelligent flow')
    
    // Use BusinessInfoService for stage-agnostic pending question management
    const { businessInfoService } = await import('../../organizations/services/businessInfoService')
    
    // Check if there's any pending business question (no stage logic needed)
    const existingQuestion = await businessInfoService.getNextPendingQuestion(context.organization.id)
    
    if (existingQuestion) {
      console.log('📋 Found existing pending business question')
      
      // Check if user sent a message (responding to the pending question)
      const userMessages = messages.filter(m => m.role === 'user')
      
      if (userMessages.length > 0) {
        console.log('💬 User responded to pending business question - processing response and generating next')
        
        // For business mode, we can process the response directly
        // TODO: Add business-specific response processing if needed
        
        // Generate the next business question or response
        const aiResponse = await this.generateAndStoreAIResponse(messages, context, 'business')
        
        return {
          aiMessage: aiResponse.aiMessage,
          multipleChoices: aiResponse.multipleChoices,
          allowMultiple: aiResponse.allowMultiple,
          setupCompleted: true // Always true in business mode
        }
      } else {
        console.log('⏳ No user response yet - returning existing pending business question')
        
        // No user message, just return the existing pending question
        return {
          aiMessage: existingQuestion.question_template,
          multipleChoices: existingQuestion.multiple_choices || undefined,
          allowMultiple: existingQuestion.field_type === 'multiple_choice', // Allow multiple for business multiple choice questions
          setupCompleted: true // Always true in business mode
        }
      }
    } else {
      console.log('🆕 No pending business question - generating business conversation')
      
      // No pending question, generate business-focused conversation
      const aiResponse = await this.generateAndStoreAIResponse(messages, context, 'business')
      
      return {
        aiMessage: aiResponse.aiMessage,
        multipleChoices: aiResponse.multipleChoices,
        allowMultiple: aiResponse.allowMultiple,
        setupCompleted: true // Always true in business mode
      }
    }
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
      
      // Determine current state FIRST without modifying anything
      const state = await this.determineOnboardingState(organization.id, messages)
      
      // THEN initialize onboarding if needed (only for NOT_STARTED state)
      if (state === 'NOT_STARTED') {
        const { IntegratedOnboardingService } = await import('../../onboarding/services/integratedOnboardingService')
        const onboardingService = new IntegratedOnboardingService()
        await onboardingService.initializeOnboarding(organization.id)
        console.log('🏗️ Initialized onboarding for NOT_STARTED state')
      }
      console.log(`🎯 Current onboarding state: ${state}`)
      
      // Handle each state with dedicated methods
      let response: ChatResponse
      
      switch (state) {
        case 'NOT_STARTED':
          response = await this.handleNotStarted(context)
          break
          
        case 'PROCESSING':
          response = await this.handleProcessing(messages, context)
          break
          
        case 'COMPLETED':
          response = await this.handleCompleted(messages, context)
          break
          
        default:
          throw new Error(`Unknown onboarding state: ${state}`)
      }
      
      // Update WhatsApp trial status if mentioned (use backend message for full context)
      const messageForAnalysis = (response as any).backendMessage || response.aiMessage
      if (messageForAnalysis) {
        await this.updateWhatsAppTrialStatus(messageForAnalysis, context)
      }
      
      return {
        ...response,
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

  /**
   * Build enhanced system prompt with training context and onboarding progress
   */
  private async buildSystemPrompt(context: ChatContext, promptType: 'onboarding' | 'business'): Promise<string> {
    // Get training context from embedding service
    let trainingContext = ''
    try {
      const { embeddingService } = await import('../../../shared/services/embeddingService')
      const memory = await embeddingService.getBusinessKnowledgeSummary(context.organization.id)
      if (memory) {
        trainingContext = memory
      }
    } catch (error) {
      console.warn('Failed to get training context:', error)
    }

    // Use YAML loader for system prompts
    const { YamlPromptLoader } = await import('./systemPrompt/YamlPromptLoader')
    
    // Determine if setup is completed based on promptType
    // - 'onboarding' promptType: Check actual onboarding progress
    // - 'business' promptType: Setup is considered completed (business operations mode)
    let isSetupCompleted: boolean
    let currentStage: string | undefined
    
    if (promptType === 'business') {
      isSetupCompleted = true
      currentStage = undefined // Business mode doesn't have stages
    } else {
      // For onboarding, always use onboarding prompt regardless of completion status
      // We still get the progress for currentStage context
      const { IntegratedOnboardingService } = await import('../../onboarding/services/integratedOnboardingService')
      const onboardingService = new IntegratedOnboardingService()
      const progress = await onboardingService.getOnboardingProgress(context.organization.id)
      isSetupCompleted = false // Force onboarding prompt when promptType is 'onboarding'
      currentStage = progress.currentStage
    }
    
    console.log(`🎯 Using ${promptType} system prompt - isSetupCompleted: ${isSetupCompleted}`)
    return await YamlPromptLoader.buildSystemPrompt(context.locale, trainingContext, isSetupCompleted, currentStage)
  }

  /**
   * Make OpenAI API call using centralized service
   */
  private async callOpenAI(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
    const { openAIService } = await import('@/lib/shared/services/OpenAIService')
    
    // Prepare messages with full conversation history
    const chatMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    ]

    return await openAIService.callChatCompletion(chatMessages, {
      model: 'gpt-4o-mini',
      temperature: 0.9,
      maxTokens: 1000
    })
  }

  /**
   * Parse AI response and extract structured data
   */
  private parseAIResponse(aiResponse: string): {
    aiMessage: string;
    businessQuestion: any | null;
    multipleChoices?: string[];
    allowMultiple: boolean;
    statusSignal: string | null;
  } {
    // Initialize defaults
    let businessQuestion: any = null
    let aiMessage = aiResponse
    let multipleChoices: string[] | undefined = undefined
    let allowMultiple = false
    let statusSignal: string | null = null
    
    try {
      // Try to extract JSON from the response, handling various formats
      let jsonString = aiResponse.trim()
      let conversationalText = ''
      
      // Remove markdown code blocks if present
      const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (codeBlockMatch) {
        // Extract any text before the code block as conversational context
        const beforeCodeBlock = jsonString.substring(0, jsonString.indexOf('```')).trim()
        if (beforeCodeBlock) {
          conversationalText = beforeCodeBlock
        }
        jsonString = codeBlockMatch[1].trim()
      } else {
        // Try to find JSON object boundaries if there's extra text
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          // Extract any text before the JSON as conversational context
          const beforeJson = jsonString.substring(0, jsonString.indexOf('{')).trim()
          if (beforeJson) {
            conversationalText = beforeJson
          }
          jsonString = jsonMatch[0]
        }
      }
      
      // Attempt to parse the extracted JSON
      const jsonResponse = JSON.parse(jsonString)
      
      console.log('📋 Parsed JSON response:', {
        hasMessage: !!jsonResponse.message,
        hasStatus: !!jsonResponse.status,
        hasQuestionTemplate: !!jsonResponse.question_template,
        message: jsonResponse.message
      })
      
      // Universal format parsing - all responses should have a 'message' field
      if (jsonResponse.message) {
        console.log('📝 Using universal format parsing path')
        aiMessage = jsonResponse.message
        
        // Extract status signal if present
        if (jsonResponse.status) {
          statusSignal = jsonResponse.status
        }
        
        // Check if this is a structured question that needs storage
        if (jsonResponse.field_name && jsonResponse.field_type) {
          console.log('📋 Extracting business question data for storage')
          businessQuestion = {
            question_template: jsonResponse.message, // Use message as question template
            field_name: jsonResponse.field_name,
            field_type: jsonResponse.field_type,
            multiple_choices: jsonResponse.multiple_choices
          }
          
          // Handle multiple choice UI data
          if (jsonResponse.field_type === 'multiple_choice' && jsonResponse.multiple_choices) {
            multipleChoices = jsonResponse.multiple_choices
            allowMultiple = jsonResponse.allow_multiple || false
          }
        }
      } 
      // Legacy fallback for old question_template format (backward compatibility)
      else if (jsonResponse.question_template && jsonResponse.field_name && jsonResponse.field_type) {
        console.log('📝 Using legacy question_template fallback path')
        businessQuestion = {
          question_template: jsonResponse.question_template,
          field_name: jsonResponse.field_name,
          field_type: jsonResponse.field_type,
          multiple_choices: jsonResponse.multiple_choices
        }
        
        // Use conversational text if available, otherwise use the question template
        aiMessage = conversationalText || jsonResponse.question_template
        
        if (jsonResponse.field_type === 'multiple_choice' && jsonResponse.multiple_choices) {
          multipleChoices = jsonResponse.multiple_choices
          allowMultiple = jsonResponse.allow_multiple || false
        }
      } 
      // Fallback for unknown format
      else {
        console.log('⚠️ Unknown JSON format, using raw message')
        aiMessage = jsonResponse.message || jsonResponse.question_template || JSON.stringify(jsonResponse)
      }
    } catch (error) {
      // Not JSON or invalid JSON - treat as regular text response
      // This is normal behavior when AI provides conversational responses
      console.log('📝 JSON parsing failed, using raw response as text:', error instanceof Error ? error.message : String(error))
      aiMessage = aiResponse
    }

    return {
      aiMessage,
      businessQuestion,
      multipleChoices,
      allowMultiple,
      statusSignal
    }
  }

  public async generateAndStoreAIResponse(messages: ChatMessage[], context: ChatContext, promptType: 'onboarding' | 'business' = 'onboarding'): Promise<{ aiMessage: string; backendMessage?: string; multipleChoices?: string[]; allowMultiple?: boolean; statusSignal?: string | null }> {
    console.log(`🔄 Starting AI response generation and storage with ${promptType} prompt...`)
        
    // Generate enhanced system prompt with training hints
    let systemPrompt: string
    try {
      systemPrompt = await this.buildSystemPrompt(context, promptType)
    } catch (error) {
      console.warn('Failed to get enhanced system prompt, aborting chat:', error)
      return {
        aiMessage: "I'm sorry, but I couldn't retrieve your business knowledge at this time. Please try again later or contact support if the problem persists."
      }
    }
      
    try {
      const aiResponse = await this.callOpenAI(systemPrompt, messages)
      
      // Parse the AI response and extract structured data
      const parsed = this.parseAIResponse(aiResponse)
      const { aiMessage, businessQuestion, multipleChoices, allowMultiple, statusSignal } = parsed
      
      // If we have a status signal, append it to the message for backend processing
      // but don't show it to the user
      let backendMessage = aiMessage
      if (statusSignal) {
        backendMessage = `${aiMessage}\nSTATUS: ${statusSignal}`
      }
        
        const result = {
          aiMessage: aiMessage, // Clean user-facing message
          backendMessage: backendMessage, // Message with STATUS signals for backend processing
          multipleChoices: multipleChoices,
          allowMultiple: allowMultiple,
          statusSignal: statusSignal
        }
        
        console.log('🎯 Final result being returned:', {
          aiMessage: aiMessage?.substring(0, 100) + '...',
          aiMessageLength: aiMessage?.length,
          hasMultipleChoices: !!multipleChoices,
          statusSignal: statusSignal,
          businessQuestion: businessQuestion,
        })
        
        // Store the question if we have a valid business question
        if (businessQuestion) {
          const { businessInfoService } = await import('../../organizations/services/businessInfoService')
          await businessInfoService.storeBusinessQuestion(context.organization.id, businessQuestion)
        }
        
        return result
    } catch (error) {
      console.error('Error in AI response generation:', error)
      return {
        aiMessage: error instanceof Error ? error.message : "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment."
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
        .select('id, question_template, field_name, field_type, multiple_choices, allow_multiple, is_answered')
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
      const userMessage = messages[messages.length - 1]?.content || ''
      console.log('💾 Processing conversation storage for organization:', context.organization.id)
      
      // Step 1: Check if conversation exchange is business relevant
      const { businessInfoService } = await import('../../organizations/services/businessInfoService')
      
      const isRelevant = await businessInfoService.isBusinessRelevantInformation(
        userMessage, 
        aiMessage, 
        'embedding_storage'
      )
      
      console.log('📊 Business relevance evaluation:', {
        conversationExchange: `User: ${userMessage.substring(0, 30)}... | AI: ${aiMessage.substring(0, 30)}...`,
        isRelevant
      })
      
      // Step 2: Store embeddings for relevant conversations
      if (isRelevant) {
        console.log('📚 Storing business-relevant conversation for embeddings')
        
        // Simple and direct: store the conversation as embeddings
        const { embeddingService } = await import('../../../shared/services/embeddingService')
        const conversationText = `User: ${userMessage}\nAssistant: ${aiMessage}`
        
        await embeddingService.processBusinessConversations(
          context.organization.id,
          [conversationText]
        )
      } else {
        console.log('⏭️ Skipped storing conversation - not business relevant')
      }
      
    } catch (error) {
      console.error('❌ Error in conversation storage:', error)
      // Don't throw to avoid breaking the chat flow
    }
  }
} 