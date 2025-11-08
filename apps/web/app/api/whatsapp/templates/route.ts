import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

const SYSTEM_USER_TOKEN = process.env.FACEBOOK_SYSTEM_USER_TOKEN

/**
 * GET /api/whatsapp/templates
 * List all message templates and their approval status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')
    const templateName = searchParams.get('name')
    const toolType = searchParams.get('toolType')  // NEW: Filter by tool type

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      )
    }

    // Get WhatsApp account for this organization
    const supabase = await getSupabaseServerClient()
    const { data: whatsappAccount, error: fetchError } = await supabase
      .from('whatsapp_business_accounts')
      .select('waba_id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .maybeSingle()

    if (fetchError || !whatsappAccount) {
      return NextResponse.json(
        { error: 'WhatsApp not connected for this organization' },
        { status: 404 }
      )
    }

    const { waba_id } = whatsappAccount

    if (!SYSTEM_USER_TOKEN) {
      return NextResponse.json(
        { error: 'System user token not configured' },
        { status: 500 }
      )
    }

    // Fetch templates from WhatsApp API
    // Using v23.0 (latest stable version as per Meta docs)
    let url = `https://graph.facebook.com/v23.0/${waba_id}/message_templates?fields=name,status,category,sub_category,language,components`
    
    if (templateName) {
      url += `&name=${encodeURIComponent(templateName)}`
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${SYSTEM_USER_TOKEN}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Failed to fetch templates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: response.status }
      )
    }

    const data = await response.json()
    let templates = data.data || []

    // Filter by tool type if specified
    // Template naming convention: {toolType}_{language}_{timestamp}
    // e.g., "reservations_es_1762626736366"
    if (toolType) {
      templates = templates.filter((template: any) => 
        template.name.startsWith(`${toolType}_`)
      )
    }

    return NextResponse.json({
      success: true,
      templates: templates.map((template: any) => ({
        id: template.id,
        name: template.name,
        status: template.status,
        category: template.category,
        sub_category: template.sub_category,
        language: template.language,
        components: template.components
      }))
    })
  } catch (error) {
    console.error('❌ Error fetching templates:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

