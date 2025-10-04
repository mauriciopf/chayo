import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Tool Intent Service - Clean OpenAI Function Calling Implementation
 * 
 * This service provides function definitions and handlers for OpenAI's function calling
 * to automatically fetch data from Supabase when users ask relevant questions.
 * 
 * SOLID Principles:
 * - Single Responsibility: Each function handler does ONE thing
 * - Open/Closed: Easy to extend with new tools without modifying existing code
 * - Dependency Inversion: Depends on Supabase abstraction, not concrete implementation
 */

export interface ToolFunction {
  type: 'function'
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, any>
    required: string[]
    additionalProperties: boolean
  }
  strict: boolean
}

export interface FunctionCallResult {
  success: boolean
  data?: any
  error?: string
}

export class ToolIntentService {
  /**
   * Get all available function definitions for enabled tools
   */
  static getFunctionDefinitions(enabledTools: string[]): ToolFunction[] {
    const allFunctions: Record<string, ToolFunction> = {
      products: this.getProductsFunctionDefinition(),
      appointments: this.getAppointmentsFunctionDefinition(),
      faqs: this.getFAQsFunctionDefinition(),
    }

    return enabledTools
      .filter(tool => tool in allFunctions)
      .map(tool => allFunctions[tool])
  }

  /**
   * Handle function calls from OpenAI
   * @param supabase - Server-side Supabase client (MUST be server-side for API routes)
   */
  static async handleFunctionCall(
    functionName: string,
    arguments_: any,
    organizationId: string,
    supabase: SupabaseClient
  ): Promise<FunctionCallResult> {
    try {
      switch (functionName) {
        case 'get_products':
          return await this.handleGetProducts(arguments_, organizationId, supabase)
        case 'get_appointments':
          return await this.handleGetAppointments(arguments_, organizationId, supabase)
        case 'get_faqs':
          return await this.handleGetFAQs(arguments_, organizationId, supabase)
        default:
          return {
            success: false,
            error: `Unknown function: ${functionName}`
          }
      }
    } catch (error) {
      console.error(`Error handling function call ${functionName}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ============================================================================
  // PRODUCTS TOOL
  // ============================================================================

  private static getProductsFunctionDefinition(): ToolFunction {
    return {
      type: 'function',
      name: 'get_products',
      description: 'Obtener lista completa de productos y servicios disponibles del negocio. Usa esta función cuando el usuario pregunte sobre productos, servicios, precios, catálogo o quiera ver qué ofreces.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false
      },
      strict: true
    }
  }

  private static async handleGetProducts(
    args: { category?: string; search_term?: string; limit?: number },
    organizationId: string,
    supabase: SupabaseClient
  ): Promise<FunctionCallResult> {
    try {
      const { search_term, limit = 10 } = args

      // Use products_list_tool table (same as /api/products)
      let query = supabase
        .from('products_list_tool')
        .select('*')
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false })
        .limit(limit)

      // Apply search filter if provided
      if (search_term) {
        query = query.or(`name.ilike.%${search_term}%,description.ilike.%${search_term}%`)
      }

      const { data: products, error } = await query

      if (error) {
        console.error('Error fetching products:', error)
        return {
          success: false,
          error: 'Error al obtener productos'
        }
      }

      // Format products for AI
      const formattedProducts = (products || []).map(p => ({
        name: p.name,
        description: p.description,
        price: p.price,
        image_url: p.image_url
      }))

      return {
        success: true,
        data: {
          products: formattedProducts,
          total: products?.length || 0
        }
      }
    } catch (error) {
      console.error('Error in handleGetProducts:', error)
      return {
        success: false,
        error: 'Error interno al obtener productos'
      }
    }
  }

  // ============================================================================
  // APPOINTMENTS TOOL
  // ============================================================================

  private static getAppointmentsFunctionDefinition(): ToolFunction {
    return {
      type: 'function',
      name: 'get_appointments',
      description: 'Obtener información sobre el sistema de citas y reservas del negocio, incluyendo proveedor y URL de agendamiento. Usa esta función cuando el usuario quiera agendar una cita, reservar, consultar disponibilidad o pregunte sobre horarios.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false
      },
      strict: true
    }
  }

  private static async handleGetAppointments(
    args: any,
    organizationId: string,
    supabase: SupabaseClient
  ): Promise<FunctionCallResult> {
    try {
      // Get appointment settings from appointment_settings table
      const { data: appointmentSettings, error: settingsError } = await supabase
        .from('appointment_settings')
        .select('provider, provider_url')
        .eq('organization_id', organizationId)
        .single()

      if (settingsError || !appointmentSettings?.provider_url) {
        return {
          success: false,
          error: 'El sistema de citas no está configurado.'
        }
      }

      return {
        success: true,
        data: {
          configured: true,
          provider: appointmentSettings.provider,
          provider_url: appointmentSettings.provider_url,
          message: 'Para agendar una cita, puedes usar nuestro sistema de reservas.'
        }
      }
    } catch (error) {
      console.error('Error in handleGetAppointments:', error)
      return {
        success: false,
        error: 'Error al consultar información de citas'
      }
    }
  }

  // ============================================================================
  // FAQs TOOL
  // ============================================================================

  private static getFAQsFunctionDefinition(): ToolFunction {
    return {
      type: 'function',
      name: 'get_faqs',
      description: 'Obtener respuestas a preguntas frecuentes del negocio. Usa esta función cuando el usuario haga preguntas generales sobre el negocio, necesite información básica, políticas, o pregunte sobre temas comunes.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false
      },
      strict: true
    }
  }

  private static async handleGetFAQs(
    args: { question?: string; category?: string; limit?: number },
    organizationId: string,
    supabase: SupabaseClient
  ): Promise<FunctionCallResult> {
    try {
      const { question, category, limit = 5 } = args

      // Get FAQs from the agent_tools settings
      const { data: faqConfig, error: configError } = await supabase
        .from('agent_tools')
        .select('settings')
        .eq('organization_id', organizationId)
        .eq('tool_type', 'faqs')
        .eq('enabled', true)
          .single()

      if (configError || !faqConfig?.settings?.faqs) {
        return {
          success: false,
          error: 'Las preguntas frecuentes no están configuradas.'
        }
      }

      let faqs = faqConfig.settings.faqs

      // Filter by category if specified
      if (category) {
        faqs = faqs.filter((faq: any) => 
          faq.category?.toLowerCase().includes(category.toLowerCase())
        )
      }

      // Search by question if specified
      if (question) {
        const searchTerm = question.toLowerCase()
        faqs = faqs.filter((faq: any) => 
          faq.question?.toLowerCase().includes(searchTerm) ||
          faq.answer?.toLowerCase().includes(searchTerm)
        )
      }

      // Apply limit
      faqs = faqs.slice(0, limit)

      return {
        success: true,
        data: {
          faqs,
          total: faqs.length,
          question,
          category
        }
      }
    } catch (error) {
      console.error('Error in handleGetFAQs:', error)
      return {
        success: false,
        error: 'Error interno al obtener preguntas frecuentes'
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get enabled tools for an organization
   */
  static async getEnabledTools(organizationId: string, supabase: SupabaseClient): Promise<string[]> {
    try {
      const { data: tools, error } = await supabase
        .from('agent_tools')
        .select('tool_type')
        .eq('organization_id', organizationId)
        .eq('enabled', true)

      if (error) {
        console.error('Error fetching enabled tools:', error)
        return []
      }

      return tools?.map(tool => tool.tool_type) || []
    } catch (error) {
      console.error('Error in getEnabledTools:', error)
      return []
    }
  }

  /**
   * Check if a specific tool is enabled
   */
  static async isToolEnabled(organizationId: string, toolType: string, supabase: SupabaseClient): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('agent_tools')
        .select('enabled')
        .eq('organization_id', organizationId)
        .eq('tool_type', toolType)
        .single()

      if (error) {
        return false
      }

      return data?.enabled || false
    } catch (error) {
      console.error('Error checking tool status:', error)
      return false
    }
  }
}