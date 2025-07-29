import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    // Create server-side Supabase client
    const supabase = getSupabaseServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      throw new Error(`Authentication error: ${authError.message}`)
    }
    
    if (!user) {
      throw new Error('Authentication required')
    }
    
    // Get user's organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .single()
    
    if (orgError || !organization) {
      return NextResponse.json({ agentChatLink: null })
    }
    
    // Get agent chat link for the organization
    const { data: agentChatLink, error: linkError } = await supabase
      .from('agent_channels')
      .select('*, agent:agents(*)')
      .eq('organization_id', organization.id)
      .eq('channel', 'agent_chat_link')
      .maybeSingle()
    
    if (linkError) {
      console.warn('Error fetching agent chat link:', linkError)
      return NextResponse.json({ agentChatLink: null })
    }
    
    return NextResponse.json({ agentChatLink })
    
  } catch (error) {
    console.error('Error getting agent chat link:', error)
    return NextResponse.json({ agentChatLink: null })
  }
} 