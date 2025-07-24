import { supabase } from '@/lib/supabase/client'
import type { Organization } from './types'

export async function getOrganizationById(id: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return data as Organization
}

export async function updateOrganizationName(id: string, name: string): Promise<boolean> {
  const { error } = await supabase
    .from('organizations')
    .update({ name })
    .eq('id', id)
  return !error
}
// Add more CRUD and sync logic as needed 