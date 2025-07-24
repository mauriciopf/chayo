import { supabase } from '@/lib/supabase/client'
import type { BusinessConstraints } from './types'

export async function fetchBusinessConstraints(organizationId: string): Promise<BusinessConstraints> {
  const { data: viewData, error } = await supabase
    .from('business_constraints_view')
    .select('business_constraints')
    .eq('organization_id', organizationId)
    .single()
  if (error || !viewData?.business_constraints) {
    return {
      name: 'Business AI Assistant',
      tone: 'professional',
      whatsapp_trial_mentioned: false,
      business_info_gathered: 0
    }
  }
  return viewData.business_constraints as BusinessConstraints
} 