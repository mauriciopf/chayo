import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'
import { MarketplaceVibeCard } from '@/lib/shared/types/vibeCardTypes'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Get URL search params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const business_type = searchParams.get('business_type')
    const search = searchParams.get('search')

    // Build query for marketplace vibe cards using the new table
    let query = supabase
      .from('marketplace_vibe_cards')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (business_type) {
      query = query.eq('business_type', business_type)
    }

    if (search) {
      query = query.or(`
        business_name.ilike.%${search}%,
        business_type.ilike.%${search}%,
        origin_story.ilike.%${search}%,
        why_different.ilike.%${search}%,
        location.ilike.%${search}%
      `)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching marketplace vibe cards:', error)
      return NextResponse.json(
        { error: 'Failed to fetch marketplace vibe cards' },
        { status: 500 }
      )
    }

    // Transform data to marketplace vibe card format
    // Map old database columns to new real estate VibeCardData structure
    const vibeCards: MarketplaceVibeCard[] = data?.map(item => ({
      organization_id: item.organization_id,
      slug: item.slug,
      setup_status: 'completed' as const,
      completed_at: item.created_at,
      vibe_data: {
        // New real estate fields (mapped from old columns)
        agent_name: item.business_name,
        coverage_location: item.location || '',
        services: item.value_badges || [],
        online_presence: item.website || '',
        unique_value: item.why_different || '',
        
        // Legacy fields for backward compatibility
        business_name: item.business_name,
        business_type: item.business_type,
        origin_story: item.origin_story,
        value_badges: item.value_badges || [],
        personality_traits: item.personality_traits || [],
        vibe_colors: item.vibe_colors || {
          primary: '#8B7355',
          secondary: '#A8956F',
          accent: '#E6D7C3'
        },
        vibe_aesthetic: item.vibe_aesthetic || 'Boho-chic',
        why_different: item.why_different,
        perfect_for: item.perfect_for || [],
        customer_love: item.customer_love,
        location: item.location,
        website: item.website,
        ai_generated_image_url: item.ai_generated_image_url,
        contact_info: {
          phone: item.contact_phone,
          email: item.contact_email
        }
      }
    })) || []

    // Get total count for pagination
    let countQuery = supabase
      .from('marketplace_vibe_cards')
      .select('organization_id', { count: 'exact', head: true })

    if (business_type) {
      countQuery = countQuery.eq('business_type', business_type)
    }

    if (search) {
      countQuery = countQuery.or(`
        business_name.ilike.%${search}%,
        business_type.ilike.%${search}%,
        origin_story.ilike.%${search}%,
        why_different.ilike.%${search}%,
        location.ilike.%${search}%
      `)
    }

    const { count } = await countQuery

    return NextResponse.json({
      vibe_cards: vibeCards,
      total: count || 0,
      limit,
      offset,
      has_more: (count || 0) > offset + limit
    })

  } catch (error) {
    console.error('Marketplace vibe cards API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get unique business types for filtering
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'get_business_types') {
      const supabase = await getSupabaseServerClient()
      
      const { data, error } = await supabase
        .from('marketplace_vibe_cards')
        .select('business_type')

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch business types' },
          { status: 500 }
        )
      }

      // Extract unique business types
      const businessTypes = [...new Set(
        data
          ?.map(item => item.business_type)
          .filter(Boolean)
          .sort()
      )] || []

      return NextResponse.json({ business_types: businessTypes })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Marketplace business types API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
