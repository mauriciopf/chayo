import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const agentId = request.nextUrl.searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    // Get user from auth
    // Authentication using server supabase client
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get WhatsApp channel status
    const { data: channel, error: channelError } = await supabase
      .from('agent_channels')
      .select('*')
      .eq('agent_id', agentId)
      .eq('channel_type', 'whatsapp')
      .eq('user_id', user.id)
      .single()

    if (channelError && channelError.code !== 'PGRST116') {
      console.error('Database error:', channelError)
      return NextResponse.json(
        { error: 'Failed to fetch channel status' },
        { status: 500 }
      )
    }

    if (!channel) {
      return NextResponse.json({
        connected: false,
        status: 'not_configured',
        message: 'WhatsApp channel not configured'
      })
    }

    // Check for trial information if channel is on trial
    let trialInfo = null
    if (channel.status === 'trial') {
      const { data: trial, error: trialError } = await supabase
        .from('whatsapp_trials')
        .select('*')
        .eq('agent_id', agentId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (!trialError && trial) {
        const now = new Date()
        const trialEnd = new Date(trial.trial_end_date)
        const timeRemaining = trialEnd.getTime() - now.getTime()
        const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24))

        trialInfo = {
          id: trial.id,
          startDate: trial.trial_start_date,
          endDate: trial.trial_end_date,
          daysRemaining: Math.max(0, daysRemaining),
          isExpired: timeRemaining <= 0,
          status: trial.status
        }
      }
    }

    return NextResponse.json({
      connected: channel.connected,
      status: channel.status,
      phoneNumber: channel.phone_number,
      countryCode: channel.country_code,
      trial: trialInfo,
      message: channel.connected 
        ? (channel.status === 'trial' 
          ? `WhatsApp trial is active${trialInfo ? ` (${trialInfo.daysRemaining} days remaining)` : ''}` 
          : 'WhatsApp channel is active')
        : 'WhatsApp channel setup in progress'
    })

  } catch (error: any) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
