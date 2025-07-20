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
} 