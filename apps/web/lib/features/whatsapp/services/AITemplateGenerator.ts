/**
 * AITemplateGenerator
 * 
 * Production-ready AI-powered WhatsApp template generation.
 * Uses OpenAI to generate templates that follow Meta's strict schema.
 * 
 * Features:
 * - Strict adherence to Meta WhatsApp template guidelines
 * - Tool-specific template generation
 * - Business context awareness
 * - Tone customization
 * - Validation and error handling
 */

import { TemplateComponent } from '../types/template.types'
import { ToolType, TOOL_CONFIGS } from '@/lib/features/tools/shared/services/ToolSystemService'
import { openAIService } from '@/lib/shared/services/OpenAIService'

export interface TemplateGenerationOptions {
  toolType: ToolType
  businessName?: string
  businessType?: string
  tone: 'formal' | 'casual' | 'friendly'
  language: 'es' | 'en'
}

export class AITemplateGenerator {
  
  /**
   * Generate WhatsApp template message text using AI
   * Returns just the message text - we'll wrap it in a fixed template structure
   */
  static async generateTemplateText(
    options: TemplateGenerationOptions
  ): Promise<string> {
    
    const toolConfig = TOOL_CONFIGS[options.toolType]
    const systemPrompt = this.buildSystemPrompt(options)
    const userPrompt = this.buildUserPrompt(options, toolConfig)

    try {
      // Simple text generation - no complex schema needed
      const result = await openAIService.callCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        {
          model: 'gpt-4o',
          temperature: 0.7,
          maxTokens: 500
        }
      )

      const messageText = result.trim()

      // Basic validation
      if (!messageText || messageText.length < 10) {
        throw new Error('Generated message is too short')
      }

      if (messageText.length > 900) { // Leave room for our wrapper
        throw new Error('Generated message is too long')
      }

      return messageText
      
    } catch (error) {
      console.error('❌ Failed to generate template text:', error)
      throw new Error(`Template generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Build complete WhatsApp template structure
   * Takes AI-generated text and wraps it in Meta-compliant template
   * 
   * For reminders: Body is static, no dynamic message injection needed
   * For other tools: Body explains the tool with dynamic link in button
   */
  static buildTemplateComponents(
    messageText: string,
    options: {
      toolType: ToolType
      businessName: string
      language: 'es' | 'en'
    }
  ): TemplateComponent[] {
    const toolConfig = TOOL_CONFIGS[options.toolType]
    const isSpanish = options.language === 'es'

    // For reminders, we need a different structure (dynamic message per reminder)
    if (options.toolType === 'reminders') {
      return this.buildReminderTemplate(messageText, options)
    }

    // For other tools: Standard structure with static body
    return [
      // HEADER
      {
        type: 'HEADER',
        format: 'TEXT',
        text: `${toolConfig.icon} ${toolConfig.displayName}`
      },
      // BODY with AI-generated text (static)
      {
        type: 'BODY',
        text: messageText
      },
      // FOOTER
      {
        type: 'FOOTER',
        text: options.businessName
      },
      // BUTTONS with dynamic link
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: isSpanish ? 'Ver Enlace' : 'View Link',
            url: 'https://chayo.onelink.me/SB63?deep_link_value={{1}}',
            example: ['mi-negocio']
          }
        ]
      }
    ]
  }

  /**
   * Build reminder-specific template with dynamic message parameter
   * Reminder text changes per reminder, so we need {{1}} in the body
   */
  private static buildReminderTemplate(
    _exampleText: string, // Not used for reminders, but kept for consistency
    options: {
      toolType: ToolType
      businessName: string
      language: 'es' | 'en'
    }
  ): TemplateComponent[] {
    const isSpanish = options.language === 'es'

    return [
      // HEADER
      {
        type: 'HEADER',
        format: 'TEXT',
        text: isSpanish ? '⏰ Recordatorio' : '⏰ Reminder'
      },
      // BODY with dynamic message parameter
      {
        type: 'BODY',
        text: isSpanish 
          ? 'Hola! 👋\n\nTe enviamos este recordatorio:\n\n{{1}}\n\nSaludos,'
          : 'Hello! 👋\n\nWe\'re sending you this reminder:\n\n{{1}}\n\nBest regards,',
        example: {
          body_text: [['Tu cita es mañana a las 10:00 AM']]
        }
      },
      // FOOTER
      {
        type: 'FOOTER',
        text: options.businessName
      }
    ]
  }

  /**
   * Build system prompt for simple text generation
   */
  private static buildSystemPrompt(options: TemplateGenerationOptions): string {
    return `You are a professional copywriter creating WhatsApp business messages.

RULES:
- Write in ${options.language === 'es' ? 'Spanish' : 'English'}
- Tone: ${options.tone} (${options.tone === 'formal' ? 'use Usted' : options.tone === 'casual' ? 'use Tú' : 'warm and friendly'})
- Length: 50-200 words maximum
- Format: Plain text, no markdown
- Category: UTILITY (informational, not promotional)
- NO discount offers or promotional language
- NO emojis in the text
- Professional and helpful
- Include a clear call-to-action

Your message will be wrapped in a template with:
- Header: Tool icon and name
- Footer: Business name
- Button: Link to access the tool

Generate ONLY the message body text. Do not include greetings or signatures - just the core message.`
  }

  /**
   * Build user prompt with context
   */
  private static buildUserPrompt(
    options: TemplateGenerationOptions,
    toolConfig: any
  ): string {
    const businessName = options.businessName || 'our business'
    const action = this.getToolAction(options.toolType, options.language)
    
    return `Write a WhatsApp message body for sharing ${toolConfig.displayName}.

Context:
- Business: ${businessName}
- Type: ${options.businessType || 'general business'}
- Purpose: Customer will click the button to ${action}
- Tone: ${options.tone}

The message should:
1. Briefly explain what this tool/feature is
2. Mention the benefit to the customer
3. Invite them to click the button below to access it

Write ONLY the message text (2-3 sentences), nothing else.`
  }

  /**
   * Get tool-specific action description
   */
  private static getToolAction(toolType: ToolType, language: 'es' | 'en'): string {
    const actions: Record<ToolType, Record<'es' | 'en', string>> = {
      reservations: {
        es: 'hacer una reservación',
        en: 'make a reservation'
      },
      products: {
        es: 'ver nuestro catálogo de productos',
        en: 'view our product catalog'
      },
      intake_forms: {
        es: 'completar un formulario',
        en: 'fill out a form'
      },
      documents: {
        es: 'revisar un documento',
        en: 'review a document'
      },
      vibe_card: {
        es: 'conocer más sobre nosotros',
        en: 'learn more about us'
      },
      customer_support: {
        es: 'obtener soporte',
        en: 'get support'
      },
      faqs: {
        es: 'ver preguntas frecuentes',
        en: 'view FAQs'
      },
      payments: {
        es: 'realizar un pago',
        en: 'make a payment'
      },
      reminders: {
        es: 'recibir recordatorios',
        en: 'receive reminders'
      }
    }
    
    return actions[toolType]?.[language] || 'usar esta herramienta'
  }
}

