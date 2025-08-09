export interface TrainingHint {
  label: string
  description: string
  isActive: boolean
}

export interface TrainingHintContext {
  hint: TrainingHint | null
  systemPromptAddition: string
  hasActiveHint: boolean
}

/**
 * Service responsible for managing training hints and their context
 */
export class TrainingHintService {
  /**
   * Extract training hint information from chat messages
   */
  static extractFromMessages(messages: any[]): TrainingHintContext {
    // Find all training hint system messages
    const trainingHintMessages = messages.filter(m => 
      m.role === 'system' && 
      (m.content.includes('🎯 Training Focus:') || m.content.includes('🔄 Training Focus:'))
    )

    // No training hints found
    if (trainingHintMessages.length === 0) {
      return {
        hint: null,
        systemPromptAddition: '',
        hasActiveHint: false
      }
    }

    // Get the most recent training hint
    const latestHint = trainingHintMessages[trainingHintMessages.length - 1]
    
    // Check if focus was cleared
    if (latestHint.content.includes('🔄 Training Focus: Cleared')) {
      return {
        hint: null,
        systemPromptAddition: this.generateGeneralFocusPrompt(),
        hasActiveHint: false
      }
    }

    // Parse active training hint
    if (latestHint.content.includes('🎯 Training Focus:') && !latestHint.content.includes('Cleared')) {
      const parsedHint = this.parseHintFromMessage(latestHint.content)
      
      if (parsedHint) {
        return {
          hint: parsedHint,
          systemPromptAddition: this.generateFocusedPrompt(parsedHint),
          hasActiveHint: true
        }
      }
    }

    // Default fallback
    return {
      hint: null,
      systemPromptAddition: '',
      hasActiveHint: false
    }
  }

  /**
   * Parse training hint details from a system message
   */
  private static parseHintFromMessage(messageContent: string): TrainingHint | null {
    const hintMatch = messageContent.match(/🎯 Training Focus: (.+?) - (.+?)\. Please adjust/)
    
    if (hintMatch) {
      const [, label, description] = hintMatch
      return {
        label: label.trim(),
        description: description.trim(),
        isActive: true
      }
    }

    return null
  }

  /**
   * Generate focused system prompt addition for a specific training hint
   */
  private static generateFocusedPrompt(hint: TrainingHint): string {
    return `
## CURRENT TRAINING FOCUS:
**${hint.label}**
${hint.description}

🎯 IMPORTANT: Adjust your questions to focus specifically on this area. Ask targeted questions that will help gather information relevant to ${hint.label.toLowerCase()}. Your next question should directly relate to improving this aspect of their business.
`
  }

  /**
   * Generate general focus prompt when no specific hint is active
   */
  private static generateGeneralFocusPrompt(): string {
    return `
## GENERAL BUSINESS FOCUS:
No specific training focus selected. Continue with general business information gathering and customer-related questions.
`
  }

  /**
   * Create a system message for setting a training hint
   */
  static createFocusMessage(hint: { label: string; description: string }): string {
    return `🎯 Training Focus: ${hint.label} - ${hint.description}. Please adjust your next questions to focus on this area and gather relevant information to improve the business in this aspect.`
  }

  /**
   * Create a system message for clearing training focus
   */
  static createClearFocusMessage(): string {
    return `🔄 Training Focus: Cleared. Continue with general business information gathering and customer-related questions.`
  }

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
      const { supabase } = await import('@/lib/shared/supabase/client')
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
      const { OpenAIService } = await import('@/lib/shared/services/OpenAIService')
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