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
    let url = `https://graph.facebook.com/v21.0/${waba_id}/message_templates?fields=name,status,category,language,components`
    
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
    const templates = data.data || []

    return NextResponse.json({
      success: true,
      templates: templates.map((template: any) => ({
        name: template.name,
        status: template.status,
        category: template.category,
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

