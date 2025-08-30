// Organization types and interfaces

export interface Organization {
  id: string
  name: string
  slug: string
  mobile_app_code: string
  owner_id: string
  created_at: string
  team_members?: TeamMember[]
  user_subscription?: {
    plan_name: string
    status: string
  }
}

export interface TeamMember {
  id: string
  user_id: string
  role: string
  status: string
  joined_at: string
} 