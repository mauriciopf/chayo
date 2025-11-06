import { supabase } from '@/lib/shared/supabase/client'
import type { Organization } from '../../../../shared/types'

/**
 * Get all organizations a user belongs to
 * Queries team_members to find active memberships
 */
export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('organization_id, organizations!inner(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    
  if (error || !data) return []
  return data.map((m: any) => m.organizations as Organization)
}

