import { supabase } from '@/lib/shared/supabase/client'
import type { Organization } from '../../../../shared/types'

export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('organization_id, organizations!inner(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
  if (error || !data) return []
  return data.map((m: any) => m.organizations as Organization)
}

export async function ensureUserHasOrganization(userId: string): Promise<Organization | null> {
  // Implement logic to ensure a user has an organization, creating one if necessary
  // ...
  return null
} 