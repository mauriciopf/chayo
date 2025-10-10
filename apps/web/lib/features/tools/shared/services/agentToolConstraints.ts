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
      case 'reservations':
        return this.checkReservationConstraints(organizationId, supabase)
      
      case 'documents':
        return this.checkDocumentConstraints(organizationId, supabase)
      
      case 'payments':
        return this.checkPaymentConstraints(organizationId, supabase)
      
      case 'intake_forms':
        return this.checkIntakeFormsConstraints(organizationId, supabase)
      
      case 'faqs':
        return this.checkFAQConstraints(organizationId, supabase)
      
      case 'mobile-branding':
        return this.checkMobileBrandingConstraints(organizationId, supabase)
      
      case 'products':
        return this.checkProductsConstraints(organizationId, supabase)
      
      case 'customer_support':
        return this.checkCustomerSupportConstraints(organizationId, supabase)
      
      default:
        return { canEnable: true }
    }
  }

  private static async checkReservationConstraints(
    organizationId: string, 
    supabase: any
  ): Promise<ToolConstraintResult> {
    try {
      // Reservations require at least one product/service in the catalog
      const { data: products, error } = await supabase
        .from('products_list_tool')
        .select('id')
        .eq('organization_id', organizationId)
        .limit(1)

      if (error) {
        return {
          canEnable: false,
          reason: 'Error checking products for reservations'
        }
      }

      if (!products || products.length === 0) {
        return {
          canEnable: false,
          reason: 'Reservations require at least one product or service',
          missingConfig: ['Add at least one product/service to enable reservations']
        }
      }

      return { canEnable: true }
    } catch (error) {
      return {
        canEnable: false,
        reason: 'Error checking reservation configuration'
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
        .from('agent_document_tool')
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
      // Check if any payment provider is configured
      const { data: providers, error } = await supabase
        .from('payment_providers')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      if (error || !providers || providers.length === 0) {
        return {
          canEnable: false,
          reason: 'No payment provider configured',
          missingConfig: ['Connect a payment provider (Stripe, PayPal, or Square)']
        }
      }

      // Check if there's a default provider
      const defaultProvider = providers.find((p: any) => p.is_default)
      if (!defaultProvider) {
        return {
          canEnable: false,
          reason: 'No default payment provider',
          missingConfig: ['Set a default payment provider']
        }
      }

      const missing = []
      
      // Check provider account connection
      if (!defaultProvider.provider_account_id) {
        missing.push(`${defaultProvider.provider_type.toUpperCase()} account connection`)
      }
      if (!defaultProvider.access_token) {
        missing.push(`${defaultProvider.provider_type.toUpperCase()} authentication`)
      }
      
      // Check payment configuration based on payment type
      if (defaultProvider.payment_type === 'manual_price_id' && !defaultProvider.price_id) {
        missing.push(`${defaultProvider.provider_type.toUpperCase()} Price/Product ID`)
      }
      
      if (defaultProvider.payment_type === 'custom_ui' && (!defaultProvider.service_name || !defaultProvider.service_amount)) {
        missing.push('Service configuration (name and amount)')
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

  private static async checkMobileBrandingConstraints(
    organizationId: string, 
    supabase: any
  ): Promise<ToolConstraintResult> {
    // Mobile branding doesn't require any specific configuration
    // It can always be enabled as it just allows customizing app appearance
    return { canEnable: true }
  }

  private static async checkProductsConstraints(
    organizationId: string, 
    supabase: any
  ): Promise<ToolConstraintResult> {
    try {
      // Check if organization has any products/services
      const { data: products, error } = await supabase
        .from('products_list_tool')
        .select('id')
        .eq('organization_id', organizationId)
        .limit(1)

      if (error) {
        return {
          canEnable: false,
          reason: 'Error checking products configuration'
        }
      }

      if (!products || products.length === 0) {
        return {
          canEnable: false,
          reason: 'No products or services configured',
          missingConfig: ['Add at least one product or service to your catalog']
        }
      }

      return { canEnable: true }
    } catch (error) {
      return {
        canEnable: false,
        reason: 'Error checking products configuration'
      }
    }
  }

  private static async checkCustomerSupportConstraints(
    organizationId: string, 
    supabase: any
  ): Promise<ToolConstraintResult> {
    try {
      // Customer support is always available - no special configuration needed
      // The tool enables real-time customer messaging capabilities
      return { canEnable: true }
    } catch (error) {
      console.error('Error checking customer support constraints:', error)
      return { 
        canEnable: false, 
        reason: 'Unable to verify customer support configuration' 
      }
    }
  }
}