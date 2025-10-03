import { supabase } from '@/lib/shared/supabase/client'
import { generateSlugFromName } from '@/lib/shared/utils/text'
import { validationService } from '@/lib/shared/services'
import { IntegratedOnboardingService } from '@/lib/features/onboarding/services/integratedOnboardingService'
import { agentService } from '@/lib/features/organizations/services/agentService'
import { embeddingService } from '@/lib/shared/services/embeddingService'
import { YamlPromptLoader } from '@/lib/features/chat/services/systemPrompt/YamlPromptLoader'
import { openAIService } from '@/lib/shared/services/OpenAIService'
import { businessInfoService } from '@/lib/features/organizations/services/businessInfoService'
// Dynamic import for server-only scraping service
import { 
  OnboardingQuestionResponse,
  OnboardingSchema
} from '@/lib/shared/schemas/onboardingSchemas'
import {
  BusinessConversationalSchema,
  BusinessQuestionSchema,
  BusinessConversationalResponse,
  BusinessQuestionResponse,
  BusinessConversationResponse
} from '@/lib/shared/schemas/businessConversationSchemas'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatResponse {
  aiMessage: string
  multipleChoices?: string[]
  allowMultiple?: boolean
  statusSignal?: string
  setupCompleted?: boolean
}

export interface ChatContext {
  user: any
  organization: any
  locale: string
}

export type OnboardingState = 
  | 'WEBSITE_SCRAPING' // Extract business info from website URL
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
  private async handleChatFlow(
    messages: ChatMessage[],
    context: ChatContext,
    isOnboarding: boolean,
    progressEmitter?: (event: string, data?: any) => void
  ): Promise<ChatResponse> {
    const mode = isOnboarding ? 'ONBOARDING' : 'BUSINESS'
    const promptType = isOnboarding ? 'onboarding' : 'business'
    const setupCompleted = !isOnboarding
    
    console.log(`🔄 [FLOW] State: ${mode} - Unified chat flow with intelligent question management`)
    console.log(`📝 [FLOW] Messages to process:`, {
      count: messages.length,
      userMessages: messages.filter(m => m.role === 'user').length,
      assistantMessages: messages.filter(m => m.role === 'assistant').length
    })
        
    // Check if there's a pending question
    console.log('🔍 [FLOW] Checking for pending questions')
    const existingQuestion = await this.validateAndUpdatePendingQuestions(messages, context)
    console.log('📋 [FLOW] Pending question check result:', {
      hasPendingQuestion: !!existingQuestion,
      questionFieldName: existingQuestion?.field_name,
      questionTemplate: existingQuestion?.question_template?.substring(0, 50) + '...'
    })
    
    if (existingQuestion) {
      console.log(`📋 [FLOW] Found existing pending ${mode.toLowerCase()} question - returning it (no new generation needed)`)
      console.log(`🔄 [FLOW] Returning existing question:`, {
        fieldName: existingQuestion.field_name,
        fieldType: existingQuestion.field_type,
        hasMultipleChoices: !!existingQuestion.multiple_choices,
        allowMultiple: existingQuestion.allow_multiple
      })
      
      // Always return the existing pending question - never generate new ones when one exists
        return {
          aiMessage: existingQuestion.question_template,
          multipleChoices: existingQuestion.multiple_choices || undefined,
        allowMultiple: existingQuestion.allow_multiple || existingQuestion.field_type === 'multiple_choice',
        setupCompleted
      }
    } else {
      // No pending question - handle based on mode
      console.log(`🆕 [FLOW] No pending ${mode.toLowerCase()} question found`)
      
      if (isOnboarding) {
        console.log('🔍 [FLOW] Onboarding mode - checking if actually completed or generating new question')
        
        // Check if onboarding is actually completed
        const onboardingService = new IntegratedOnboardingService()
        const progress = await onboardingService.getOnboardingProgress(context.organization.id)
        console.log('📊 [FLOW] Re-checking onboarding progress:', {
          isCompleted: progress.isCompleted
        })
        
        if (progress.isCompleted) {
          console.log('✅ [FLOW] Onboarding completed - transitioning to business mode')
          return await this.handleChatFlow(messages, context, false, progressEmitter)
        }
      } else {
         // 🌐 NEW: Check if this is a brand new organization that should start with website scraping
         const shouldOfferWebsiteScraping = await this.shouldOfferWebsiteScraping(context.organization.id, messages)
         if (shouldOfferWebsiteScraping) {
           console.log('🌐 [FLOW] Brand new organization - offering website scraping option')
           return {
            aiMessage: "¡Bienvenido! Soy Chayo, tu asistente de IA para negocios. 🎉\n\nPara empezar rápidamente, puedo extraer información del sitio web de tu negocio para personalizar tu experiencia y acelerar el proceso de configuración.\n\n¿Tienes un sitio web de tu negocio que me gustaría analizar? Si lo tienes, te proporcionaré una forma sencilla de compartirlo conmigo. Si no, no te preocupes - te guiaré a través de nuestras preguntas de configuración estándar.",
            statusSignal: 'website_scraping_offered'
          }
         }
        console.log('💼 [FLOW] Business mode - generating business conversation')
      }
      
      // Generate new question/response
      console.log(`🤖 [FLOW] Generating new AI response (${promptType} mode)`)
      const aiResponse = await this.generateAndStoreAIResponse(messages, context, promptType, progressEmitter)
      console.log('✅ [FLOW] AI response generated:', {
        hasAiMessage: !!aiResponse.aiMessage,
        statusSignal: aiResponse.statusSignal,
        hasMultipleChoices: !!aiResponse.multipleChoices,
        allowMultiple: aiResponse.allowMultiple
      })
      
      // Handle progress updates when there's a status signal
      if (aiResponse.statusSignal) {
    
        const onboardingService = new IntegratedOnboardingService()
        
        await onboardingService.updateOnboardingProgress(
          context.organization.id,
          { statusSignal: aiResponse.statusSignal, aiMessage: aiResponse.aiMessage },
          progressEmitter
        )
        
        // After updating progress, re-check completion to avoid stale state until refresh
        try {
          const progressAfter = await onboardingService.getOnboardingProgress(context.organization.id)
          if (progressAfter.isCompleted) {
            console.log('🎯 Onboarding marked completed after update (no refresh required)')
            // Explicit phase to inform UI about mode switching
            progressEmitter?.('phase', { name: 'switchingMode', from: 'onboarding', to: 'business' })

            try {
              await agentService.maybeCreateAgentChatLinkIfThresholdMet({
                id: context.organization.id,
                slug: context.organization.slug
              })
              console.log('✅ Agent creation check completed for newly completed onboarding')
            } catch (error) {
              console.warn('⚠️ Failed to create agent during onboarding completion:', error)
            }
    
            
            // Generate a business-mode response right away so the user sees training begin immediately
            const businessResponse = await this.generateAndStoreAIResponse(messages, context, 'business', progressEmitter)
            return {
              aiMessage: businessResponse.aiMessage,
              multipleChoices: businessResponse.multipleChoices,
              allowMultiple: businessResponse.allowMultiple,
              setupCompleted: true
            }
          }
        } catch (e) {
          console.warn('⚠️ Could not re-check onboarding progress after update:', e)
        }
      }
      
      // Determine if setup is completed
      const finalSetupCompleted = isOnboarding 
        ? (['setup_complete','onboarding_complete','onboarding_completed','completed'].includes((aiResponse.statusSignal || '').toLowerCase()))
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
    locale: string = 'es',
    progressEmitter?: (event: string, data?: any) => void
  ): Promise<ChatResponse & { organization: any }> {
    try {
      console.log('🎯 [SERVICE] processChat started:', {
        messagesCount: messages.length,
        locale,
        hasProgressEmitter: !!progressEmitter,
        messageTypes: messages.map(m => m.role)
      })
      
      // Get user and organization context
      console.log('👤 [SERVICE] Getting current user')
      const { data: { user }, error: authError } = await this.supabaseClient.auth.getUser()
      if (authError || !user) {
        console.log('❌ [SERVICE] Authentication failed:', authError?.message)
        throw new Error('Authentication required')
      }
      console.log('✅ [SERVICE] User authenticated:', user.id)
      
      // Get or create organization
      console.log('🏢 [SERVICE] Getting or creating organization')
      const organization = await this.getOrCreateOrganization(user)
      console.log('✅ [SERVICE] Organization ready:', organization.id)
      const context: ChatContext = {
        user,
        organization,
        locale
      }
      console.log('📋 [SERVICE] Context created for organization:', organization.id)
      
      // Get onboarding progress and determine chat flow
      console.log('🔍 [SERVICE] Checking onboarding status')
      const onboardingService = new IntegratedOnboardingService()
      progressEmitter?.('phase', { name: 'initializing' })
      const progress = await onboardingService.getOnboardingProgress(organization.id)
      const isOnboarding = !progress.isCompleted
      console.log('📊 [SERVICE] Onboarding status:', {
        isCompleted: progress.isCompleted,
        isOnboarding
      })
      
      console.log(`🎯 Onboarding status: ${isOnboarding ? 'PROCESSING' : 'COMPLETED'}`)
      progressEmitter?.('phase', { name: 'checkingExistingQuestion' })
      
      const response = await this.handleChatFlow(messages, context, isOnboarding, progressEmitter)
      console.log('✅ [SERVICE] handleChatFlow completed:', {
        hasAiMessage: !!response.aiMessage,
        hasMultipleChoices: !!response.multipleChoices,
        allowMultiple: response.allowMultiple,
        setupCompleted: response.setupCompleted
      })
      
      console.log('💾 [SERVICE] Storing conversation')
      await this.storeConversation(messages, response.aiMessage, context)
      
      progressEmitter?.('phase', { name: 'done' })
      
      console.log('🎉 [SERVICE] processChat completed successfully')
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
      
          const memory = await embeddingService.getBusinessKnowledgeSummary(context.organization.id)
          if (memory) {
            trainingContext = memory
          }
        } catch (error) {
          console.warn('Failed to get training context:', error)
        }

        // Use YAML loader for system prompts
    
        
        // Determine if setup is completed based on promptType
        // - 'onboarding' promptType: Check actual onboarding progress
        // - 'business' promptType: Setup is considered completed (business operations mode)
        let isSetupCompleted: boolean
        
        if (promptType === 'business') {
          isSetupCompleted = true
          // Business mode - no additional setup needed
        } else {
          // For onboarding, always use onboarding prompt regardless of completion status
          const onboardingService = new IntegratedOnboardingService()
          const progress = await onboardingService.getOnboardingProgress(context.organization.id)
          isSetupCompleted = false // Force onboarding prompt when promptType is 'onboarding'
        }
        
        console.log(`🎯 Using ${promptType} system prompt - isSetupCompleted: ${isSetupCompleted}`)
    return await YamlPromptLoader.buildSystemPrompt(context.locale, trainingContext, isSetupCompleted)
  }

  /**
   * Make structured OpenAI API call using Structured Outputs
   */
  private async callStructuredOpenAI<T>(
    systemPrompt: string, 
    messages: ChatMessage[], 
    schema: any,
    promptType: 'onboarding' | 'business'
  ): Promise<T> {
    // Prepare messages with full conversation history
    const chatMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    ]

    console.log(`🎯 [STRUCTURED] Using structured outputs for ${promptType} mode`)
    return await openAIService.callStructuredCompletion<T>(chatMessages, schema, {
      model: 'gpt-4o-mini',
      temperature: 0.7, // Lower temperature for more consistent structured output
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
      
  
      
      const response = await openAIService.callCompletion([
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
   * @deprecated This method is no longer used with Structured Outputs. 
   * Structured responses are now handled directly via OpenAI's JSON Schema feature.
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
        
        // 🎯 FLEXIBLE STORAGE: Store ANY onboarding question, regardless of structure
        
        // Extract just the actual question from the full AI message using AI
        const extractedQuestion = await this.extractQuestionFromMessage(jsonResponse.message)
        
        // Create business question with simple defaults
        businessQuestion = {
          question_template: extractedQuestion,
          field_name: jsonResponse.field_name || 'other',
          field_type: jsonResponse.field_type || 'text',
          multiple_choices: jsonResponse.multiple_choices || null
        }
        
        // Handle multiple choice UI data
        if (jsonResponse.field_type === 'multiple_choice' && jsonResponse.multiple_choices) {
          multipleChoices = jsonResponse.multiple_choices
          allowMultiple = jsonResponse.allow_multiple || false
        }
      } 
      // Invalid format - must have 'message' field
      else {
        console.error('❌ Invalid JSON format: missing required "message" field')
        console.error('📋 Received:', jsonResponse)
        aiMessage = 'Disculpa, hubo un error de formato en mi respuesta. Por favor intenta de nuevo.'
          }
        } catch (error) {
          // Not JSON or invalid JSON - treat as regular text response
          // 🎯 FLEXIBLE STORAGE: Even for plain text, try to store if it looks like an onboarding question
          console.log('📝 JSON parsing failed, using raw response as text:', error instanceof Error ? error.message : String(error))
          aiMessage = aiResponse
          
          // 🔍 For plain text responses, always store as business question
          const extractedQuestion = await this.extractQuestionFromMessage(aiResponse)
          
          businessQuestion = {
            question_template: extractedQuestion,
            field_name: 'other',
            field_type: 'text',
            multiple_choices: null
          }
        }

    return {
      aiMessage,
      businessQuestion,
      multipleChoices,
      allowMultiple,
      statusSignal
    }
  }

  public async generateAndStoreAIResponse(
    messages: ChatMessage[],
    context: ChatContext,
    promptType: 'onboarding' | 'business' = 'onboarding',
    progressEmitter?: (event: string, data?: any) => void
  ): Promise<{ aiMessage: string; multipleChoices?: string[]; allowMultiple?: boolean; statusSignal?: string | null }> {
    console.log(`🔄 Starting AI response generation and storage with ${promptType} prompt...`)
    
    // 🎯 CRITICAL FIX: When messages is empty (browser refresh), add context about previous questions
    let enhancedMessages = messages
    if (messages.length === 0 && promptType === 'onboarding') {
      progressEmitter?.('phase', { name: 'buildingContext' })
      console.log('🔍 DEBUG: Empty messages detected - adding context about previous questions')
      console.log('🔍 DEBUG: Original messages array:', JSON.stringify(messages, null, 2))
  
      // Get previously answered questions from business info service
  
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
      progressEmitter?.('phase', { name: 'buildingPrompt', mode: promptType })
      systemPrompt = await this.buildSystemPrompt(context, promptType)
    } catch (error) {
      console.warn('Failed to get enhanced system prompt, aborting chat:', error)
      return {
        aiMessage: "Lo siento, pero no pude recuperar el conocimiento de tu negocio en este momento. Por favor intenta más tarde o contacta a soporte si el problema persiste."
      }
    }
      
    try {
      console.log('🤖 DEBUG: About to call OpenAI with:')
      console.log('📋 System Prompt Preview:', systemPrompt.substring(0, 200) + '...')
      console.log('📨 Messages being sent to OpenAI:', JSON.stringify(enhancedMessages, null, 2))
      
      progressEmitter?.('phase', { name: 'callingAI' })
      
      // 🎯 STRUCTURED OUTPUTS: Use appropriate schema based on prompt type
      let structuredResponse: OnboardingQuestionResponse | BusinessConversationResponse
      
      if (promptType === 'onboarding') {
        console.log('🎯 [STRUCTURED] Using unified OnboardingSchema for structured output')
        structuredResponse = await this.callStructuredOpenAI<OnboardingQuestionResponse>(
          systemPrompt, 
          enhancedMessages, 
          OnboardingSchema,
          promptType
        )
      } else {
        // For business conversations, use BusinessQuestionSchema if collecting info, otherwise BusinessConversationalSchema
        // For now, default to BusinessQuestionSchema - we can make this smarter later
        console.log('🎯 [STRUCTURED] Using BusinessQuestionSchema for structured output')
        structuredResponse = await this.callStructuredOpenAI<BusinessQuestionResponse>(
          systemPrompt, 
          enhancedMessages, 
          BusinessQuestionSchema,
          promptType
        )
      }
      
      console.log('✅ [STRUCTURED] Structured response received:', structuredResponse)
      
      // Extract data from structured response (no parsing needed!)
      const aiMessage = structuredResponse.message
      const statusSignal = 'status' in structuredResponse ? structuredResponse.status : null
      
      // Handle question-specific fields for both onboarding and business conversations
      let businessQuestion = null
      let multipleChoices = undefined
      let allowMultiple = false
      
      // Extract business question data from structured response (nested question property)
      if ('question' in structuredResponse && structuredResponse.question) {
        const questionData = structuredResponse.question as any
        
        // Check if question object has actual content (not empty completion object)
        if (questionData.field_name && questionData.field_type && questionData.question_template) {
          businessQuestion = {
            question_template: questionData.question_template,
            field_name: questionData.field_name,
            field_type: questionData.field_type,
            multiple_choices: questionData.multiple_choices || null
          }
          
          if (questionData.field_type === 'multiple_choice' && questionData.multiple_choices) {
            multipleChoices = questionData.multiple_choices
            allowMultiple = questionData.allow_multiple || false
          }
        }
      }
      
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
          progressEmitter?.('phase', { name: 'updatingProfile', field: businessQuestion.field_name })
      
          await businessInfoService.storeBusinessQuestion(context.organization.id, businessQuestion)
          
          // After storing the question, check if the user's messages already answered it
          console.log('🔍 [FLOW] Checking if newly stored question was already answered in conversation')
          await this.validateAndUpdatePendingQuestions(messages, context)
        }
        
        return result
    } catch (error) {
      console.error('Error in AI response generation:', error)
      return {
        aiMessage: error instanceof Error ? error.message : "Disculpa, pero estoy experimentando dificultades técnicas en este momento. Por favor intenta de nuevo en un momento."
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
      console.log('🔍 [VALIDATE] Starting pending question validation for org:', context.organization.id)
      
      // Get the pending unanswered question
      console.log('📋 [VALIDATE] Fetching pending questions from database')
      const pendingQuestions = await businessInfoService.getPendingQuestions(context.organization.id)
      console.log('📊 [VALIDATE] Pending questions result:', {
        count: pendingQuestions?.length || 0,
        questions: pendingQuestions?.map(q => ({ 
          fieldName: q.field_name, 
          fieldType: q.field_type,
          isAnswered: q.is_answered 
        })) || []
      })

      if (pendingQuestions && pendingQuestions.length > 0) {
        const pendingQuestion = pendingQuestions[0]
        console.log('📝 [VALIDATE] Processing first pending question:', {
          fieldName: pendingQuestion.field_name,
          questionTemplate: pendingQuestion.question_template,
          fieldType: pendingQuestion.field_type
        })
        
        // Get only the LAST user message to validate against the current pending question
        const userMessagesArray = messages.filter(m => m.role === 'user')
        const lastUserMessage = userMessagesArray.length > 0 ? userMessagesArray[userMessagesArray.length - 1].content : ''
        
        console.log('💬 [VALIDATE] Last user message to validate:', {
          totalUserMessages: userMessagesArray.length,
          lastMessageLength: lastUserMessage.length,
          content: lastUserMessage.substring(0, 200) + (lastUserMessage.length > 200 ? '...' : '')
        })
        
        if (lastUserMessage.trim()) {
          // Check if the pending question was answered
          console.log('🤖 [VALIDATE] Calling AI validation service')
          const validationResult = await validationService.validateAnswerWithAI(
            lastUserMessage, 
            pendingQuestion.question_template
          )
          console.log('📊 [VALIDATE] AI validation result:', validationResult)
          
          if (validationResult.answered && validationResult.answer && validationResult.confidence) {
            console.log('✅ [VALIDATE] Question was answered! Updating database')
            console.log('💾 [VALIDATE] Updating question as answered:', {
              fieldName: pendingQuestion.field_name,
              answer: validationResult.answer,
              confidence: validationResult.confidence
            })
            
            // Update the question as answered
            await businessInfoService.updateQuestionAsAnswered(
              context.organization.id,
              pendingQuestion.field_name,
              validationResult.answer,
              validationResult.confidence
            )
            console.log('✅ [VALIDATE] Question marked as answered in database')
            
            // Question was answered, return null
            return null
          } else {
            console.log('❌ [VALIDATE] Question was NOT answered:', {
              answered: validationResult.answered,
              hasAnswer: !!validationResult.answer,
              confidence: validationResult.confidence,
              reason: !validationResult.answered ? 'AI says not answered' : 
                      !validationResult.answer ? 'No answer extracted' :
                      !validationResult.confidence ? 'No confidence score' : 'Unknown'
            })
          }
        } else {
          console.log('⚠️ [VALIDATE] No user messages to validate (empty or whitespace)')
        }
        
        // Question wasn't answered, return the pending question
        console.log('🔄 [VALIDATE] Returning pending question (not answered)')
        return pendingQuestion
      } else {
        console.log('✅ [VALIDATE] No pending questions found')
      }
      
      return null
    } catch (error) {
      console.error('❌ [VALIDATE] Error in validateAndUpdatePendingQuestions:', error)
      return null
    }
  }

  public async storeConversation(messages: ChatMessage[], aiMessage: string, context: ChatContext): Promise<void> {
    try {
      console.log('💾 Processing conversation storage for organization:', context.organization.id)
      
      // Look for the previous AI question and current user response pair
      if (messages.length >= 2) {
        const currentUserMessage = messages[messages.length - 1]?.content || ''
        const previousAiMessage = messages[messages.length - 2]?.content || ''
        
        // If we have a previous AI message and current user response, store that pair
        if (messages[messages.length - 2]?.role === 'assistant' && messages[messages.length - 1]?.role === 'user') {
          console.log('📝 Found complete Q&A pair to store')
          
          const isRelevant = await businessInfoService.isBusinessRelevantInformation(
            currentUserMessage, 
            previousAiMessage,
            'embedding_storage'
          )
          
          console.log('📊 Business relevance evaluation:', {
            conversationExchange: `AI: ${previousAiMessage.substring(0, 30)}... | User: ${currentUserMessage.substring(0, 30)}...`,
            isRelevant
          })
          
          if (isRelevant) {
            console.log('📚 Storing business-relevant Q&A pair for embeddings')
            
            const conversationText = `Assistant: ${previousAiMessage}\nUser: ${currentUserMessage}`
            
            await embeddingService.processBusinessConversations(
              context.organization.id,
              [conversationText]
            )
            console.log('✅ [SERVICE] Conversation stored successfully')
          } else {
            console.log('⏭️ Skipped storing conversation - not business relevant')
          }
        } else {
          console.log('⏭️ No complete Q&A pair found, skipping storage')
        }
      } else {
        console.log('⏭️ Not enough messages for Q&A pair, skipping storage')
      }      
    } catch (error) {
      console.error('❌ Error storing conversation:', error)
    }
  }

  /**
   * Get enabled tools for an organization
   */
  private async getEnabledTools(organizationId: string): Promise<string[]> {
    try {
      // Get enabled agent tools for this organization
      const { data: agentTools, error } = await this.supabaseClient
        .from('agent_tools')
        .select('tool_type, enabled')
        .eq('organization_id', organizationId)
        .eq('enabled', true)

      if (error || !agentTools) {
        console.log('📋 No enabled tools found or error:', error?.message)
        return []
      }

      const enabledTools = agentTools.map((tool: any) => tool.tool_type)
      console.log('🔧 Enabled tools for organization:', enabledTools)
      return enabledTools
    } catch (error) {
      console.error('Error getting enabled tools:', error)
      return []
    }
  }

  /**
   * Check if we should offer website scraping to a new organization
   */
  private async shouldOfferWebsiteScraping(organizationId: string, messages: ChatMessage[]): Promise<boolean> {
    try {
      // Check the organization's website scraping state
      const { data: organization } = await this.supabaseClient
        .from('organizations')
        .select('website_scraping_state')
        .eq('id', organizationId)
        .single()

      if (!organization) {
        console.log('🌐 [SCRAPING] Organization not found')
        return false
      }

      const scrapingState = organization.website_scraping_state

      // Only offer if we haven't offered before (state is null)
      if (scrapingState === null) {
        // Additional check: only offer if this is early in the conversation
        const userMessages = messages.filter(m => m.role === 'user')
        if (userMessages.length <= 1) { // Allow up to 1 user message
          console.log('🌐 [SCRAPING] Offering website scraping to new organization')
          
          // Update state to 'offered' so we don't ask again
          await this.supabaseClient
            .from('organizations')
            .update({ website_scraping_state: 'offered' })
            .eq('id', organizationId)
          
          return true
        }
      }

      console.log('🌐 [SCRAPING] Not offering website scraping - state:', scrapingState, 'messages:', messages.filter(m => m.role === 'user').length)
      return false

    } catch (error) {
      console.error('❌ [SCRAPING] Error checking website scraping conditions:', error)
      return false
    }
  }

  // Note: detectUrlInMessage method removed - using explicit frontend URL input instead

  /**
   * Handle website scraping and business info extraction
   */
  async handleWebsiteScraping(
    url: string, 
    organizationId: string,
    progressEmitter?: (phase: string, data?: any) => void
  ): Promise<{
    success: boolean;
    hasEnoughInfo: boolean;
    businessInfo?: any;
    rawContent?: string;
    error?: string;
  }> {
    try {
      console.log('🌐 [SCRAPING] Starting website scraping for:', url);
      progressEmitter?.('phase', { name: 'scrapingWebsite', url });

      // Step 1: Scrape and extract business information (dynamic import for server-only)
      const { ScrapingService } = await import('@/lib/shared/services/scrapingService');
      const scrapingService = new ScrapingService();
      const scrapingResult = await scrapingService.scrapeAndExtractBusinessInfo(url);

      if (!scrapingResult.success) {
        console.log('❌ [SCRAPING] Website scraping failed:', scrapingResult.error);
        return {
          success: false,
          hasEnoughInfo: false,
          error: scrapingResult.error
        };
      }

      const hasEnoughInfo = !!scrapingResult.businessInfo;
      console.log('📊 [SCRAPING] Extraction result:', { hasEnoughInfo, contentLength: scrapingResult.rawContent?.length });

      if (hasEnoughInfo && scrapingResult.rawContent) {
        progressEmitter?.('phase', { name: 'storingBusinessInfo' });
        
        // Step 2: Store the extracted business information in embeddings
        const businessInfoContent = `Business Information extracted from website (${url}):\n\n${scrapingResult.rawContent}`;
        await embeddingService.processBusinessConversations(organizationId, [businessInfoContent]);
        console.log('✅ [SCRAPING] Business information stored in embeddings');
      }

      return {
        success: true,
        hasEnoughInfo,
        businessInfo: scrapingResult.businessInfo,
        rawContent: scrapingResult.rawContent
      };

    } catch (error) {
      console.error('❌ [SCRAPING] Website scraping error:', error);
      return {
        success: false,
        hasEnoughInfo: false,
        error: error instanceof Error ? error.message : 'Unknown scraping error'
      };
    }
  }

} 
