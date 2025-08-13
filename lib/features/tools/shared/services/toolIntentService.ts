import { supabase } from '@/lib/shared/supabase/client'
import { OpenAIService } from '@/lib/shared/services/OpenAIService'

/**
 * Tool Intent Service
 * Manages intent definitions for AI-driven tool suggestions
 */

export interface ToolIntent {
  intent: string
  triggerWords: string[]
  description: string
}

export interface ToolIntentDefinitions {
  appointments: ToolIntent
  payments: ToolIntent
  documents: ToolIntent
  intake_forms: ToolIntent
  faqs: ToolIntent
}

export class ToolIntentService {
  private static readonly intents: ToolIntentDefinitions = {
    appointments: {
      intent: "If the user wants to schedule an appointment, book a consultation, ask about availability, or needs to set up a meeting, return intent 'appointments'. This includes requests for booking, scheduling, calendar access, or time-related inquiries.",
      triggerWords: ["schedule", "appointment", "book", "meeting", "consultation", "calendar", "availability", "time", "date", "reserve"],
      description: "Scheduling and appointment booking"
    },
    
    payments: {
      intent: "If the user wants to make a payment, asks about pricing, costs, billing, or needs to complete a financial transaction, return intent 'payments'. This includes payment processing, invoicing, or cost inquiries.",
      triggerWords: ["pay", "payment", "price", "cost", "bill", "invoice", "charge", "fee", "money", "purchase"],
      description: "Payment processing and billing"
    },
    
    documents: {
      intent: "If the user needs to sign documents, review contracts, complete paperwork, or handle any document-related tasks, return intent 'documents'. This includes digital signatures, contract reviews, or document processing.",
      triggerWords: ["sign", "document", "contract", "paperwork", "agreement", "form", "signature", "review", "terms"],
      description: "Document signing and processing"
    },
    
    intake_forms: {
      intent: "If the user needs to fill out forms, provide personal information, complete an intake process, or submit details for onboarding, return intent 'intake_forms'. This includes information gathering and form completion.",
      triggerWords: ["form", "information", "intake", "details", "fill", "complete", "submit", "questionnaire", "survey"],
      description: "Information collection and form completion"
    },
    
    faqs: {
      intent: "If the user asks general questions, needs help understanding services, wants frequently asked information, or requires general assistance, return intent 'faqs'. This includes general inquiries and common questions.",
      triggerWords: ["help", "question", "faq", "information", "explain", "what", "how", "why", "general"],
      description: "Frequently asked questions and general help"
    }
  }

  /**
   * Get all intent definitions
   */
  static getAllIntents(): ToolIntentDefinitions {
    return this.intents
  }

  /**
   * Get intent definition for a specific tool
   */
  static getIntentForTool(toolType: keyof ToolIntentDefinitions): ToolIntent | null {
    return this.intents[toolType] || null
  }

  /**
   * Get intents for enabled tools only
   */
  static getIntentsForEnabledTools(enabledTools: string[]): Record<string, ToolIntent> {
    const result: Record<string, ToolIntent> = {}
    
    enabledTools.forEach(toolType => {
      if (toolType in this.intents) {
        result[toolType] = this.intents[toolType as keyof ToolIntentDefinitions]
      }
    })
    
    return result
  }

  /**
   * Build system prompt instructions for intent detection
   */
  static buildIntentInstructions(enabledTools: string[]): string {
    const enabledIntents = this.getIntentsForEnabledTools(enabledTools)
    
    if (Object.keys(enabledIntents).length === 0) {
      return ""
    }

    const intentInstructions = Object.entries(enabledIntents)
      .map(([toolType, intent]) => `- ${intent.intent}`)
      .join('\n')

    return `
INTENT DETECTION:
You must analyze each user message and detect if they need specific tools. When a user's message matches any of these conditions, include the corresponding intent in your response:

${intentInstructions}

RESPONSE REQUIREMENTS:
- Provide a helpful, natural response to the user
- Detect any tool intents that clearly match the user's request
- Multiple intents are allowed if the user asks for multiple things
- If no intents match, return an empty intents array
- Always be conversational and helpful regardless of intents detected
`
  }

  /**
   * Parse intents from AI response
   */
  static parseIntentsFromResponse(response: string): { content: string; intents: string[] } {
    try {
      const parsed = JSON.parse(response)
      return {
        content: parsed.response || response,
        intents: Array.isArray(parsed.intents) ? parsed.intents : []
      }
    } catch (error) {
      // Fallback: if response is not JSON, return as-is with no intents
      return {
        content: response,
        intents: []
      }
    }
  }

  /**
   * Validate intent against enabled tools
   */
  static validateIntents(intents: string[], enabledTools: string[]): string[] {
    return intents.filter(intent => enabledTools.includes(intent))
  }

  // ============================================================================
  // AI-DRIVEN TOOL SUGGESTIONS FUNCTIONALITY
  // ============================================================================

  /**
   * Analyze conversation for tool suggestions using AI
   */
  static async generateToolSuggestion(
    messages: any[],
    organizationId: string,
    enabledTools: string[] = []
  ): Promise<{ content: string; toolName: string } | null> {
    try {
      // Only skip if conversation is too short (less than 2 exchanges minimum)
      if (messages.length < 4) { // 2 user + 2 AI = 4 messages minimum for pattern detection
        return null
      }
      
      // Get conversation context (last few messages)
      const recentMessages = messages.slice(-6) // Last 6 messages for context
      const conversationContext = recentMessages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n')

      // Get business context from RAG/embeddings
      const businessContext = await this.getBusinessContext(organizationId)

      // Load and process the YAML system prompt
      const fs = require('fs')
      const path = require('path')
      
      const promptPath = path.join(process.cwd(), 'lib/features/chat/services/systemPrompt/SuggestedToolsSystemPrompt.yml')
      const yamlContent = fs.readFileSync(promptPath, 'utf8')
      
      // Simple YAML parsing for our basic structure (avoiding js-yaml dependency)
      // Extract the system_prompt content between the pipe and the next section
      const systemPromptMatch = yamlContent.match(/system_prompt:\s*\|\s*\n([\s\S]*?)(?=\n\S|\n$)/)
      const basePrompt = systemPromptMatch ? systemPromptMatch[1].trim() : yamlContent
      
      // Get the base system prompt and replace template variables
      let systemPrompt = basePrompt
        .replace('{{enabled_tools}}', enabledTools.join(', ') || 'none')
        .replace('{{conversation_context}}', conversationContext)
        .replace('{{business_context}}', businessContext)

      // Call AI for analysis (context already in systemPrompt)
      const response = await this.callAIForSuggestion(systemPrompt)
      
      // Check if AI explicitly said no suggestion
      if (!response || 
          response.toLowerCase().includes('null') ||
          response.toLowerCase().includes('no clear opportunity') ||
          response.trim().toLowerCase() === 'no clear opportunity') {
        console.log('🚫 AI determined no tool suggestion needed')
        return null
      }

      // Extract tool name and clean content
      const toolName = this.extractToolNameFromSuggestion(response)
      const cleanContent = this.cleanSuggestionContent(response)

      return {
        content: cleanContent,
        toolName: toolName || 'unknown'
      }
    } catch (error) {
      console.error('Error generating tool suggestion:', error)
      return null
    }
  }

  /**
   * Get business context from embeddings/RAG system
   */
  private static async getBusinessContext(organizationId: string): Promise<string> {
    try {
      // Get business info fields (both answered and with values)
  
      const { data: businessInfo } = await supabase
        .from('business_info_fields')
        .select('field_name, field_value')
        .eq('organization_id', organizationId)
        .not('field_value', 'is', null)
        .neq('field_value', '')

      if (!businessInfo || businessInfo.length === 0) {
        // Try to get organization basic info as fallback
        const { data: orgInfo } = await supabase
          .from('organizations')
          .select('name, description')
          .eq('id', organizationId)
          .single()

        if (orgInfo) {
          return `Business: ${orgInfo.name}${orgInfo.description ? '\nDescription: ' + orgInfo.description : ''}`
        }

        return 'New business, limited information available.'
      }

      return businessInfo
        .map(info => `${info.field_name}: ${info.field_value}`)
        .join('\n')
    } catch (error) {
      console.error('Error getting business context:', error)
      return 'Business context unavailable.'
    }
  }

  /**
   * Call AI service for tool suggestion analysis
   */
  private static async callAIForSuggestion(
    systemPrompt: string
  ): Promise<string | null> {
    try {
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: `Please analyze the conversation and business context provided in the system prompt to determine if any tools should be suggested.` }
      ]

      // Use the existing OpenAI service
  
      const openAIService = OpenAIService.getInstance()

      console.log('🤖 Calling AI for tool suggestion analysis')
      
      const response = await openAIService.callChatCompletion(messages, {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 200 // Keep suggestions concise
      })

      console.log('🤖 AI suggestion response:', response?.substring(0, 100) + '...')

      // Check if AI explicitly said no suggestion
      if (!response || 
          response.toLowerCase().includes('no clear opportunity') ||
          response.toLowerCase().includes('null') ||
          response.toLowerCase().trim() === 'no clear opportunity' ||
          response.length < 15) { // Increased minimum length for meaningful suggestions
        console.log('🚫 No tool suggestion generated:', response?.substring(0, 50) + '...')
        return null
      }

      return response.trim()
    } catch (error) {
      console.error('Error calling AI for suggestion:', error)
      return null
    }
  }

  /**
   * Extract tool name from AI suggestion response
   * AI provides structured format: [TOOL: toolname] followed by suggestion
   */
  private static extractToolNameFromSuggestion(suggestion: string): string | null {
    // Parse the structured format: [TOOL: toolname]
    const toolMatch = suggestion.match(/\[TOOL:\s*([^\]]+)\]/i)
    
    if (toolMatch) {
      const toolName = toolMatch[1].trim().toLowerCase()
      console.log(`🎯 AI specified tool: ${toolName}`)
      return toolName
    }

    // Fallback: AI didn't follow format, but we still want to show the suggestion
    console.log(`🤖 AI suggestion without structured format: ${suggestion.substring(0, 50)}...`)
    return 'general' // Generic type for unstructured suggestions
  }

  /**
   * Clean the suggestion content by removing the tool marker
   */
  private static cleanSuggestionContent(suggestion: string): string {
    // Remove the [TOOL: toolname] prefix to show only the user-facing message
    return suggestion.replace(/\[TOOL:\s*[^\]]+\]\s*/i, '').trim()
  }
}