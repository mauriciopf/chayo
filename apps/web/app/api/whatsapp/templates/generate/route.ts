import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'
import { AITemplateGenerator } from '@/lib/features/whatsapp/services/AITemplateGenerator'
import { ToolType } from '@/lib/features/tools/shared/services/ToolSystemService'

/**
 * POST /api/whatsapp/templates/generate
 * Generate a WhatsApp template using AI for a specific tool type
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      organizationId, 
      toolType, 
      tone = 'friendly',
      language = 'es'
    } = await request.json()

    // Validate required fields
    if (!organizationId || !toolType) {
      return NextResponse.json(
        { error: 'organizationId and toolType are required' },
        { status: 400 }
      )
    }

    // Validate toolType
    const validToolTypes = [
      'reservations', 'products', 'forms', 'documents', 
      'vibe_card', 'customer_support', 'faqs', 'intake_forms', 'payments'
    ]
    if (!validToolTypes.includes(toolType)) {
      return NextResponse.json(
        { error: `Invalid toolType. Must be one of: ${validToolTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Get organization details for context
    const supabase = await getSupabaseServerClient()
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name, description')
      .eq('id', organizationId)
      .single()

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    console.log('🤖 Generating template:', { 
      toolType, 
      organization: organization.name,
      tone,
      language
    })

    // Generate template using AI
    const components = await AITemplateGenerator.generateTemplate({
      toolType: toolType as ToolType,
      businessName: organization.name,
      businessType: organization.description || undefined,
      tone: tone as 'formal' | 'casual' | 'friendly',
      language: language as 'es' | 'en'
    })

    console.log('✅ Template generated successfully')

    return NextResponse.json({
      success: true,
      components,
      metadata: {
        toolType,
        language,
        tone,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Error generating template:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate template',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

