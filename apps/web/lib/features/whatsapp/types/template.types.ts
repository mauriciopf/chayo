/**
 * WhatsApp Template Types
 * Based on Meta WhatsApp Business API v23.0 specification
 */

import { ToolType } from '@/lib/features/tools/shared/services/ToolSystemService'

export type TemplateStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED'
export type TemplateCategory = 'UTILITY' | 'MARKETING' | 'AUTHENTICATION'
export type ComponentType = 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
export type HeaderFormat = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
export type ButtonType = 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY'
export type ParameterFormat = 'POSITIONAL' | 'NAMED'

/**
 * Template component structure (matches Meta API)
 */
export interface TemplateComponent {
  type: ComponentType
  format?: HeaderFormat
  text?: string
  example?: {
    header_text?: string[]
    body_text?: string[][]
    body_text_named_params?: Array<{
      param_name: string
      example: string
    }>
  }
  buttons?: TemplateButton[]
}

export interface TemplateButton {
  type: ButtonType
  text: string
  url?: string
  phone_number?: string
  example?: string[]
}

/**
 * Template metadata from Meta API
 */
export interface WhatsAppTemplate {
  id: string
  name: string
  language: string
  status: TemplateStatus
  category: TemplateCategory
  sub_category?: string
  parameter_format?: ParameterFormat
  components: TemplateComponent[]
}

/**
 * Template generation request
 */
export interface TemplateGenerationRequest {
  organizationId: string
  toolType: ToolType
  businessName?: string
  businessType?: string
  tone?: 'formal' | 'casual' | 'friendly'
  language?: 'es' | 'en'
}

/**
 * Template creation request
 */
export interface TemplateCreationRequest {
  organizationId: string
  templateName: string
  category: TemplateCategory
  subCategory: string // Tool type
  language: string
  components: TemplateComponent[]
}

