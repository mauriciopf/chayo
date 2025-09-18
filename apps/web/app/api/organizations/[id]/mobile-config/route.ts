import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/shared/supabase/server';
import { ThemeConfigSchema } from '@/lib/shared/types/configTypes';

// Default theme constants (inlined for Vercel compatibility)
const DEFAULT_THEME = {
  primaryColor: '#2F5D62',
  secondaryColor: '#2C2C2E',
  backgroundColor: '#1C1C1E',
  textColor: '#FFFFFF',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params;
  try {
    const supabase = await getSupabaseServerClient();


    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get mobile branding configuration
    const { data: config, error } = await supabase
      .from('organization_app_configs')
      .select('theme_config')
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching mobile branding config:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Return config or defaults
    const themeConfig = config?.theme_config || DEFAULT_THEME;

    return NextResponse.json(themeConfig);
  } catch (error) {
    console.error('Error in mobile branding GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params;
  try {
    const supabase = await getSupabaseServerClient();


    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const themeConfig = ThemeConfigSchema.parse(body);

    // Upsert mobile branding configuration
    const { data, error } = await supabase
      .from('organization_app_configs')
      .upsert({
        organization_id: organizationId,
        theme_config: themeConfig,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'organization_id'
      })
      .select('theme_config')
      .single();

    if (error) {
      console.error('Error saving mobile branding config:', error);
      return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
    }

    return NextResponse.json(data.theme_config);
  } catch (error) {
    console.error('Error in mobile branding POST:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid configuration data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}