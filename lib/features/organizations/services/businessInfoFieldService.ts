import { supabase } from '@/lib/shared/supabase/client'

export class BusinessInfoFieldService {
  private supabaseClient: any

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient || supabase
  }

  async getFilledBusinessInfoFieldCount(organizationId: string): Promise<number> {
    try {
      const { count, error } = await this.supabaseClient
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
}

// Export singleton instance for backward compatibility
export const businessInfoFieldService = new BusinessInfoFieldService()

// Export individual function for backward compatibility
export const getFilledBusinessInfoFieldCount = (organizationId: string) => businessInfoFieldService.getFilledBusinessInfoFieldCount(organizationId) 