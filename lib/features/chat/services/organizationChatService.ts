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
  | 'PROCESSING'       // Handle onboarding - check pending, process responses, generate questions
  | 'COMPLETED'        // All onboarding done, normal chat mode

export class OrganizationChatService {
  private supabaseClient: any

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient || supabase
  }

  /**
   * Handle chat flow for both onboarding and business modes with unified logic
   */
  private async handleChatFlow(messages: ChatMessage[], context: ChatContext, isOnboarding: boolean): Promise<ChatResponse> {
    const mode = isOnboarding ? 'ONBOARDING' : 'BUSINESS'
    const promptType = isOnboarding ? 'onboarding' : 'business'
    const setupCompleted = !isOnboarding
    
    console.log(`🔄 State: ${mode} - Unified chat flow with intelligent question management`)
        
    // Check if there's a pending question
    const existingQuestion =await this.validateAndUpdatePendingQuestions(messages, context)
    
    if (existingQuestion) {
      console.log(`📋 Found existing pending ${mode.toLowerCase()} question - returning it (no new generation needed)`)
      
      // Always return the existing pending question - never generate new ones when one exists
        return {
          aiMessage: existingQuestion.question_template,
          multipleChoices: existingQuestion.multiple_choices || undefined,
        allowMultiple: existingQuestion.allow_multiple || existingQuestion.field_type === 'multiple_choice',
        setupCompleted
      }
    } else {
      // No pending question - handle based on mode
      if (isOnboarding) {
        console.log('🆕 No pending onboarding question - checking if completed or generating new question')
        
        // Check if onboarding is actually completed
        const { IntegratedOnboardingService } = await import('../../onboarding/services/integratedOnboardingService')
        const onboardingService = new IntegratedOnboardingService()
        const progress = await onboardingService.getOnboardingProgress(context.organization.id)
        
        if (progress.isCompleted) {
          console.log('✅ Onboarding completed - transitioning to business mode')
          return await this.handleChatFlow(messages, context, false) // Recursive call for business mode
        }
      } else {
        console.log('🆕 No pending business question - generating business conversation')
      }
      
      // Generate new question/response
      const aiResponse = await this.generateAndStoreAIResponse(messages, context, promptType)
      
      // Handle onboarding-specific progress updates
      if (isOnboarding && aiResponse.statusSignal) {
        const { IntegratedOnboardingService } = await import('../../onboarding/services/integratedOnboardingService')
        const onboardingService = new IntegratedOnboardingService()
        
        // If setup_complete signal, process it directly
        if (aiResponse.statusSignal === 'setup_complete') {
          console.log('✅ Setup complete signal detected - marking onboarding as completed')
          // Create a message that the service will recognize
          const messageWithSignal = `${aiResponse.aiMessage} STATUS: setup_complete`
          await onboardingService.updateOnboardingProgress(
            context.organization.id,
            messageWithSignal
          )
      } else {
          await onboardingService.updateOnboardingProgress(
            context.organization.id,
            aiResponse.aiMessage
          )
        }
      }
      
      // Determine if setup is completed
      const finalSetupCompleted = isOnboarding 
        ? (aiResponse.statusSignal === 'setup_complete')
        : setupCompleted
      
      return {
        aiMessage: aiResponse.aiMessage,
        multipleChoices: aiResponse.multipleChoices,
        allowMultiple: aiResponse.allowMultiple,
        setupCompleted: finalSetupCompleted
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
      
      // Get onboarding progress and determine chat flow
      const { IntegratedOnboardingService } = await import('../../onboarding/services/integratedOnboardingService')
      const onboardingService = new IntegratedOnboardingService()
      const progress = await onboardingService.getOnboardingProgress(organization.id)
      const isOnboarding = !progress.isCompleted
      
      console.log(`🎯 Onboarding status: ${isOnboarding ? 'PROCESSING' : 'COMPLETED'} (Stage: ${progress.currentStage})`)
      
      // Handle chat flow based on onboarding completion
      const response = await this.handleChatFlow(messages, context, isOnboarding)
      
      await this.storeConversation(messages, response.aiMessage, context)
      
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
   * Extract just the core business question from a full AI message using AI
   * Removes introductory text, instructions, and choice lists - keeps only the essential question
   */
  private async extractQuestionFromMessage(fullMessage: string): Promise<string> {
    try {
      console.log('🤖 Using AI to extract core question from:', fullMessage.substring(0, 100) + '...')
      
      const { openAIService } = await import('@/lib/shared/services/OpenAIService')
      
      const response = await openAIService.callChatCompletion([
        {
          role: 'system',
          content: `Extract only the core business question from this message.`
        },
        {
          role: 'user', 
          content: fullMessage
        }
      ], {
        model: 'gpt-3.5-turbo',
        maxTokens: 100,
        temperature: 0
      })
      
      const extractedQuestion = response.trim()
      console.log('✅ AI extracted question:', extractedQuestion)
      
      return extractedQuestion
      
    } catch (error) {
      console.error('❌ Error extracting question with AI:', error)
      console.log('⚠️ Falling back to original message')
      return fullMessage // Fallback to original if AI extraction fails
    }
  }

  /**
   * Parse AI response and extract structured data
   */
  private async parseAIResponse(aiResponse: string): Promise<{
    aiMessage: string;
    businessQuestion: any | null;
    multipleChoices?: string[];
    allowMultiple: boolean;
    statusSignal: string | null;
  }> {
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
          
          // Extract just the actual question from the full AI message using AI
          const extractedQuestion = await this.extractQuestionFromMessage(jsonResponse.message)
          
            businessQuestion = {
            question_template: extractedQuestion, // Store only the question, not the full response
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
      // Invalid format - must have 'message' field
      else {
        console.error('❌ Invalid JSON format: missing required "message" field')
        console.error('📋 Received:', jsonResponse)
        aiMessage = 'I apologize, but there was a formatting error in my response. Please try again.'
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

  public async generateAndStoreAIResponse(messages: ChatMessage[], context: ChatContext, promptType: 'onboarding' | 'business' = 'onboarding'): Promise<{ aiMessage: string; multipleChoices?: string[]; allowMultiple?: boolean; statusSignal?: string | null }> {
    console.log(`🔄 Starting AI response generation and storage with ${promptType} prompt...`)
    
    // 🎯 CRITICAL FIX: When messages is empty (browser refresh), add context about previous questions
    let enhancedMessages = messages
    if (messages.length === 0 && promptType === 'onboarding') {
      console.log('🔍 DEBUG: Empty messages detected - adding context about previous questions')
      console.log('🔍 DEBUG: Original messages array:', JSON.stringify(messages, null, 2))
  
      // Get previously answered questions from business info service
      const { businessInfoService } = await import('../../organizations/services/businessInfoService')
      const answeredQuestions = await businessInfoService.getAnsweredQuestions(context.organization.id)
      
      if (answeredQuestions && answeredQuestions.length > 0) {
        // Create context message about what was already collected
        const previousQuestionsContext = answeredQuestions
          .map((q: any) => `Q: ${q.question_template}\nA: ${q.field_value}`)
          .join('\n\n')
        
        const contextMessage = `CONTEXT: The following onboarding questions have already been answered:\n\n${previousQuestionsContext}\n\nBased on this context, generate the next appropriate onboarding question. DO NOT repeat any of the above questions.`
        
        enhancedMessages = [
          {
            role: 'system' as const,
            content: contextMessage
          }
        ]
        
        console.log(`✅ DEBUG: Added context for ${answeredQuestions.length} previously answered questions`)
        console.log('📋 DEBUG: Context message created:')
        console.log('---START CONTEXT---')
        console.log(contextMessage)
        console.log('---END CONTEXT---')
        console.log('🔍 DEBUG: Enhanced messages array:', JSON.stringify(enhancedMessages, null, 2))
      } else {
        console.log('⚠️ DEBUG: No answered questions found - proceeding without context')
      }
    } else {
      console.log(`🔍 DEBUG: Not adding context - messages.length: ${messages.length}, promptType: ${promptType}`)
    }
        
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
      console.log('🤖 DEBUG: About to call OpenAI with:')
      console.log('📋 System Prompt Preview:', systemPrompt.substring(0, 200) + '...')
      console.log('📨 Messages being sent to OpenAI:', JSON.stringify(enhancedMessages, null, 2))
      
      const aiResponse = await this.callOpenAI(systemPrompt, enhancedMessages)
      
      console.log('🤖 DEBUG: Raw AI response received:')
      console.log('---START AI RESPONSE---')
      console.log(aiResponse)
      console.log('---END AI RESPONSE---')
      
      // Parse the AI response and extract structured data
      const parsed = await this.parseAIResponse(aiResponse)
      const { aiMessage, businessQuestion, multipleChoices, allowMultiple, statusSignal } = parsed
      
      console.log('🔍 DEBUG: Parsed components:')
      console.log('  aiMessage:', aiMessage)
      console.log('  businessQuestion:', businessQuestion)
      console.log('  multipleChoices:', multipleChoices)
      console.log('  allowMultiple:', allowMultiple)
      console.log('  statusSignal:', statusSignal)
        
        const result = {
          aiMessage: aiMessage, // Clean user-facing message
          multipleChoices: multipleChoices,
          allowMultiple: allowMultiple,
          statusSignal: statusSignal
        }
        
        console.log('🎯 Final result being returned:', {
          aiMessage: aiMessage?.substring(0, 100) + '...',
          aiMessageLength: aiMessage?.length,
          hasMultipleChoices: !!multipleChoices,
          statusSignal: statusSignal,
          businessQuestion: businessQuestion
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

  /**
   * Validate and update any pending questions before generating new AI response
   * This prevents race conditions where questions might be marked as answered after the response is generated
   * Returns the pending question if it wasn't answered, null otherwise
   */
  private async validateAndUpdatePendingQuestions(messages: ChatMessage[], context: ChatContext): Promise<any | null> {
    try {
      const businessInfoService = new (await import('../../organizations/services/businessInfoService')).BusinessInfoService()
      
      // Get the pending unanswered question
      const pendingQuestions = await businessInfoService.getPendingQuestions(context.organization.id)

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