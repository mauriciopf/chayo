import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/shared/supabase/server';
import { AppConfigSchema } from '@/lib/shared/types/configTypes';
import { isValidMobileAppCode } from '@/lib/shared/utils/mobileAppCode';
import { DEFAULT_THEME } from '@chayo/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: mobileAppCode } = await params;
  
  try {
    // Validate the mobile app code format
    if (!isValidMobileAppCode(mobileAppCode)) {
      return NextResponse.json(
        { error: 'Invalid mobile app code format. Must be 6 digits.' }, 
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();

    // Get organization by mobile app code
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, mobile_app_code')
      .eq('mobile_app_code', mobileAppCode)
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
      mobileAppCode: organization.mobile_app_code,
      appName: 'Chayo', // Default for free tier
      theme: brandingConfig?.theme_config || DEFAULT_THEME,
      enabledTools,
      webBaseUrl,
      apiBaseUrl,
    };

    // Validate the configuration
    const validatedConfig = AppConfigSchema.parse(appConfig);

    return NextResponse.json(validatedConfig);
  } catch (error) {
    console.error('Error fetching app config by mobile code:', error);
    
    // Return fallback configuration for development
    const fallbackConfig = {
      organizationSlug: 'demo-business',
      organizationId: 'fallback-org-id',
      businessName: 'Demo Business',
      mobileAppCode: mobileAppCode,
      appName: 'Chayo',
      theme: DEFAULT_THEME,
      enabledTools: ['appointments', 'payments', 'documents', 'faqs'],
      webBaseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://chayo.vercel.app',
      apiBaseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://chayo.vercel.app',
    };

    return NextResponse.json(fallbackConfig);
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
