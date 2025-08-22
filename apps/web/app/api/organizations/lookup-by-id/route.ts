import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/shared/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await request.json();

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();

    // Get organization slug by ID
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      organizationSlug: organization.slug,
    });
  } catch (error) {
    console.error('Error looking up organization by ID:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS method for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
