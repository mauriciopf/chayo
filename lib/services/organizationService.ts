import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface Organization {
  id: string
  name: string
  slug: string
  owner_id: string
  plan_name: string
  created_at: string
  team_members?: TeamMember[]
}

export interface TeamMember {
  id: string
  user_id: string
  role: string
  status: string
  joined_at: string
}

export class OrganizationService {
  private supabase = createClient()

  /**
   * Ensures a user has an organization, creating one if necessary
   */
  async ensureUserHasOrganization(user: User): Promise<Organization | null> {
    try {
      // Check if user already has an organization
      const existingOrg = await this.getUserOrganization(user.id)
      if (existingOrg) {
        return existingOrg
      }

      // Create organization via API
      const newOrg = await this.createDefaultOrganization()
      return newOrg
    } catch (error) {
      console.error('Error ensuring user has organization:', error)
      return null
    }
  }

  /**
   * Gets the user's primary organization
   */
  async getUserOrganization(userId: string): Promise<Organization | null> {
    try {
      const { data: membership, error } = await this.supabase
        .from('team_members')
        .select(`
          organization_id,
          role,
          organizations!inner (
            id,
            name,
            slug,
            owner_id,
            plan_name,
            created_at
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('joined_at', { ascending: true })
        .limit(1)
        .single()

      if (error || !membership?.organizations) {
        return null
      }

      return membership.organizations as unknown as Organization
    } catch (error) {
      console.error('Error fetching user organization:', error)
      return null
    }
  }

  /**
   * Creates a default organization for the current user
   */
  async createDefaultOrganization(): Promise<Organization | null> {
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const { organization } = await response.json()
        return organization
      } else {
        const { error } = await response.json()
        console.error('Failed to create default organization:', error)
        return null
      }
    } catch (error) {
      console.error('Error creating default organization:', error)
      return null
    }
  }

  /**
   * Gets all organizations for a user
   */
  async getUserOrganizations(): Promise<Organization[]> {
    try {
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const { organizations } = await response.json()
        return organizations || []
      }
      return []
    } catch (error) {
      console.error('Error fetching organizations:', error)
      return []
    }
  }

  /**
   * Checks if the database migration has been run
   */
  async isDatabaseReady(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('organizations')
        .select('id')
        .limit(1)

      return !error
    } catch (error) {
      return false
    }
  }
}

export const organizationService = new OrganizationService()
