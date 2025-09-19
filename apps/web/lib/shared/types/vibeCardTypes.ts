/**
 * TypeScript interfaces for Vibe Card data structure
 * Used in marketplace display and onboarding completion_data storage
 */

export interface VibeColors {
  primary: string
  secondary: string
  accent: string
}

export interface VibeCardData {
  // Core Business Info
  business_name: string
  business_type: string
  
  // Vibe Elements
  origin_story: string
  value_badges: string[]
  personality_traits: string[]
  
  // Visual Vibe
  vibe_colors: VibeColors
  vibe_aesthetic: string
  
  // Connection Elements
  why_different: string
  perfect_for: string[]
  
  // Social Proof
  customer_love: string
  
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

// Field names that the AI should use when collecting vibe card data
export const VIBE_CARD_FIELDS = {
  BUSINESS_NAME: 'business_name',
  BUSINESS_TYPE: 'business_type', 
  ORIGIN_STORY: 'origin_story',
  VALUE_BADGES: 'value_badges',
  PERSONALITY_TRAITS: 'personality_traits',
  VIBE_AESTHETIC: 'vibe_aesthetic',
  WHY_DIFFERENT: 'why_different',
  PERFECT_FOR: 'perfect_for',
  CUSTOMER_LOVE: 'customer_love',
  LOCATION: 'location'
} as const

// Aesthetic options for AI to choose from
export const VIBE_AESTHETICS = [
  'Boho-chic',
  'Modern-minimalist', 
  'Rustic-charm',
  'Urban-industrial',
  'Vintage-classic',
  'Earthy-natural',
  'Luxury-elegant',
  'Creative-artsy',
  'Warm-cozy',
  'Fresh-clean'
] as const

export type VibeAesthetic = typeof VIBE_AESTHETICS[number]
