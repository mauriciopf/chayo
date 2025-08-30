import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

// GET: Fetch all active intake forms for an organization by slug (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient();
    const { orgSlug } = await params;

    // First, get the organization by slug
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', orgSlug)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Fetch active intake forms for the organization
    const { data: forms, error } = await supabase
      .from('intake_forms')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching intake forms:', error);
      return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 });
    }

    return NextResponse.json({ 
      forms: forms || [],
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug
      }
    });

  } catch (error) {
    console.error('Public intake forms GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
