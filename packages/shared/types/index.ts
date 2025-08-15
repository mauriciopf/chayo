// User types
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

// Organization types
export interface Organization {
  id: string
  name: string
  slug: string
  owner_id: string
  plan_name: string
  created_at: string
  updated_at: string
}

// Agent types
export interface Agent {
  id: string
  user_id: string
  organization_id: string
  name: string
  system_prompt?: string
  business_constraints?: Record<string, any>
  created_at: string
  updated_at: string
}

// Chat types
export interface ChatMessage {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
}