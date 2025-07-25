export interface Message {
  id: string
  role: "user" | "ai" | "system"
  content: string
  timestamp: Date
  usingRAG?: boolean
  multipleChoices?: string[]
  allowMultiple?: boolean
  showOtherOption?: boolean
}

export interface Agent {
  id: string
  organization_id: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
}

export interface UserSubscription {
  user_id: string
  plan_name: string
  status: string
  stripe_customer_id: string
  stripe_subscription_id: string
  current_period_end: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  owner_id: string
  created_at: string
  team_members?: Array<{
    id: string
    user_id: string
    role: string
    status: string
    joined_at: string
  }>
  user_subscription?: {
    plan_name: string
    status: string
  }
}

export type AuthState = 'loading' | 'authenticated' | 'awaitingName' | 'awaitingEmail' | 'awaitingOTP'
export type OtpLoadingState = 'none' | 'sending' | 'verifying'
export type ActiveView = 'chat' | 'agents' | 'performance' | 'users' | 'profile' | 'qrcode' | 'business-summary' 