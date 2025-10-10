/**
 * ToolSystemService - Centralized service for managing business tools
 * 
 * This service provides a single source of truth for:
 * - Available tools and their configurations
 * - Tool enablement/disablement
 * - Tool constraints and validation
 * - Tool type definitions
 */

import { SupabaseClient } from '@supabase/supabase-js';

// Tool type enum for type safety
export type ToolType = 
  | 'reservations'    // Booking products/services (replaces appointments)
  | 'documents'       // Document sharing and signing
  | 'payments'        // Payment processing
  | 'products'        // Product catalog
  | 'intake_forms'    // Customer intake forms
  | 'faqs'            // Frequently asked questions
  | 'customer_support' // Customer support tickets
  | 'vibe_card';      // Vibe card (always enabled, not stored in DB)

// Tool configuration interface
export interface ToolConfig {
  type: ToolType;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  isCore: boolean; // Core tools are always available (like vibe_card)
  requiresConfiguration?: boolean;
  category: 'engagement' | 'commerce' | 'support' | 'content';
}

// Tool settings type for database
export type AgentToolSettings = {
  [K in Exclude<ToolType, 'vibe_card'>]: boolean;
};

// Tool constraint result
export interface ToolConstraint {
  canEnable: boolean;
  reason?: string;
  missingConfig?: string[];
}

/**
 * Central tool configuration registry
 * This is the single source of truth for all tools in the system
 */
export const TOOL_CONFIGS: Record<ToolType, ToolConfig> = {
  vibe_card: {
    type: 'vibe_card',
    name: 'vibe_card',
    displayName: 'Vibe Card',
    description: 'Crea tu tarjeta vibe única para atraer clientes ideales',
    icon: '💖',
    isCore: true,
    category: 'engagement',
  },
  customer_support: {
    type: 'customer_support',
    name: 'customer_support',
    displayName: 'Soporte al Cliente',
    description: 'Gestiona conversaciones de clientes y tickets de soporte en tiempo real',
    icon: '💬',
    isCore: false,
    category: 'support',
  },
  reservations: {
    type: 'reservations',
    name: 'reservations',
    displayName: 'Reservaciones',
    description: 'Permite a clientes reservar productos y servicios con fecha y hora',
    icon: '📅',
    isCore: false,
    requiresConfiguration: false, // Simple system, no external config needed
    category: 'commerce',
  },
  documents: {
    type: 'documents',
    name: 'documents',
    displayName: 'Documentos',
    description: 'Comparte formularios, acuerdos y documentos con clientes',
    icon: '📝',
    isCore: false,
    category: 'content',
  },
  payments: {
    type: 'payments',
    name: 'payments',
    displayName: 'Pagos',
    description: 'Procesa pagos de clientes de forma segura',
    icon: '💳',
    isCore: false,
    requiresConfiguration: true,
    category: 'commerce',
  },
  products: {
    type: 'products',
    name: 'products',
    displayName: 'Productos y Servicios',
    description: 'Muestra tu catálogo de productos y servicios',
    icon: '🛍️',
    isCore: false,
    category: 'commerce',
  },
  intake_forms: {
    type: 'intake_forms',
    name: 'intake_forms',
    displayName: 'Formularios de Ingreso',
    description: 'Recopila información de clientes antes del servicio',
    icon: '📋',
    isCore: false,
    category: 'content',
  },
  faqs: {
    type: 'faqs',
    name: 'faqs',
    displayName: 'Preguntas Frecuentes',
    description: 'Responde preguntas comunes automáticamente',
    icon: '❓',
    isCore: false,
    category: 'support',
  },
};

/**
 * ToolSystemService - Main service class
 */
export class ToolSystemService {
  /**
   * Get all available tools
   */
  static getAllTools(): ToolConfig[] {
    return Object.values(TOOL_CONFIGS);
  }

  /**
   * Get tool configuration by type
   */
  static getToolConfig(toolType: ToolType): ToolConfig | null {
    return TOOL_CONFIGS[toolType] || null;
  }

  /**
   * Get enabled tools for an organization
   */
  static async getEnabledTools(
    organizationId: string,
    supabase: SupabaseClient
  ): Promise<ToolType[]> {
    try {
      // Core tools are always enabled
      const enabledTools: ToolType[] = ['vibe_card'];

      // Get database-stored tool settings
      const { data: agentTools, error } = await supabase
        .from('agent_tools')
        .select('tool_type, enabled')
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error fetching enabled tools:', error);
        return enabledTools;
      }

      // Add enabled tools from database
      if (agentTools) {
        agentTools.forEach((tool) => {
          if (tool.enabled && tool.tool_type !== 'appointments') { // Skip old appointments
            enabledTools.push(tool.tool_type as ToolType);
          }
        });
      }

      return enabledTools;
    } catch (error) {
      console.error('Error in getEnabledTools:', error);
      return ['vibe_card']; // Return only core tools on error
    }
  }

  /**
   * Get agent tool settings (for UI toggles)
   */
  static async getAgentToolSettings(
    organizationId: string,
    supabase: SupabaseClient
  ): Promise<AgentToolSettings> {
    const defaultSettings: AgentToolSettings = {
      reservations: false,
      documents: false,
      payments: false,
      products: false,
      intake_forms: false,
      faqs: false,
      customer_support: false,
    };

    try {
      const { data: agentTools, error } = await supabase
        .from('agent_tools')
        .select('tool_type, enabled')
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error fetching agent tool settings:', error);
        return defaultSettings;
      }

      if (agentTools) {
        agentTools.forEach((tool) => {
          // Map old 'appointments' to 'reservations' for backward compatibility
          const toolType = tool.tool_type === 'appointments' ? 'reservations' : tool.tool_type;
          
          if (toolType in defaultSettings) {
            defaultSettings[toolType as keyof AgentToolSettings] = tool.enabled;
          }
        });
      }

      return defaultSettings;
    } catch (error) {
      console.error('Error in getAgentToolSettings:', error);
      return defaultSettings;
    }
  }

  /**
   * Update agent tool setting
   */
  static async updateToolSetting(
    organizationId: string,
    toolType: Exclude<ToolType, 'vibe_card'>,
    enabled: boolean,
    supabase: SupabaseClient
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Map reservations to the database (might still be 'appointments' or 'reservations')
      const dbToolType = toolType;

      const { error } = await supabase
        .from('agent_tools')
        .upsert({
          organization_id: organizationId,
          tool_type: dbToolType,
          enabled,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'organization_id,tool_type'
        });

      if (error) {
        console.error('Error updating tool setting:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateToolSetting:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Check tool constraints (e.g., payments requires Stripe setup)
   */
  static async checkToolConstraints(
    organizationId: string,
    toolType: ToolType,
    supabase: SupabaseClient
  ): Promise<ToolConstraint> {
    try {
      const toolConfig = this.getToolConfig(toolType);

      if (!toolConfig) {
        return {
          canEnable: false,
          reason: 'Tool configuration not found',
        };
      }

      // Core tools can always be enabled
      if (toolConfig.isCore) {
        return { canEnable: true };
      }

      // Check specific tool requirements
      switch (toolType) {
        case 'payments':
          return await this.checkPaymentsConstraints(organizationId, supabase);
        
        case 'products':
          return await this.checkProductsConstraints(organizationId, supabase);
        
        case 'reservations':
          return await this.checkReservationsConstraints(organizationId, supabase);
        
        default:
          // Most tools can be enabled without constraints
          return { canEnable: true };
      }
    } catch (error) {
      console.error('Error checking tool constraints:', error);
      return {
        canEnable: false,
        reason: 'Error checking constraints',
      };
    }
  }

  /**
   * Check payments tool constraints
   */
  private static async checkPaymentsConstraints(
    organizationId: string,
    supabase: SupabaseClient
  ): Promise<ToolConstraint> {
    const { data, error } = await supabase
      .from('payment_providers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .limit(1);

    if (error || !data || data.length === 0) {
      return {
        canEnable: false,
        reason: 'Debes configurar un proveedor de pagos (Stripe, PayPal, o Square) antes de habilitar esta herramienta.',
        missingConfig: ['payment_provider'],
      };
    }

    return { canEnable: true };
  }

  /**
   * Check products tool constraints
   */
  private static async checkProductsConstraints(
    organizationId: string,
    supabase: SupabaseClient
  ): Promise<ToolConstraint> {
    const { data, error } = await supabase
      .from('products_list_tool')
      .select('id')
      .eq('organization_id', organizationId)
      .limit(1);

    if (error || !data || data.length === 0) {
      return {
        canEnable: false,
        reason: 'Debes agregar al menos un producto antes de habilitar esta herramienta.',
        missingConfig: ['products'],
      };
    }

    return { canEnable: true };
  }

  /**
   * Check reservations tool constraints
   */
  private static async checkReservationsConstraints(
    organizationId: string,
    supabase: SupabaseClient
  ): Promise<ToolConstraint> {
    // Reservations require products to be available
    const { data, error } = await supabase
      .from('products_list_tool')
      .select('id')
      .eq('organization_id', organizationId)
      .limit(1);

    if (error || !data || data.length === 0) {
      return {
        canEnable: false,
        reason: 'Debes agregar al menos un producto o servicio antes de habilitar reservaciones.',
        missingConfig: ['products'],
      };
    }

    return { canEnable: true };
  }

  /**
   * Get tool display names for AI prompts
   */
  static getToolDisplayNames(): Record<ToolType, string> {
    return Object.fromEntries(
      Object.values(TOOL_CONFIGS).map(config => [config.type, config.displayName])
    ) as Record<ToolType, string>;
  }

  /**
   * Check if a tool is a core tool (always enabled)
   */
  static isCoreTool(toolType: ToolType): boolean {
    return TOOL_CONFIGS[toolType]?.isCore || false;
  }
}

