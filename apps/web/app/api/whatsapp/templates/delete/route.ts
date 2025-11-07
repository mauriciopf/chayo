import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

const SYSTEM_USER_TOKEN = process.env.FACEBOOK_SYSTEM_USER_TOKEN

/**
 * DELETE /api/whatsapp/templates/delete
 * Delete a WhatsApp template by name or ID
 * 
 * Meta Limitations:
 * - If template sent but not delivered, status becomes PENDING_DELETION (30 days)
 * - Cannot create template with same name for 30 days after deletion
 * - Cannot delete templates with DISABLED status
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')
    const templateName = searchParams.get('name')
    const templateId = searchParams.get('hsm_id')  // Optional: For deleting by ID

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      )
    }

    if (!templateName) {
      return NextResponse.json(
        { error: 'Template name is required' },
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

    // Build delete URL
    let deleteUrl = `https://graph.facebook.com/v23.0/${waba_id}/message_templates?name=${encodeURIComponent(templateName)}`
    
    // If template ID provided, delete specific template (only that language)
    if (templateId) {
      deleteUrl += `&hsm_id=${encodeURIComponent(templateId)}`
    }
    // Otherwise, deletes ALL templates with that name (all languages)

    console.log('🗑️ Deleting template:', { 
      name: templateName, 
      hsm_id: templateId || 'all languages',
      waba_id
    })

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SYSTEM_USER_TOKEN}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Template deletion failed:', error)
      
      // Handle specific error cases
      if (error.error?.message?.includes('disabled')) {
        return NextResponse.json(
          { error: 'Cannot delete templates with DISABLED status' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: error.error?.message || 'Failed to delete template' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ Template deleted successfully')

    return NextResponse.json({
      success: true,
      message: templateId 
        ? `Template deleted: ${templateName} (specific version)`
        : `All templates deleted with name: ${templateName}`,
      warning: 'Note: Cannot create a template with the same name for 30 days if it was approved'
    })

  } catch (error) {
    console.error('❌ Error deleting template:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to delete template',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

