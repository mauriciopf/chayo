import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from "@/lib/shared/supabase/server"
import { generateSlugFromName } from '@/lib/shared/utils/text'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    const { organizationId, name } = await request.json()
    if (!organizationId || !name) {
      return NextResponse.json({ error: 'Organization ID and name are required' }, { status: 400 })
    }
    // Authentication using server supabase client
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Only allow update if user is a member of the org
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single()
    if (memberError || !member) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 })
    }
    // Generate new slug based on the updated name
    const newSlug = generateSlugFromName(name)
    
    // Update organization name and slug
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ name, slug: newSlug })
      .eq('id', organizationId)
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
    }
    return NextResponse.json({ success: true, slug: newSlug })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
