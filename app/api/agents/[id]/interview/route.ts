import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chayoInterviewService } from '@/lib/services/chayoInterviewService'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const { action, sessionId, questionId, response } = await request.json()

    // Get user from auth
    const { supabase } = createClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found or unauthorized' },
        { status: 403 }
      )
    }

    switch (action) {
      case 'start':
        // Start a new interview session
        const session = await chayoInterviewService.startInterview(agentId, user.id)
        const firstQuestion = chayoInterviewService.getNextQuestion(session)
        
        return NextResponse.json({
          success: true,
          message: 'Interview session started',
          data: {
            sessionId: session.id,
            agentName: agent.name,
            currentQuestion: firstQuestion,
            progress: {
              totalQuestions: 20, // Total predefined questions
              completedQuestions: 0,
              progress: 0
            }
          }
        })

      case 'answer':
        // Record a response to a question
        if (!sessionId || !questionId || !response) {
          return NextResponse.json(
            { error: 'Session ID, question ID, and response are required' },
            { status: 400 }
          )
        }

        await chayoInterviewService.recordResponse(sessionId, questionId, response)
        
        // Get the next question
        const updatedSession = await chayoInterviewService.getInterviewProgress(sessionId)
        
        return NextResponse.json({
          success: true,
          message: 'Response recorded',
          data: {
            sessionId,
            currentQuestion: updatedSession.currentQuestion,
            progress: {
              totalQuestions: updatedSession.totalQuestions,
              completedQuestions: updatedSession.completedQuestions,
              progress: updatedSession.progress
            },
            isComplete: !updatedSession.currentQuestion
          }
        })

      case 'complete':
        // Complete the interview and process responses
        if (!sessionId) {
          return NextResponse.json(
            { error: 'Session ID is required' },
            { status: 400 }
          )
        }

        const { whatsappSetup } = await chayoInterviewService.completeInterview(sessionId)
        
        return NextResponse.json({
          success: true,
          message: 'Interview completed and business knowledge processed',
          data: {
            sessionId,
            agentName: agent.name,
            message: 'Your business information has been processed and your AI agent is now ready!',
            whatsappSetup
          }
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, answer, or complete' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('Interview API error:', error)
    return NextResponse.json(
      { error: 'Interview operation failed', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    // Get user from auth
    const { supabase } = createClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found or unauthorized' },
        { status: 403 }
      )
    }

    if (sessionId) {
      // Get specific session progress
      const progress = await chayoInterviewService.getInterviewProgress(sessionId)
      
      return NextResponse.json({
        success: true,
        data: {
          sessionId,
          agentName: agent.name,
          currentQuestion: progress.currentQuestion,
          progress: {
            totalQuestions: progress.totalQuestions,
            completedQuestions: progress.completedQuestions,
            progress: progress.progress
          },
          isComplete: !progress.currentQuestion
        }
      })
    } else {
      // Get all interview sessions for this agent
      const { data: sessions, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('agent_id', agentId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error('Failed to fetch interview sessions')
      }

      return NextResponse.json({
        success: true,
        data: {
          agentName: agent.name,
          sessions: sessions || []
        }
      })
    }

  } catch (error: any) {
    console.error('Interview GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interview data', details: error.message },
      { status: 500 }
    )
  }
} 