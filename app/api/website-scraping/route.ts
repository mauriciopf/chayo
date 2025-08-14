import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'
import { OrganizationChatService } from '@/lib/features/chat/services/organizationChatService'
import { cookies } from 'next/headers'

export const runtime = 'nodejs' // IMPORTANT: not "edge" - required for Playwright

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient()
  let organizationId: string | undefined
  
  try {
    const { url, organizationId: orgId } = await request.json()
    organizationId = orgId

    if (!url || !organizationId) {
      return NextResponse.json(
        { error: 'URL and organizationId are required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the organization belongs to the user
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .eq('owner_id', user.id)
      .single()

    if (orgError || !organization) {
      console.error('Organization access error:', orgError)
      return NextResponse.json(
        { error: 'Organization not found or access denied' },
        { status: 403 }
      )
    }

    console.log('🌐 [API] Starting website scraping for:', url)

    // Dynamic import to prevent build-time evaluation of Playwright dependencies
    const { OrganizationChatService } = await import('@/lib/features/chat/services/organizationChatService')
    const chatService = new OrganizationChatService(supabase)

    // Perform website scraping and business info extraction
    const scrapingResult = await chatService.handleWebsiteScraping(
      url,
      organizationId
    )

    console.log('📊 [API] Scraping completed:', {
      success: scrapingResult.success,
      hasEnoughInfo: scrapingResult.hasEnoughInfo,
      error: scrapingResult.error
    })

    // Update final state - always mark as completed (success or failure)
    await supabase
      .from('organizations')
      .update({ website_scraping_state: 'completed' })
      .eq('id', organizationId)

    if (!scrapingResult.success) {
      return NextResponse.json({
        success: false,
        error: scrapingResult.error || 'Website scraping failed'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      hasEnoughInfo: scrapingResult.hasEnoughInfo,
      businessInfo: scrapingResult.businessInfo,
      message: scrapingResult.hasEnoughInfo 
        ? 'Business information extracted successfully! You can proceed with the enhanced onboarding.'
        : 'Could not extract enough business information. Standard onboarding will be used.'
    })

  } catch (error) {
    console.error('❌ Website scraping API error:', error)
    
    // Mark as completed even on error to avoid getting stuck
    try {
      await supabase
        .from('organizations')
        .update({ website_scraping_state: 'completed' })
        .eq('id', organizationId)
    } catch (stateError) {
      console.error('❌ Failed to update state after error:', stateError)
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}