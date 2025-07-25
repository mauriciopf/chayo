import { SupabaseClient } from '@supabase/supabase-js'

export async function getFilledBusinessInfoFieldCount(supabase: SupabaseClient, organizationId: string): Promise<number> {
  const { count, error } = await supabase
    .from('business_info_fields')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .not('value', 'is', null)
    .not('value', 'eq', '')

  if (error) throw error
  return count ?? 0
} 