import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/shared/supabase/server';

/**
 * GET /api/vibe-card/[slug]
 * Fetch vibe card data by organization slug (public endpoint for mobile app)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  try {
    const supabase = await getSupabaseServerClient();

    // Get organization by slug
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', slug)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' }, 
        { status: 404 }
      );
    }

    // Get vibe card data
    const { data: vibeCard, error: vibeError } = await supabase
      .from('vibe_cards')
      .select('*')
      .eq('organization_id', organization.id)
      .single();

    if (vibeError || !vibeCard) {
      return NextResponse.json(
        { error: 'Vibe card not found' }, 
        { status: 404 }
      );
    }

    // Return vibe card with organization info
    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
      vibeCard: {
        business_name: vibeCard.business_name,
        business_type: vibeCard.business_type,
        origin_story: vibeCard.origin_story,
        value_badges: vibeCard.value_badges || [],
        perfect_for: vibeCard.perfect_for || [],
        vibe_colors: vibeCard.vibe_colors || {
          primary: '#8B7355',
          secondary: '#A8956F',
          accent: '#E6D7C3'
        },
        vibe_aesthetic: vibeCard.vibe_aesthetic || 'Boho-chic',
        ai_generated_image_url: vibeCard.ai_generated_image_url,
        updated_at: vibeCard.updated_at
      }
    });

  } catch (error) {
    console.error('Vibe card API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

