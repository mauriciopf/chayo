import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/server'
import { twilioClient } from '@/lib/twilio/client'

export async function GET(request: NextRequest) {
  try {
    // Authentication using server supabase client
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get trials for user
    const { data: trials, error: trialsError } = await supabase
      .from('whatsapp_trials')
      .select(`
        *,
        agents(name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (trialsError) {
      console.error('Error fetching trials:', trialsError)
      return NextResponse.json(
        { error: 'Failed to fetch trials' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      trials: trials || []
    })

  } catch (error: any) {
    console.error('Trial fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, trialId } = await request.json()

    if (!action || !trialId) {
      return NextResponse.json(
        { error: 'Action and trial ID are required' },
        { status: 400 }
      )
    }

    // Authentication using server supabase client
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get trial details
    const { data: trial, error: trialError } = await supabase
      .from('whatsapp_trials')
      .select('*')
      .eq('id', trialId)
      .eq('user_id', user.id)
      .single()

    if (trialError || !trial) {
      return NextResponse.json(
        { error: 'Trial not found' },
        { status: 404 }
      )
    }

    if (action === 'expire') {
      // Mark trial as expired and release Twilio number
      const success = await releaseTwilioNumber(trial.twilio_number_sid)

      const { error: updateError } = await supabase
        .from('whatsapp_trials')
        .update({ 
          status: success ? 'released' : 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('id', trialId)

      if (updateError) {
        console.error('Error updating trial status:', updateError)
        return NextResponse.json(
          { error: 'Failed to update trial status' },
          { status: 500 }
        )
      }

      // Also update the agent_channels status
      await supabase
        .from('agent_channels')
        .update({ 
          status: 'trial_expired',
          connected: false
        })
        .eq('agent_id', trial.agent_id)
        .eq('channel_type', 'whatsapp')

      return NextResponse.json({
        success: true,
        message: 'Trial expired and number released'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Trial management error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function releaseTwilioNumber(numberSid: string): Promise<boolean> {
  try {
    if (!twilioClient) {
      console.error('Twilio client not available')
      return false
    }

    // Release the phone number
    await twilioClient.incomingPhoneNumbers(numberSid).remove()
    console.log('Successfully released Twilio number:', numberSid)
    return true
  } catch (error: any) {
    console.error('Failed to release Twilio number:', error)
    return false
  }
}
