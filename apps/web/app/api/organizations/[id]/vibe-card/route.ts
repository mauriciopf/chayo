import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/shared/supabase/server';
import { VibeCardData } from '@/lib/shared/types/vibeCardTypes';

// GET - Retrieve vibe card data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from('vibe_cards')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Vibe card not found' },
        { status: 404 }
      );
    }

    // Convert to VibeCardData format
    const vibeCardData = {
      business_name: data.business_name,
      business_type: data.business_type,
      origin_story: data.origin_story,
      value_badges: data.value_badges || [],
      personality_traits: data.personality_traits || [],
      vibe_colors: data.vibe_colors || {
        primary: '#8B7355',
        secondary: '#A8956F',
        accent: '#E6D7C3'
      },
      vibe_aesthetic: data.vibe_aesthetic || 'Boho-chic',
      why_different: data.why_different,
      perfect_for: data.perfect_for || [],
      customer_love: data.customer_love,
      location: data.location,
      website: data.website,
      contact_info: {
        phone: data.contact_phone,
        email: data.contact_email
      }
    };

    return NextResponse.json({
      vibe_card: vibeCardData
    });

  } catch (error) {
    console.error('Error fetching vibe card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update vibe card data
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    const vibeCardData: VibeCardData = await request.json();
    const supabase = await getSupabaseServerClient();

    // Update vibe card in dedicated table
    const { error: updateError } = await supabase
      .from('vibe_cards')
      .upsert({
        organization_id: organizationId,
        business_name: vibeCardData.business_name,
        business_type: vibeCardData.business_type,
        origin_story: vibeCardData.origin_story,
        value_badges: vibeCardData.value_badges,
        personality_traits: vibeCardData.personality_traits,
        vibe_colors: vibeCardData.vibe_colors,
        vibe_aesthetic: vibeCardData.vibe_aesthetic,
        why_different: vibeCardData.why_different,
        perfect_for: vibeCardData.perfect_for,
        customer_love: vibeCardData.customer_love,
        location: vibeCardData.location,
        website: vibeCardData.website,
        contact_phone: vibeCardData.contact_info?.phone,
        contact_email: vibeCardData.contact_info?.email,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id'
      });

    if (updateError) {
      console.error('Error updating vibe card:', updateError);
      return NextResponse.json(
        { error: 'Failed to update vibe card' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vibe_card: vibeCardData
    });

  } catch (error) {
    console.error('Error updating vibe card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
