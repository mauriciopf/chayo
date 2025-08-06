import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

export const dynamic = 'force-dynamic'

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
      return NextResponse.json({ 
        isCompleted: false,
        progress: {
          totalQuestions: 0,
          answeredQuestions: 0,
          currentStage: 'stage_1',
          progressPercentage: 0,
          isCompleted: false,
          stage1Completed: false,
          stage2Completed: false,
          stage3Completed: false
        }
      })
    }
    
    // Check setup completion status
    const { data: setupStatus, error: setupError } = await supabase
      .from('setup_completion')
      .select('*')
      .eq('organization_id', organization.id)
      .single()
    
    if (setupError || !setupStatus) {
      return NextResponse.json({ 
        isCompleted: false,
        progress: {
          totalQuestions: 0,
          answeredQuestions: 0,
          currentStage: 'stage_1',
          progressPercentage: 0,
          isCompleted: false,
          stage1Completed: false,
          stage2Completed: false,
          stage3Completed: false
        }
      })
    }
    
    const isCompleted = setupStatus.setup_status === 'completed'
    
    // Get all questions for progress calculation
    const { data: allQuestions, error: questionsError } = await supabase
      .from('business_info_fields')
      .select('is_answered, stage')
      .eq('organization_id', organization.id)
    
    if (questionsError) {
      console.error('Error fetching questions for progress:', questionsError)
      return NextResponse.json({ 
        isCompleted,
        progress: {
          totalQuestions: 0,
          answeredQuestions: 0,
          currentStage: 'stage_1',
          progressPercentage: isCompleted ? 100 : 0,
          isCompleted,
          stage1Completed: false,
          stage2Completed: false,
          stage3Completed: false
        }
      })
    }
    
    const totalQuestions = allQuestions?.length || 0
    const answeredQuestions = allQuestions?.filter((q: any) => q.is_answered).length || 0
    
    // Calculate stage completion based on questions
    const stage1Questions = allQuestions?.filter((q: any) => q.stage === 'stage_1') || []
    const stage2Questions = allQuestions?.filter((q: any) => q.stage === 'stage_2') || []
    const stage3Questions = allQuestions?.filter((q: any) => q.stage === 'stage_3') || []
    
    const stage1Completed = stage1Questions.length > 0 && stage1Questions.every((q: any) => q.is_answered)
    const stage2Completed = stage2Questions.length > 0 && stage2Questions.every((q: any) => q.is_answered)
    const stage3Completed = stage3Questions.length > 0 && stage3Questions.every((q: any) => q.is_answered)
    
    // Get current stage (stage with most unanswered questions)
    const stageCounts = allQuestions?.reduce((acc: Record<string, number>, q: any) => {
      if (!q.is_answered) {
        acc[q.stage || 'stage_1'] = (acc[q.stage || 'stage_1'] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>) || {}

    const currentStage = Object.keys(stageCounts).length > 0 
      ? Object.entries(stageCounts).sort(([,a], [,b]) => (b as number) - (a as number))[0][0]
      : 'stage_1'
    
    // Calculate progress based on stage completion and current stage progress
    let progressPercentage = 0
    if (isCompleted) {
      progressPercentage = 100
    } else {
      // Stage-based progress calculation:
      // Stage 1: 0% → 40% (7 core questions)
      // Stage 2: 40% → 70% (industry-specific questions)  
      // Stage 3: 70% → 100% (branding questions)
      
      if (stage3Completed) {
        progressPercentage = 100
      } else if (stage2Completed) {
        progressPercentage = 70
      } else if (stage1Completed) {
        progressPercentage = 40
      } else {
        // Within stage 1 - show incremental progress
        if (currentStage === 'stage_1' && answeredQuestions > 0) {
          // Stage 1 has 7 questions, so each represents ~5.7% progress
          const stage1Progress = Math.min((answeredQuestions / 7) * 40, 39)
          progressPercentage = Math.round(stage1Progress)
        } else if (currentStage === 'stage_2' && answeredQuestions > 0) {
          // Currently in stage 2 (stage 1 must be complete)
          progressPercentage = 40 + Math.round((answeredQuestions / 5) * 30) // Assume ~5 stage 2 questions
        } else if (currentStage === 'stage_3' && answeredQuestions > 0) {
          // Currently in stage 3 (stages 1&2 must be complete)  
          progressPercentage = 70 + Math.round((answeredQuestions / 3) * 30) // 3 stage 3 questions
        } else {
          progressPercentage = answeredQuestions > 0 ? 5 : 0
        }
      }
    }
    
    return NextResponse.json({ 
      isCompleted,
      progress: {
        totalQuestions,
        answeredQuestions,
        currentStage,
        progressPercentage,
        isCompleted,
        stage1Completed,
        stage2Completed,
        stage3Completed
      }
    })
    
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return NextResponse.json({ 
      isCompleted: false,
      progress: {
        totalQuestions: 0,
        answeredQuestions: 0,
        currentStage: 'stage_1',
        progressPercentage: 0,
        isCompleted: false,
        stage1Completed: false,
        stage2Completed: false,
        stage3Completed: false
      },
      threshold: 10
    })
  }
} 