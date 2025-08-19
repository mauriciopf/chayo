import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

export async function GET(req: NextRequest) {
  try {
    // Create server-side Supabase client
    const supabase = await getSupabaseServerClient();
    
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
      .select('id, slug')
      .eq('owner_id', user.id)
      .single()
    
    if (orgError || !organization) {
      return NextResponse.json({ agentChatLink: null })
    }
    
    // Get client chat agent for this organization
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('channel', 'client_chat')
      .maybeSingle()
    
    if (agentError) {
      console.warn('Error fetching client chat agent:', agentError)
      return NextResponse.json({ agentChatLink: null })
    }
    
    // Return agent data formatted as chat link
    const agentChatLink = agent ? {
      id: agent.id,
      organization_id: organization.id,
      channel: 'client_chat',
      url: `/client-chat/${organization.slug}`,
      status: agent.paused ? 'paused' : 'active',
      connected: true,
      agent: agent
    } : null
    
    return NextResponse.json({ agentChatLink })
    
  } catch (error) {
    console.error('Error getting agent chat link:', error)
    return NextResponse.json({ agentChatLink: null })
  }
} 