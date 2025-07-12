import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface Organization {
  id: string
  name: string
  slug: string
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

export class OrganizationService {
  private supabase = createClient()
  private creationPromises = new Map<string, Promise<{ organization: Organization; wasCreated: boolean } | null>>()

  /**
   * Ensures a user has an organization, creating one if necessary
   * Uses a promise cache to prevent duplicate creation requests
   */
  async ensureUserHasOrganization(user: User): Promise<{ organization: Organization; wasCreated: boolean } | null> {
    try {
      // Check if there's already a creation in progress for this user
      const existingPromise = this.creationPromises.get(user.id)
      if (existingPromise) {
        return existingPromise
      }

      // Create and cache the promise
      const promise = this._ensureUserHasOrganizationInternal(user)
      this.creationPromises.set(user.id, promise)
      
      try {
        const result = await promise
        return result
      } finally {
        // Clean up the promise cache after completion
        this.creationPromises.delete(user.id)
      }
    } catch (error) {
      console.error('Error ensuring user has organization:', error)
      this.creationPromises.delete(user.id)
      return null
    }
  }

  private async _ensureUserHasOrganizationInternal(user: User): Promise<{ organization: Organization; wasCreated: boolean } | null> {
    // Check if user already has an organization
    const existingOrg = await this.getUserOrganization(user.id)
    
    if (existingOrg) {
      return { organization: existingOrg, wasCreated: false }
    }

    // Create organization via API (only if none exists)
    const result = await this.createDefaultOrganization()
    
    return result
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
            created_at,
            team_members (
              id,
              user_id,
              role,
              status,
              joined_at
            )
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

      const organization = membership.organizations as unknown as Organization

      // Fetch user subscription separately
      const { data: subscription } = await this.supabase
        .from('user_subscriptions')
        .select('plan_name, status')
        .eq('user_id', userId)
        .single()

      if (subscription) {
        organization.user_subscription = {
          plan_name: subscription.plan_name,
          status: subscription.status
        }
      }

      return organization
    } catch (error) {
      console.error('Error fetching user organization:', error)
      return null
    }
  }

  /**
   * Creates a default organization for the current user
   */
  async createDefaultOrganization(): Promise<{ organization: Organization; wasCreated: boolean } | null> {
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const result = await response.json()
        return { 
          organization: result.organization, 
          wasCreated: result.wasCreated || false 
        }
      } else {
        const error = await response.json()
        console.error('Failed to create organization:', error)
        return null
      }
    } catch (error) {
      console.error('Error creating organization:', error)
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
