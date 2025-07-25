import { supabase } from '@/lib/supabase/client'

export async function getFilledBusinessInfoFieldCount(organizationId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('business_info_fields')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .not('value', 'is', null)
      .not('value', 'eq', '')

    if (error) {
      throw error
    }
    return count ?? 0
  } catch (error) {
    return 0
  }
} 