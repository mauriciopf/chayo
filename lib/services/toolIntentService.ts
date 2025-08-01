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

RESPONSE FORMAT:
Always respond with a JSON structure like this:
{
  "response": "Your helpful response to the user",
  "intents": ["tool_name"] // Array of detected intents (can be empty, single, or multiple)
}

IMPORTANT:
- Only include intents that clearly match the user's request
- Multiple intents are allowed if the user asks for multiple things
- If no intents match, return an empty intents array
- Always provide a helpful response regardless of intents detected
- The response should be natural and conversational
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
}