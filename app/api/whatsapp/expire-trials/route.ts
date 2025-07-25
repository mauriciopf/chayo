import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { twilioClient } from '@/lib/twilio/client'

// This endpoint will be called by a CRON job to check and expire trials
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from our CRON job (add authentication)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'your-secret-token'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create admin client (bypassing RLS)
    const supabase = getSupabaseServerClient()
    // Authentication using server supabase client

    // Find expired trials that haven't been processed yet
    const { data: expiredTrials, error: trialsError } = await supabase
      .from('whatsapp_trials')
      .select('*')
      .eq('status', 'active')
      .lt('trial_end_date', new Date().toISOString())

    if (trialsError) {
      console.error('Error fetching expired trials:', trialsError)
      return NextResponse.json(
        { error: 'Failed to fetch expired trials' },
        { status: 500 }
      )
    }

    if (!expiredTrials || expiredTrials.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired trials to process',
        processed: 0
      })
    }

    console.log(`Found ${expiredTrials.length} expired trials to process`)

    let successCount = 0
    let failureCount = 0

    // Process each expired trial
    for (const trial of expiredTrials) {
      try {
        console.log(`Processing expired trial: ${trial.id} for number: ${trial.phone_number}`)

        // Release the Twilio number
        const released = await releaseTwilioNumber(trial.twilio_number_sid)

        // Update trial status
        const { error: updateError } = await supabase
          .from('whatsapp_trials')
          .update({ 
            status: released ? 'released' : 'expired',
            updated_at: new Date().toISOString()
          })
          .eq('id', trial.id)

        if (updateError) {
          console.error(`Failed to update trial ${trial.id}:`, updateError)
          failureCount++
          continue
        }

        // Update the corresponding agent channel
        const { error: channelError } = await supabase
          .from('agent_channels')
          .update({ 
            status: 'trial_expired',
            connected: false
          })
          .eq('agent_id', trial.agent_id)
          .eq('channel_type', 'whatsapp')

        if (channelError) {
          console.error(`Failed to update channel for trial ${trial.id}:`, channelError)
        }

        successCount++
        console.log(`Successfully processed trial ${trial.id}`)

      } catch (error) {
        console.error(`Error processing trial ${trial.id}:`, error)
        failureCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${expiredTrials.length} expired trials`,
      processed: successCount,
      failures: failureCount,
      total: expiredTrials.length
    })

  } catch (error: any) {
    console.error('CRON job error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
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
    console.error('Failed to release Twilio number:', numberSid, error)
    
    // Some errors are expected (e.g., number already released)
    if (error.code === 20404) {
      console.log('Number was already released:', numberSid)
      return true
    }
    
    return false
  }
}
