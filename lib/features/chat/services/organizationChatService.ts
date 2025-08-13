import { supabase } from '@/lib/shared/supabase/client'
import { generateSlugFromName } from '@/lib/shared/utils/text'
import { validationService } from '@/lib/shared/services'
import { IntegratedOnboardingService } from '@/lib/features/onboarding/services/integratedOnboardingService'
import { agentService } from '@/lib/features/organizations/services/agentService'
import { ToolIntentService } from '@/lib/features/tools/shared/services'
import { embeddingService } from '@/lib/shared/services/embeddingService'
import { YamlPromptLoader } from '@/lib/features/chat/services/systemPrompt/YamlPromptLoader'
import { openAIService } from '@/lib/shared/services/OpenAIService'
import { businessInfoService } from '@/lib/features/organizations/services/businessInfoService'
// Dynamic import for server-only scraping service
import { 
  OnboardingQuestionSchema, 
  OnboardingStatusSchema,
  OnboardingQuestionResponse,
  OnboardingStatusResponse,
  CustomerSimulationResponse 
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
          isCompleted: progress.isCompleted,
          currentStage: progress.currentStage
        })
        
        if (progress.isCompleted) {
          console.log('✅ [FLOW] Onboarding completed - transitioning to business mode')
          return await this.handleChatFlow(messages, context, false) // Recursive call for business mode
        }

        // 🌐 NEW: Check if this is a brand new organization that should start with website scraping
        const shouldOfferWebsiteScraping = await this.shouldOfferWebsiteScraping(context.organization.id, messages)
        if (shouldOfferWebsiteScraping) {
          console.log('🌐 [FLOW] Brand new organization - offering website scraping option')
          return {
            aiMessage: "Welcome! I'm Chayo, your AI business assistant. 🎉\n\nTo get started quickly, I can extract information from your business website to personalize your experience and speed up the setup process.\n\nDo you have a business website you'd like me to analyze? If you do, I'll provide you with a simple way to share it with me. If not, no worries - I'll guide you through our standard setup questions.",
            statusSignal: 'website_scraping_offered'
          }
        }
      } else {
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
      
      // Handle onboarding-specific progress updates
      if (isOnboarding && aiResponse.statusSignal) {
    
        const onboardingService = new IntegratedOnboardingService()
        
        // Normalize completion signals coming from prompts
        const completionSignals = new Set(['setup_complete', 'onboarding_complete', 'onboarding_completed', 'completed'])
        const signalLower = (aiResponse.statusSignal || '').toLowerCase()
        const isCompletionSignal = completionSignals.has(signalLower)

        // If a completion signal, process it directly
        if (isCompletionSignal) {
          console.log('✅ Setup complete signal detected - marking onboarding as completed')
          await onboardingService.updateOnboardingProgress(
            context.organization.id,
            { statusSignal: 'setup_complete', aiMessage: aiResponse.aiMessage }
          )
        } else {
          await onboardingService.updateOnboardingProgress(
            context.organization.id,
            { statusSignal: aiResponse.statusSignal, aiMessage: aiResponse.aiMessage }
          )
        }
        
        // After updating progress, re-check completion to avoid stale state until refresh
        try {
          const progressAfter = await onboardingService.getOnboardingProgress(context.organization.id)
          if (progressAfter.isCompleted) {
            console.log('🎯 Onboarding marked completed after update (no refresh required)')
            // Explicit phase to inform UI about mode switching
            progressEmitter?.('phase', { name: 'switchingMode', from: 'onboarding', to: 'business' })
          }
        } catch (e) {
          console.warn('⚠️ Could not re-check onboarding progress after update:', e)
        }
      }
      
      // Determine if setup is completed
      const finalSetupCompleted = isOnboarding 
        ? (['setup_complete','onboarding_complete','onboarding_completed','completed'].includes((aiResponse.statusSignal || '').toLowerCase()))
        : setupCompleted

      // If onboarding just completed in this turn, switch prompts immediately and respond in business mode
      if (isOnboarding && finalSetupCompleted) {
        progressEmitter?.('phase', { name: 'switchingMode', from: 'onboarding', to: 'business' })
        
        // Create agent for client mode if needed
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
    locale: string = 'en',
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
        isOnboarding,
        currentStage: progress.currentStage
      })
      
      console.log(`🎯 Onboarding status: ${isOnboarding ? 'PROCESSING' : 'COMPLETED'} (Stage: ${progress.currentStage})`)
      progressEmitter?.('phase', { name: 'checkingExistingQuestion', stage: progress.currentStage })
      
      // ⭐ PRIORITY: Check for tool suggestions FIRST (before generating normal response)
      if (!isOnboarding) { // Only suggest tools for completed onboarding
        console.log('🔧 [SERVICE] Checking for tool suggestions (post-onboarding)')
        try {
          
          // Get enabled tools for this organization
          console.log('🛠️ [SERVICE] Getting enabled tools')
          const enabledTools = await this.getEnabledTools(organization.id)
          console.log('✅ [SERVICE] Enabled tools retrieved:', enabledTools)
          
          // Analyze conversation for tool opportunities FIRST
          console.log('🤖 [SERVICE] Analyzing conversation for tool suggestions')
          const toolSuggestion = await ToolIntentService.generateToolSuggestion(
            messages,
            organization.id,
            enabledTools
          )
          console.log('🔍 [SERVICE] Tool suggestion analysis result:', {
            hasSuggestion: !!toolSuggestion,
            toolName: toolSuggestion?.toolName
          })
          
          // If we have a suggestion, return it instead of generating normal response
          if (toolSuggestion) {
            console.log(`🔧 Tool suggestion found: ${toolSuggestion.toolName} - returning suggestion instead of normal response`)
            
            const suggestionResponse = {
              aiMessage: toolSuggestion.content,
              multipleChoices: undefined,
              allowMultiple: undefined,
              setupCompleted: true,
              // Add metadata for UI styling
              suggestionMeta: {
                type: 'tool_suggestion',
                toolName: toolSuggestion.toolName,
                isToolSuggestion: true
              }
            }
            
            await this.storeConversation(messages, suggestionResponse.aiMessage, context)
            progressEmitter?.('phase', { name: 'done' })
            
            return {
              ...suggestionResponse,
              organization
            }
          }
        } catch (error) {
          // If tool suggestion analysis fails, log error but continue with normal flow
          console.error('🚨 [SERVICE] Tool suggestion analysis failed, falling back to normal response:', error)
        }
      } else {
        console.log('⏭️ [SERVICE] Skipping tool suggestions - still in onboarding mode')
      }
      
      // FALLBACK: Generate normal AI response only if no tool suggestion was found
      console.log('💬 [SERVICE] No tool suggestion found - generating normal AI response')
      const response = await this.handleChatFlow(messages, context, isOnboarding, progressEmitter)
      console.log('✅ [SERVICE] handleChatFlow completed:', {
        hasAiMessage: !!response.aiMessage,
        hasMultipleChoices: !!response.multipleChoices,
        allowMultiple: response.allowMultiple,
        setupCompleted: response.setupCompleted
      })
      
      console.log('💾 [SERVICE] Storing conversation')
      await this.storeConversation(messages, response.aiMessage, context)
      console.log('✅ [SERVICE] Conversation stored')
      
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
        let currentStage: string | undefined
        
        if (promptType === 'business') {
          isSetupCompleted = true
          currentStage = undefined // Business mode doesn't have stages
        } else {
      // For onboarding, always use onboarding prompt regardless of completion status
      // We still get the progress for currentStage context
      
          const onboardingService = new IntegratedOnboardingService()
          const progress = await onboardingService.getOnboardingProgress(context.organization.id)
      isSetupCompleted = false // Force onboarding prompt when promptType is 'onboarding'
          currentStage = progress.currentStage
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
   * Legacy OpenAI API call (kept for backward compatibility)
   * @deprecated Use callStructuredOpenAI instead
   */
  private async callOpenAI(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
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
        aiMessage = 'I apologize, but there was a formatting error in my response. Please try again.'
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
        aiMessage: "I'm sorry, but I couldn't retrieve your business knowledge at this time. Please try again later or contact support if the problem persists."
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
        console.log('🎯 [STRUCTURED] Using OnboardingQuestionSchema for structured output')
        structuredResponse = await this.callStructuredOpenAI<OnboardingQuestionResponse>(
          systemPrompt, 
          enhancedMessages, 
          OnboardingQuestionSchema,
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
      
      // Extract business question data from structured response
      if ('field_name' in structuredResponse && 'field_type' in structuredResponse) {
        const questionResp = structuredResponse as OnboardingQuestionResponse | BusinessQuestionResponse
        
        businessQuestion = {
          question_template: questionResp.question_template,
          field_name: questionResp.field_name,
          field_type: questionResp.field_type,
          multiple_choices: questionResp.multiple_choices || null
        }
        
        if (questionResp.field_type === 'multiple_choice' && questionResp.multiple_choices) {
          multipleChoices = questionResp.multiple_choices
          allowMultiple = questionResp.allow_multiple || false
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
        
        const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join(' ')
        console.log('💬 [VALIDATE] User messages to validate:', {
          messageCount: messages.filter(m => m.role === 'user').length,
          combinedLength: userMessages.length,
          content: userMessages.substring(0, 200) + (userMessages.length > 200 ? '...' : '')
        })
        
        if (userMessages.trim()) {
          // Check if the pending question was answered
          console.log('🤖 [VALIDATE] Calling AI validation service')
          const validationResult = await validationService.validateAnswerWithAI(
            userMessages, 
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
      const userMessage = messages[messages.length - 1]?.content || ''
      console.log('💾 Processing conversation storage for organization:', context.organization.id)
      
      // Step 1: Check if conversation exchange is business relevant
  
      
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
      const { scrapingService } = await import('@/lib/shared/services/scrapingService');
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