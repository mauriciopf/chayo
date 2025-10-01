import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from "@/lib/shared/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return mock data
    // In the future, this will integrate with n8n and store actual connection status
    const mockChannels = [
      {
        id: 'web-chat',
        agent_id: request.nextUrl.searchParams.get('agent_id'),
        channel_type: 'web',
        name: 'Web Chat',
        connected: true,
        status: 'active',
        last_activity: new Date().toISOString(),
        credentials: {
          webhook_url: 'https://your-n8n-instance.com/webhook/web-chat',
          widget_id: 'web-widget-123'
        },
        created_at: new Date().toISOString()
      }
    ]

    return NextResponse.json({ channels: mockChannels })
  } catch (error) {
    console.error('Error fetching channels:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { agent_id, channel_type, credentials } = await request.json()

    if (!agent_id || !channel_type) {
      return NextResponse.json({ error: 'Agent ID and channel type are required' }, { status: 400 })
    }

    // Validate that the agent belongs to the user
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agent_id)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // TODO: Implement actual n8n workflow creation
    // For now, we'll just return a mock response
    const mockChannel = {
      id: `${channel_type}-${Date.now()}`,
      agent_id,
      channel_type,
      name: getChannelName(channel_type),
      connected: true,
      status: 'active',
      last_activity: new Date().toISOString(),
      credentials: {
        webhook_url: `https://your-n8n-instance.com/webhook/${channel_type}`,
        ...credentials
      },
      created_at: new Date().toISOString()
    }

    // In the future, this will:
    // 1. Create n8n workflow for the channel
    // 2. Store the connection details in the database
    // 3. Return the actual connection status

    return NextResponse.json({ 
      channel: mockChannel,
      message: 'Channel connection initiated. This is a placeholder - n8n integration coming soon!'
    })
  } catch (error) {
    console.error('Error creating channel:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channel_id, connected, credentials } = await request.json()

    if (!channel_id) {
      return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 })
    }

    // TODO: Implement actual n8n workflow update
    // For now, return mock response
    const mockUpdatedChannel = {
      id: channel_id,
      connected,
      status: connected ? 'active' : 'disconnected',
      last_activity: connected ? new Date().toISOString() : null,
      credentials,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({ 
      channel: mockUpdatedChannel,
      message: 'Channel updated successfully. This is a placeholder - n8n integration coming soon!'
    })
  } catch (error) {
    console.error('Error updating channel:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('id')

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 })
    }

    // TODO: Implement actual n8n workflow deletion
    // For now, return mock response
    return NextResponse.json({ 
      message: 'Channel disconnected successfully. This is a placeholder - n8n integration coming soon!'
    })
  } catch (error) {
    console.error('Error deleting channel:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

function getChannelName(channelType: string): string {
  const names = {
    instagram: 'Instagram Direct',
    facebook: 'Facebook Messenger',
    web: 'Web Chat',
    voice: 'Voice Calls',
    email: 'Email Support'
  }
  return names[channelType as keyof typeof names] || 'Unknown Channel'
}
