import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await req.json()
    
    if (!organizationId) {
      console.error('❌ [SETUP-COMPLETION-API] No organizationId provided')
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    console.log('🔍 [SETUP-COMPLETION-API] Checking completion for organizationId:', organizationId)

    // Create server-side Supabase client
    const supabase = await getSupabaseServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check setup_completion table for the organization
    const { data: setupCompletion, error } = await supabase
      .from('setup_completion')
      .select('setup_status')
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      console.log('⚠️ [SETUP-COMPLETION-API] No setup completion record found, defaulting to incomplete')
      return NextResponse.json({ isCompleted: false })
    }

    const isCompleted = setupCompletion?.setup_status === 'completed'
    
    console.log('📊 [SETUP-COMPLETION-API] Database check result:', {
      organizationId,
      setup_status: setupCompletion?.setup_status,
      isCompleted
    })

    return NextResponse.json({ isCompleted })
    
  } catch (error) {
    console.error('❌ [SETUP-COMPLETION-API] Error checking setup completion status:', error)
    return NextResponse.json({ isCompleted: false })
  }
}
