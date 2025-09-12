import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/shared/supabase/server';
import { AppConfigSchema, AVAILABLE_TOOLS } from '@/lib/shared/types/configTypes';
import { DEFAULT_THEME } from '@chayo/config';

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

    // Extract enabled tools from the response and filter out unknown tools
    const enabledTools: string[] = [];
    if (toolsData) {
      Object.keys(toolsData).forEach(key => {
        if (toolsData[key] === true) {
          // Only include tools that are known to this API version
          if (AVAILABLE_TOOLS.includes(key as any)) {
            enabledTools.push(key);
          } else {
            console.log(`🔧 Unknown tool "${key}" filtered out - not supported in this API version`);
          }
        }
      });
    }

    // Build app configuration
    const webBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chayo.vercel.app';
    const apiBaseUrl = webBaseUrl;

    // Only use custom theme if mobile-branding tool is enabled
    let themeConfig = DEFAULT_THEME;

    if (enabledTools.includes('mobile-branding')) {
      // Get mobile branding configuration only if tool is enabled
      const { data: brandingConfig } = await supabase
        .from('organization_app_configs')
        .select('theme_config')
        .eq('organization_id', organization.id)
        .single();
      
      if (brandingConfig?.theme_config) {
        themeConfig = brandingConfig.theme_config;
      }
    }

    const appConfig = {
      organizationSlug: organization.slug,
      organizationId: organization.id,
      businessName: organization.name,
      appName: 'Chayo', // Default for free tier
      theme: themeConfig,
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