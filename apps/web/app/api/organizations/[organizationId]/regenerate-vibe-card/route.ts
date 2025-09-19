import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/shared/supabase/server';
import { VibeCardService } from '@/lib/features/onboarding/services/vibeCardService';

// POST - Regenerate vibe card using AI
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const supabase = await getSupabaseServerClient();
    const vibeCardService = new VibeCardService(supabase);

    // Check if organization has completed setup
    const { data: setupData, error: setupError } = await supabase
      .from('setup_completion')
      .select('setup_status')
      .eq('organization_id', organizationId)
      .single();

    if (setupError || setupData?.setup_status !== 'completed') {
      return NextResponse.json(
        { error: 'Organization setup not completed' },
        { status: 400 }
      );
    }

    // Regenerate vibe card from business info fields
    const newVibeCard = await vibeCardService.generateVibeCardFromBusinessInfo(organizationId);

    if (!newVibeCard) {
      return NextResponse.json(
        { error: 'Failed to regenerate vibe card' },
        { status: 500 }
      );
    }

    // Update setup completion with new vibe card
    const { data: currentData, error: fetchError } = await supabase
      .from('setup_completion')
      .select('completion_data')
      .eq('organization_id', organizationId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch current data' },
        { status: 500 }
      );
    }

    const updatedCompletionData = {
      ...currentData.completion_data,
      vibe_card: newVibeCard
    };

    const { error: updateError } = await supabase
      .from('setup_completion')
      .update({
        completion_data: updatedCompletionData,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId);

    if (updateError) {
      console.error('Error updating vibe card:', updateError);
      return NextResponse.json(
        { error: 'Failed to save regenerated vibe card' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vibe_card: newVibeCard,
      message: 'Vibe card regenerated successfully'
    });

  } catch (error) {
    console.error('Error regenerating vibe card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
