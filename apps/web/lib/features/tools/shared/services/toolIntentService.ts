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
  'mobile-branding': ToolIntent
}

export class ToolIntentService {
  private static readonly intents: ToolIntentDefinitions = {
    appointments: {
      intent: "Si la persona desea agendar una cita, reservar una consulta, preguntar por disponibilidad o necesita programar una reunión, devuelve la intención 'appointments'. Incluye solicitudes de agenda, programación, acceso al calendario o preguntas sobre fechas y horarios.",
      triggerWords: ["agendar", "cita", "reservar", "agenda", "calendario", "disponibilidad", "horario", "fecha", "consulta", "reunión", "schedule", "appointment", "book", "meeting"],
      description: "Agendado y reserva de citas"
    },
    
    payments: {
      intent: "Si la persona quiere realizar un pago, pregunta por precios, costos, facturación o necesita completar una transacción, devuelve la intención 'payments'. Incluye cobros, facturas y preguntas sobre tarifas.",
      triggerWords: ["pago", "pagar", "precio", "costo", "factura", "cobro", "tarifa", "dinero", "transacción", "comprar", "pay", "payment", "price", "billing"],
      description: "Procesamiento de pagos y facturación"
    },
    
    documents: {
      intent: "Si la persona necesita firmar documentos, revisar contratos, completar formularios o manejar tareas relacionadas a documentos, devuelve la intención 'documents'. Incluye firmas digitales, revisión de contratos y procesamiento de archivos.",
      triggerWords: ["documento", "contrato", "firmar", "firma", "papelería", "formulario", "acuerdo", "document", "contract", "signature"],
      description: "Firma y gestión de documentos"
    },
    
    intake_forms: {
      intent: "Si la persona debe llenar formularios, proporcionar información, completar un proceso de admisión u onboarding, devuelve la intención 'intake_forms'. Incluye recopilación de información y llenado de formularios.",
      triggerWords: ["formulario", "información", "registro", "ingreso", "admisión", "llenar", "completar", "enviar", "form", "intake", "questionnaire"],
      description: "Recopilación de información y formularios"
    },
    
    faqs: {
      intent: "Si la persona hace preguntas generales, necesita ayuda para entender los servicios o quiere información frecuente, devuelve la intención 'faqs'. Incluye dudas comunes y solicitudes de orientación.",
      triggerWords: ["ayuda", "pregunta", "faq", "información", "explicar", "qué", "cómo", "por qué", "general", "help", "question"],
      description: "Preguntas frecuentes y ayuda general"
    },
    
    'mobile-branding': {
      intent: "Si la persona quiere personalizar la app móvil, cambiar colores, subir logos, modificar la marca o configurar la versión white-label, devuelve la intención 'mobile-branding'. Incluye solicitudes de personalización y branding.",
      triggerWords: ["branding", "personalizar", "colores", "logo", "tema", "apariencia", "app móvil", "white label", "marca"],
      description: "Branding y personalización de la app móvil"
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
DETECCION DE INTENCIONES:
Debes analizar cada mensaje y detectar si la persona necesita herramientas especificas. Cuando el mensaje coincida con alguna de estas condiciones, incluye la intención correspondiente en tu respuesta:

${intentInstructions}

REQUISITOS DE RESPUESTA:
- Proporciona una respuesta natural y útil.
- Detecta cualquier intención que coincida claramente con la solicitud.
- Puedes devolver múltiples intenciones si piden varias cosas.
- Si no hay coincidencias, devuelve un arreglo de intenciones vacío.
- Mantén un tono conversacional y servicial sin importar las intenciones detectadas.
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
      
      const response = await openAIService.callCompletion(messages, {
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
