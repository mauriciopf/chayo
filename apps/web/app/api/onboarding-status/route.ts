import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'
import { IntegratedOnboardingService } from '@/lib/features/onboarding/services/integratedOnboardingService'

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
          isCompleted: false,
          stage1Completed: false,
          stage2Completed: false,
          stage3Completed: false
        }
      })
    }
    
    // Use the service method instead of duplicating logic
    const onboardingService = new IntegratedOnboardingService()
    const progress = await onboardingService.getOnboardingProgress(organization.id)
    
    return NextResponse.json({ 
      isCompleted: progress.isCompleted,
      progress: {
        totalQuestions: progress.totalQuestions,
        answeredQuestions: progress.answeredQuestions,
        currentStage: progress.currentStage,
        isCompleted: progress.isCompleted,
        stage1Completed: progress.stage1Completed,
        stage2Completed: progress.stage2Completed,
        stage3Completed: progress.stage3Completed
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
        isCompleted: false,
        stage1Completed: false,
        stage2Completed: false,
        stage3Completed: false
      }
    })
  }
} 