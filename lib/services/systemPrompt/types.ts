// System prompt types and interfaces

export interface BusinessConstraints {
  name: string
  tone: string
  industry?: string
  business_type?: string
  business_name?: string
  products_services?: string[]
  target_customers?: string
  business_processes?: string[]
  challenges?: string[]
  business_goals?: string[]
  customer_service?: string
  pricing_strategies?: string
  marketing_methods?: string[]
  competitors?: string[]
  technology_tools?: string[]
  values?: string[]
  policies?: string[]
  contact_info?: string
  custom_rules?: string[]
  whatsapp_trial_mentioned?: boolean
  business_info_gathered?: number
} 