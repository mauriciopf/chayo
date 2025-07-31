/**
 * Service to check configuration constraints for agent tools
 * Each tool requires specific configuration before it can be enabled
 */

import { createClient } from '@supabase/supabase-js'

export interface ToolConstraintResult {
  canEnable: boolean
  reason?: string
  missingConfig?: string[]
}

export class AgentToolConstraintsService {
  static async checkToolConstraints(
    organizationId: string, 
    toolType: string, 
    supabase: any
  ): Promise<ToolConstraintResult> {
    switch (toolType) {
      case 'appointments':
        return this.checkAppointmentConstraints(organizationId, supabase)
      
      case 'documents':
        return this.checkDocumentConstraints(organizationId, supabase)
      
      case 'payments':
        return this.checkPaymentConstraints(organizationId, supabase)
      
      case 'intake_forms':
        return this.checkIntakeFormsConstraints(organizationId, supabase)
      
      case 'faqs':
        return this.checkFAQConstraints(organizationId, supabase)
      
      default:
        return { canEnable: true }
    }
  }

  private static async checkAppointmentConstraints(
    organizationId: string, 
    supabase: any
  ): Promise<ToolConstraintResult> {
    try {
      // Check if appointment settings are configured
      const { data: settings, error } = await supabase
        .from('appointment_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

      if (error || !settings) {
        return {
          canEnable: false,
          reason: 'Appointment settings not configured',
          missingConfig: ['Configure appointment provider']
        }
      }

      const missing = []
      if (!settings.provider) missing.push('Appointment provider')
      
      // For external providers, check if URL is configured
      if (settings.provider && settings.provider !== 'custom' && !settings.provider_url) {
        missing.push('Provider URL')
      }

      if (missing.length > 0) {
        return {
          canEnable: false,
          reason: 'Incomplete appointment configuration',
          missingConfig: missing
        }
      }

      return { canEnable: true }
    } catch (error) {
      return {
        canEnable: false,
        reason: 'Error checking appointment configuration'
      }
    }
  }

  private static async checkDocumentConstraints(
    organizationId: string, 
    supabase: any
  ): Promise<ToolConstraintResult> {
    try {
      // Check if organization has at least one document uploaded
      const { data: documents, error } = await supabase
        .from('business_documents')
        .select('id')
        .eq('organization_id', organizationId)
        .limit(1)

      if (error) {
        return {
          canEnable: false,
          reason: 'Error checking document configuration'
        }
      }

      if (!documents || documents.length === 0) {
        return {
          canEnable: false,
          reason: 'No documents uploaded',
          missingConfig: ['Upload at least one document']
        }
      }

      return { canEnable: true }
    } catch (error) {
      return {
        canEnable: false,
        reason: 'Error checking document configuration'
      }
    }
  }

  private static async checkPaymentConstraints(
    organizationId: string, 
    supabase: any
  ): Promise<ToolConstraintResult> {
    try {
      // Check if Stripe settings are configured
      const { data: settings, error } = await supabase
        .from('stripe_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .single()

      if (error || !settings) {
        return {
          canEnable: false,
          reason: 'Stripe settings not configured',
          missingConfig: ['Connect Stripe account', 'Configure payment settings']
        }
      }

      const missing = []
      if (!settings.stripe_user_id) missing.push('Stripe account connection')
      if (!settings.access_token) missing.push('Stripe authentication')
      
      // Check payment configuration based on payment type
      if (settings.payment_type === 'manual_price_id' && !settings.price_id) {
        missing.push('Stripe Price ID')
      }
      
      if (settings.payment_type === 'custom_ui' && (!settings.service_name || !settings.service_amount)) {
        missing.push('Service configuration')
      }

      if (missing.length > 0) {
        return {
          canEnable: false,
          reason: 'Incomplete payment configuration',
          missingConfig: missing
        }
      }

      return { canEnable: true }
    } catch (error) {
      return {
        canEnable: false,
        reason: 'Error checking payment configuration'
      }
    }
  }

  private static async checkIntakeFormsConstraints(
    organizationId: string, 
    supabase: any
  ): Promise<ToolConstraintResult> {
    try {
      // Check if organization has at least one active intake form
      const { data: forms, error } = await supabase
        .from('intake_forms')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .limit(1)

      if (error) {
        return {
          canEnable: false,
          reason: 'Error checking intake forms configuration'
        }
      }

      if (!forms || forms.length === 0) {
        return {
          canEnable: false,
          reason: 'No active intake forms',
          missingConfig: ['Create at least one intake form']
        }
      }

      return { canEnable: true }
    } catch (error) {
      return {
        canEnable: false,
        reason: 'Error checking intake forms configuration'
      }
    }
  }

  private static async checkFAQConstraints(
    organizationId: string, 
    supabase: any
  ): Promise<ToolConstraintResult> {
    try {
      // Check if organization has at least one active FAQ with questions
      const { data: faqs, error } = await supabase
        .from('faqs_tool')
        .select('id, faq_items')
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      if (error) {
        return {
          canEnable: false,
          reason: 'Error checking FAQ configuration'
        }
      }

      if (!faqs || faqs.length === 0) {
        return {
          canEnable: false,
          reason: 'No active FAQs',
          missingConfig: ['Create at least one FAQ']
        }
      }

      // Check if FAQs have questions
      const hasQuestions = faqs.some((faq: any) => 
        faq.faq_items && Array.isArray(faq.faq_items) && faq.faq_items.length > 0
      )

      if (!hasQuestions) {
        return {
          canEnable: false,
          reason: 'FAQs have no questions',
          missingConfig: ['Add questions to your FAQs']
        }
      }

      return { canEnable: true }
    } catch (error) {
      return {
        canEnable: false,
        reason: 'Error checking FAQ configuration'
      }
    }
  }
}