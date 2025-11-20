/**
 * TypeScript interfaces for Vibe Card data structure
 * Used in marketplace display and onboarding completion_data storage
 * Updated for Real Estate AI Agent profile
 */

export interface VibeColors {
  primary: string
  secondary: string
  accent: string
}

export interface VibeCardData {
  // Core Real Estate Agent Info (required)
  agent_name: string
  coverage_location: string
  services: string[] // e.g., ["Venta", "Renta", "Comercial"]
  online_presence: string // Website or Instagram URL
  unique_value: string // What makes them different
  
  // Legacy/backward compatibility fields (optional)
  business_name?: string
  business_type?: string
  origin_story?: string
  value_badges?: string[]
  personality_traits?: string[]
  
  // Visual Vibe (optional - AI will generate)
  vibe_colors?: VibeColors
  vibe_aesthetic?: string
  
  // Connection Elements (optional)
  why_different?: string
  perfect_for?: string[]
  
  // Social Proof (optional - AI can create)
  customer_love?: string
  
  // AI Generated Image
  ai_generated_image_url?: string
  
  // Optional fields that may be collected
  location?: string
  website?: string
  contact_info?: {
    phone?: string
    email?: string
  }
}

// Interface for the setup_completion.completion_data field
export interface SetupCompletionData {
  // Vibe card data (when setup_status === 'completed')
  vibe_card?: VibeCardData
  
  // Legacy business info fields (for backward compatibility)
  [key: string]: any
}

// Interface for marketplace vibe card display
export interface MarketplaceVibeCard {
  // Organization info
  organization_id: string
  slug: string
  
  // Setup completion info
  setup_status: 'completed'
  completed_at: string
  
  // Vibe card data
  vibe_data: VibeCardData
}

// Essential field names for real estate agent profile (5 core fields)
export const VIBE_CARD_FIELDS = {
  AGENT_NAME: 'agent_name',
  COVERAGE_LOCATION: 'coverage_location',
  SERVICES: 'services',
  ONLINE_PRESENCE: 'online_presence',
  UNIQUE_VALUE: 'unique_value',
  // Legacy fields for backward compatibility
  BUSINESS_NAME: 'business_name',
  BUSINESS_TYPE: 'business_type', 
  ORIGIN_STORY: 'origin_story',
  VALUE_BADGES: 'value_badges',
  PERFECT_FOR: 'perfect_for'
} as const

// Real estate service options for multiple choice
export const REAL_ESTATE_SERVICES = [
  'Venta Residencial',
  'Renta Residencial',
  'Venta Comercial',
  'Renta Comercial',
  'Terrenos',
  'Lujo/Premium',
  'Inversión',
  'Administración de Propiedades'
] as const

// Aesthetic options for AI to choose from
export const VIBE_AESTHETICS = [
  'Professional-modern',
  'Luxury-elegant', 
  'Trustworthy-classic',
  'Dynamic-contemporary',
  'Warm-approachable',
  'Bold-confident',
  'Sophisticated-refined',
  'Fresh-innovative',
  'Established-reliable',
  'Tech-savvy'
] as const

export type VibeAesthetic = typeof VIBE_AESTHETICS[number]
export type RealEstateService = typeof REAL_ESTATE_SERVICES[number]
