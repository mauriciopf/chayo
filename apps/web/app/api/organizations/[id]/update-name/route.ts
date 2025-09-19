import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/shared/supabase/server';

// PUT - Update organization name
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    const { name } = await request.json();
    const supabase = await getSupabaseServerClient();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Valid organization name is required' },
        { status: 400 }
      );
    }

    // Update organization name
    const { error: orgError } = await supabase
      .from('organizations')
      .update({
        name: name.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId);

    if (orgError) {
      console.error('Error updating organization name:', orgError);
      return NextResponse.json(
        { error: 'Failed to update organization name' },
        { status: 500 }
      );
    }

    // Also update vibe card business_name if it exists
    const { error: vibeCardError } = await supabase
      .from('vibe_cards')
      .update({
        business_name: name.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId);

    // Don't fail if vibe card update fails (it might not exist yet)
    if (vibeCardError) {
      console.warn('Note: Could not update vibe card business name:', vibeCardError);
    }

    return NextResponse.json({
      success: true,
      name: name.trim()
    });

  } catch (error) {
    console.error('Error updating organization name:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
