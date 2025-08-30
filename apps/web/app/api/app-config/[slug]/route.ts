import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/shared/supabase/server';
import { AppConfigSchema } from '@/lib/shared/types/configTypes';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: organizationSlug } = await params;
  try {
    const supabase = await getSupabaseServerClient();


    // Get organization by slug
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', organizationSlug)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get organization's enabled tools using the existing RPC function
    const { data: toolsData } = await supabase
      .rpc('get_organization_agent_tools', {
        org_id: organization.id
      });

    // Extract enabled tools from the response
    const enabledTools: string[] = [];
    if (toolsData) {
      Object.keys(toolsData).forEach(key => {
        if (toolsData[key] === true) {
          enabledTools.push(key);
        }
      });
    }

    // Get mobile branding configuration
    const { data: brandingConfig } = await supabase
      .from('organization_app_configs')
      .select('theme_config')
      .eq('organization_id', organization.id)
      .single();

    // Build app configuration
    const webBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chayo.vercel.app';
    const apiBaseUrl = webBaseUrl;

    const appConfig = {
      organizationSlug: organization.slug,
      organizationId: organization.id,
      businessName: organization.name,
      appName: 'Chayo', // Default for free tier
      theme: brandingConfig?.theme_config || {
        primaryColor: '#007AFF',
        secondaryColor: '#5856D6',
        backgroundColor: '#FFFFFF',
        textColor: '#000000',
      },
      enabledTools,
      webBaseUrl,
      apiBaseUrl,
    };

    // Validate the configuration
    const validatedConfig = AppConfigSchema.parse(appConfig);

    return NextResponse.json(validatedConfig);
  } catch (error) {
    console.error('Error fetching app config:', error);
    return NextResponse.json({ error: 'Failed to fetch app configuration' }, { status: 500 });
  }
}

// OPTIONS method for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}