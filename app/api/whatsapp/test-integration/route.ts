import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { twilioClient, TWILIO_CONFIG } from '@/lib/twilio/client'

// Comprehensive test endpoint for WhatsApp integration
export async function GET(request: NextRequest) {
  try {
    const { supabase } = createClient(request)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const testResults = {
      timestamp: new Date().toISOString(),
      user: user.email,
      tests: [] as any[]
    }

    // Test 1: Twilio Configuration
    testResults.tests.push({
      name: 'Twilio Configuration',
      status: TWILIO_CONFIG.isConfigured ? 'PASS' : 'FAIL',
      details: {
        accountSid: TWILIO_CONFIG.accountSid ? '✓ Present' : '✗ Missing',
        authToken: TWILIO_CONFIG.authToken ? '✓ Present' : '✗ Missing',
        webhookUrl: TWILIO_CONFIG.webhookUrl || 'Not configured',
        messagingServiceSid: TWILIO_CONFIG.messagingServiceSid || 'Will be auto-created'
      }
    })

    // Test 2: Database Schema
    try {
      // Check if agent_channels table exists
      const { data: channels, error: channelsError } = await supabase
        .from('agent_channels')
        .select('*')
        .limit(1)

      // Check if messages table exists
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .limit(1)

      testResults.tests.push({
        name: 'Database Schema',
        status: (!channelsError && !messagesError) ? 'PASS' : 'FAIL',
        details: {
          agent_channels: channelsError ? `Error: ${channelsError.message}` : '✓ Available',
          messages: messagesError ? `Error: ${messagesError.message}` : '✓ Available'
        }
      })
    } catch (error: any) {
      testResults.tests.push({
        name: 'Database Schema',
        status: 'FAIL',
        details: { error: error.message }
      })
    }

    // Test 3: User's Agents
    try {
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id, name, created_at')
        .eq('user_id', user.id)

      testResults.tests.push({
        name: 'User Agents',
        status: agentsError ? 'FAIL' : 'PASS',
        details: {
          count: agents?.length || 0,
          agents: agents?.map((a: any) => ({ id: a.id, name: a.name })) || [],
          error: agentsError?.message
        }
      })
    } catch (error: any) {
      testResults.tests.push({
        name: 'User Agents',
        status: 'FAIL',
        details: { error: error.message }
      })
    }

    // Test 4: Existing WhatsApp Channels
    try {
      const { data: whatsappChannels, error: channelsError } = await supabase
        .from('agent_channels')
        .select('*')
        .eq('user_id', user.id)
        .eq('channel_type', 'whatsapp')

      testResults.tests.push({
        name: 'WhatsApp Channels',
        status: channelsError ? 'FAIL' : 'PASS',
        details: {
          count: whatsappChannels?.length || 0,
          channels: whatsappChannels?.map((c: any) => ({
            agentId: c.agent_id,
            phoneNumber: c.phone_number,
            status: c.status,
            businessName: c.business_name
          })) || [],
          error: channelsError?.message
        }
      })
    } catch (error: any) {
      testResults.tests.push({
        name: 'WhatsApp Channels',
        status: 'FAIL',
        details: { error: error.message }
      })
    }

    // Test 5: Environment Variables
    testResults.tests.push({
      name: 'Environment Variables',
      status: 'INFO',
      details: {
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'Not set',
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Present' : '✗ Missing',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Present' : '✗ Missing',
        NODE_ENV: process.env.NODE_ENV
      }
    })

    // Overall status
    const failedTests = testResults.tests.filter(t => t.status === 'FAIL').length
    const passedTests = testResults.tests.filter(t => t.status === 'PASS').length
    
    return NextResponse.json({
      ...testResults,
      summary: {
        total: testResults.tests.length,
        passed: passedTests,
        failed: failedTests,
        overall: failedTests === 0 ? 'READY' : 'NEEDS_ATTENTION'
      }
    })

  } catch (error: any) {
    console.error('Test endpoint error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}
