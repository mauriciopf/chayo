/**
 * WhatsAppTemplateManager
 * 
 * Production-ready service for managing WhatsApp Business templates.
 * Single source of truth: Meta Graph API (no local database storage).
 * 
 * Features:
 * - Fetch templates from Meta API
 * - Filter by tool type using sub_category
 * - Find best template for a specific tool
 * - Type-safe with full error handling
 */

import { 
  WhatsAppTemplate, 
  TemplateStatus, 
  TemplateCategory 
} from '../types/template.types'
import { ToolType } from '@/lib/features/tools/shared/services/ToolSystemService'

export class WhatsAppTemplateManager {
  
  /**
   * Fetch all templates for an organization from Meta API
   * Optionally filter by tool type using sub_category
   */
  static async getTemplates(
    organizationId: string,
    toolType?: ToolType
  ): Promise<WhatsAppTemplate[]> {
    try {
      const params = new URLSearchParams({
        organizationId
      })
      
      // Pass toolType to API for server-side filtering
      if (toolType) {
        params.append('toolType', toolType)
      }
      
      const response = await fetch(`/api/whatsapp/templates?${params}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch templates')
      }
      
      const data = await response.json()
      const templates: WhatsAppTemplate[] = data.templates || []
      
      // Templates already filtered server-side, just return
      return templates
      
    } catch (error) {
      console.error('❌ Failed to fetch templates:', error)
      throw error
    }
  }

  /**
   * Get the best approved template for a specific tool type
   * Returns null if no approved template exists
   */
  static async getBestTemplateForTool(
    organizationId: string,
    toolType: ToolType
  ): Promise<WhatsAppTemplate | null> {
    try {
      const templates = await this.getTemplates(organizationId, toolType)
      
      // Prioritize approved templates
      const approved = templates.filter(t => t.status === 'APPROVED')
      
      if (approved.length === 0) {
        return null
      }
      
      // Return the most recently created approved template
      // (Meta API returns templates sorted by creation date, newest first)
      return approved[0]
      
    } catch (error) {
      console.error(`❌ Failed to get template for ${toolType}:`, error)
      return null
    }
  }

  /**
   * Check if an approved template exists for a tool type
   */
  static async hasApprovedTemplate(
    organizationId: string,
    toolType: ToolType
  ): Promise<boolean> {
    const template = await this.getBestTemplateForTool(organizationId, toolType)
    return template !== null
  }

  /**
   * Get templates grouped by status
   */
  static async getTemplatesByStatus(
    organizationId: string,
    toolType?: ToolType
  ): Promise<Record<TemplateStatus, WhatsAppTemplate[]>> {
    const templates = await this.getTemplates(organizationId, toolType)
    
    return {
      PENDING: templates.filter(t => t.status === 'PENDING'),
      APPROVED: templates.filter(t => t.status === 'APPROVED'),
      REJECTED: templates.filter(t => t.status === 'REJECTED'),
      PAUSED: templates.filter(t => t.status === 'PAUSED')
    }
  }

  /**
   * Generate a unique template name for a tool type
   */
  /**
   * Generate a unique template name following our convention
   * Pattern: {toolType}_{language}_{timestamp}
   * Example: reservations_es_1762626736366
   */
  static generateTemplateName(toolType: ToolType, language: string = 'es'): string {
    const timestamp = Date.now()
    return `${toolType}_${language}_${timestamp}`
  }

  /**
   * Validate template name follows Meta's rules
   * - Lowercase letters, numbers, underscores only
   * - No spaces or special characters
   * - Max 512 characters
   */
  static validateTemplateName(name: string): boolean {
    const regex = /^[a-z0-9_]{1,512}$/
    return regex.test(name)
  }

  /**
   * Get tool-specific category recommendation
   * Most tools use UTILITY, but this allows for future customization
   */
  static getCategoryForTool(toolType: ToolType): TemplateCategory {
    // All current tools are UTILITY
    // MARKETING would require opt-in
    // AUTHENTICATION is for OTP codes
    return 'UTILITY'
  }

  /**
   * Format template name for display
   */
  static formatTemplateDisplayName(template: WhatsAppTemplate): string {
    const toolName = template.sub_category || 'general'
    const status = template.status === 'APPROVED' ? '✅' : 
                   template.status === 'PENDING' ? '⏳' :
                   template.status === 'REJECTED' ? '❌' : '⏸️'
    
    return `${status} ${toolName} - ${template.language}`
  }

  /**
   * Delete a template by name
   * WARNING: Cannot create template with same name for 30 days after deletion
   * 
   * @param organizationId - Organization ID
   * @param templateName - Name of template to delete
   * @param templateId - Optional: Delete specific template by ID (only that language)
   */
  static async deleteTemplate(
    organizationId: string,
    templateName: string,
    templateId?: string
  ): Promise<void> {
    try {
      const params = new URLSearchParams({
        organizationId,
        name: templateName
      })
      
      if (templateId) {
        params.append('hsm_id', templateId)
      }

      const response = await fetch(`/api/whatsapp/templates/delete?${params}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete template')
      }

      console.log('✅ Template deleted:', templateName)
      
    } catch (error) {
      console.error('❌ Failed to delete template:', error)
      throw error
    }
  }
}

