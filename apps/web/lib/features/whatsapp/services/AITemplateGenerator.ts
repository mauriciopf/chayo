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

import OpenAI from 'openai'
import { TemplateComponent } from '../types/template.types'
import { ToolType, TOOL_CONFIGS } from '@/lib/features/tools/shared/services/ToolSystemService'

export interface TemplateGenerationOptions {
  toolType: ToolType
  businessName?: string
  businessType?: string
  tone: 'formal' | 'casual' | 'friendly'
  language: 'es' | 'en'
}

export class AITemplateGenerator {
  
  /**
   * Generate a WhatsApp template using OpenAI
   * Returns components array ready for Meta API submission
   */
  static async generateTemplate(
    options: TemplateGenerationOptions
  ): Promise<TemplateComponent[]> {
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    const toolConfig = TOOL_CONFIGS[options.toolType]
    const systemPrompt = this.buildSystemPrompt(options)
    const userPrompt = this.buildUserPrompt(options, toolConfig)

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      if (!content) {
        throw new Error('Empty response from OpenAI')
      }

      const generated = JSON.parse(content)
      
      if (!generated.components || !Array.isArray(generated.components)) {
        throw new Error('Invalid template structure from AI')
      }

      // Validate generated template
      this.validateTemplate(generated.components)
      
      return generated.components
      
    } catch (error) {
      console.error('❌ Failed to generate template:', error)
      throw new Error(`Template generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Build system prompt with Meta's strict rules
   */
  private static buildSystemPrompt(options: TemplateGenerationOptions): string {
    return `You are an expert WhatsApp Business API template designer following Meta's v23.0 specification.

CRITICAL RULES (violation = rejection by Meta):

1. COMPONENT TYPES (use only these):
   - HEADER (optional): Short title, max 60 chars
   - BODY (required): Main message, max 1024 chars
   - FOOTER (optional): Short note, max 60 chars
   - BUTTONS (optional): Call-to-action buttons

2. PARAMETERS:
   - Use POSITIONAL format: {{1}}, {{2}}, etc.
   - Must provide "example" field for ALL parameters
   - Parameters in URL buttons must have examples array

3. CATEGORY = UTILITY (not promotional):
   - Be informational, not sales-focused
   - No discount offers or promotions
   - Professional and helpful tone
   - Focus on providing value/service

4. TEXT GUIDELINES:
   - Clear and concise
   - No emojis in BODY (optional in HEADER/FOOTER)
   - Professional language
   - Include call-to-action
   - Mention parameter purpose clearly

5. URL BUTTON:
   - Must use {{1}} for dynamic link
   - Text max 25 characters
   - Must include example array

6. LANGUAGE = ${options.language === 'es' ? 'Spanish' : 'English'}

7. OUTPUT FORMAT:
   Return ONLY valid JSON: { "components": [...] }
   No markdown, no explanation, just the JSON object.

TONE: ${options.tone}
- formal: Usted, professional, business-like
- casual: Tú, relaxed but respectful
- friendly: Warm, helpful, conversational

Your goal: Create a template that Meta will approve on first submission.`
  }

  /**
   * Build user prompt with specific context
   */
  private static buildUserPrompt(
    options: TemplateGenerationOptions,
    toolConfig: any
  ): string {
    const businessName = options.businessName || 'nuestro negocio'
    const action = this.getToolAction(options.toolType, options.language)
    
    return `Generate a WhatsApp template for sharing ${toolConfig.displayName} (${options.toolType}).

Context:
- Business: ${businessName}
- Type: ${options.businessType || 'general'}
- Purpose: Customer will click link to ${action}
- Tone: ${options.tone}

Template should:
1. Have a HEADER with emoji: ${toolConfig.icon} ${toolConfig.displayName}
2. Have a BODY that:
   - Greets the customer
   - Explains what the link is for (${action})
   - Uses {{1}} parameter for the link text in body
   - Invites them to click
   - Max 1024 characters
3. Have a FOOTER with business name: "${businessName}"
4. Have a BUTTONS array with ONE URL button:
   - Text: Action-oriented (max 25 chars)
   - url: {{1}} (dynamic parameter)
   - example: ["https://chayo.onelink.me/example"]

Example structure:
{
  "components": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "📅 Reservaciones",
      "example": { "header_text": ["📅 Reservaciones"] }
    },
    {
      "type": "BODY",
      "text": "Hola! Aquí puedes reservar...",
      "example": { "body_text": [["https://example.com"]] }
    },
    {
      "type": "FOOTER",
      "text": "Mi Negocio"
    },
    {
      "type": "BUTTONS",
      "buttons": [{
        "type": "URL",
        "text": "Reservar",
        "url": "{{1}}",
        "example": ["https://example.com"]
      }]
    }
  ]
}

Generate the template now. Return ONLY the JSON, nothing else.`
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
      forms: {
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
      intake_forms: {
        es: 'completar formulario de ingreso',
        en: 'complete intake form'
      },
      payments: {
        es: 'realizar un pago',
        en: 'make a payment'
      }
    }
    
    return actions[toolType]?.[language] || 'usar esta herramienta'
  }

  /**
   * Validate generated template structure
   */
  private static validateTemplate(components: TemplateComponent[]): void {
    // Must have BODY component
    const bodyComponent = components.find(c => c.type === 'BODY')
    if (!bodyComponent || !bodyComponent.text) {
      throw new Error('Template must have a BODY component with text')
    }

    // BODY must have example if it has parameters
    if (bodyComponent.text.includes('{{') && !bodyComponent.example?.body_text) {
      throw new Error('BODY with parameters must include example.body_text')
    }

    // Validate HEADER if present
    const headerComponent = components.find(c => c.type === 'HEADER')
    if (headerComponent) {
      if (headerComponent.format === 'TEXT' && !headerComponent.text) {
        throw new Error('TEXT HEADER must have text field')
      }
      if (headerComponent.text && headerComponent.text.length > 60) {
        throw new Error('HEADER text must be max 60 characters')
      }
    }

    // Validate FOOTER if present
    const footerComponent = components.find(c => c.type === 'FOOTER')
    if (footerComponent && footerComponent.text && footerComponent.text.length > 60) {
      throw new Error('FOOTER text must be max 60 characters')
    }

    // Validate BUTTONS if present
    const buttonsComponent = components.find(c => c.type === 'BUTTONS')
    if (buttonsComponent && buttonsComponent.buttons) {
      for (const button of buttonsComponent.buttons) {
        if (!button.text || button.text.length > 25) {
          throw new Error('Button text must be 1-25 characters')
        }
        if (button.type === 'URL' && button.url?.includes('{{') && !button.example) {
          throw new Error('URL button with parameter must include example array')
        }
      }
    }

    // Check BODY length
    if (bodyComponent.text.length > 1024) {
      throw new Error('BODY text must be max 1024 characters')
    }
  }
}

