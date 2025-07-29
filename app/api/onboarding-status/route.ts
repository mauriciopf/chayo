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
    
    // Calculate progress based on completion status rather than just question count
    let progressPercentage = 0
    if (isCompleted) {
      progressPercentage = 100
    } else if (totalQuestions > 0) {
      const stage1Answered = stage1Questions.filter((q: any) => q.is_answered).length
      const stage2Answered = stage2Questions.filter((q: any) => q.is_answered).length
      const stage3Answered = stage3Questions.filter((q: any) => q.is_answered).length
      
      // Calculate progress based on current stage
      if (currentStage === 'stage_1') {
        progressPercentage = stage1Questions.length > 0 ? Math.round((stage1Answered / stage1Questions.length) * 100) : 0
      } else if (currentStage === 'stage_2') {
        // Stage 2: 33% for stage 1 + progress in stage 2
        const stage1Progress = 33 // Stage 1 is complete
        const stage2Progress = stage2Questions.length > 0 ? (stage2Answered / stage2Questions.length) * 33 : 0
        progressPercentage = Math.round(stage1Progress + stage2Progress)
      } else if (currentStage === 'stage_3') {
        // Stage 3: 66% for stages 1-2 + progress in stage 3
        const stage1And2Progress = 66 // Stages 1 and 2 are complete
        const stage3Progress = stage3Questions.length > 0 ? (stage3Answered / stage3Questions.length) * 34 : 0
        progressPercentage = Math.round(stage1And2Progress + stage3Progress)
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