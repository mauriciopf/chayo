import { NextRequest, NextResponse } from 'next/server'
import { openAIService } from '@/lib/shared/services/OpenAIService'
import { VIBE_AESTHETICS } from '@/lib/shared/types/vibeCardTypes'

interface VibeCreationRequest {
  business_info: {
    business_name: string
    business_type: string
    origin_story?: string
    values?: string[]
    target_customers?: string[]
  }
}

// Server-side only AI vibe generation endpoint
export async function POST(request: NextRequest) {
  console.log('🎨 [VIBE-CREATOR-API] AI vibe generation endpoint called')
  
  try {
    const body: VibeCreationRequest = await request.json()
    console.log('🎨 [VIBE-CREATOR-API] Request body:', JSON.stringify(body, null, 2))
    
    const { business_info } = body

    if (!business_info.business_name || !business_info.business_type) {
      console.log('🚨 [VIBE-CREATOR-API] Missing required fields')
      return NextResponse.json(
        { error: 'Business name and type are required' },
        { status: 400 }
      )
    }

    console.log('🤖 [VIBE-CREATOR-API] Generating vibe card for:', business_info.business_name)

    // AI Generation Schema
    const VibeCreationSchema = {
      type: "json_schema",
      json_schema: {
        name: "vibe_creation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            vibe_colors: {
              type: "object",
              properties: {
                primary: { type: "string", description: "Primary color in hex format" },
                secondary: { type: "string", description: "Secondary color in hex format" },
                accent: { type: "string", description: "Accent color in hex format" }
              },
              required: ["primary", "secondary", "accent"],
              additionalProperties: false
            },
            vibe_aesthetic: {
              type: "string",
              enum: [...VIBE_AESTHETICS],
              description: "The overall aesthetic vibe"
            },
            enhanced_origin_story: { type: "string", description: "Polished origin story" },
            value_badges: { type: "array", items: { type: "string" }, description: "Key value propositions" },
            personality_traits: { type: "array", items: { type: "string" }, description: "Business personality traits" },
            why_different: { type: "string", description: "What makes this business unique" },
            perfect_for: { type: "array", items: { type: "string" }, description: "Perfect customer types" },
            customer_love: { type: "string", description: "Testimonial-style statement" }
          },
          required: ["vibe_colors", "vibe_aesthetic", "enhanced_origin_story", "value_badges", "personality_traits", "why_different", "perfect_for", "customer_love"],
          additionalProperties: false
        }
      }
    } as const

    const systemPrompt = `You are an expert brand strategist creating compelling vibe cards for a boho marketplace. 

Based on the provided business information, create a COMPLETE vibe card by:

1. **Perfect Color Palette**: Choose colors that reflect the business type and create emotional appeal
2. **Enhanced Storytelling**: Polish the origin story into something magnetic and authentic  
3. **Value Badges**: Extract or enhance key values that customers care about
4. **Personality Traits**: Define business character based on type and provided info
5. **Differentiation**: Create compelling uniqueness statements
6. **Customer Connection**: Identify ideal customer types for this business
7. **Social Proof**: Generate authentic testimonial-style statements

IMPORTANT: Create a complete, compelling vibe card that would attract customers.`

    const userPrompt = `Create a compelling vibe card for this business:

Business Name: ${business_info.business_name}
Business Type: ${business_info.business_type}
${business_info.origin_story ? `Origin Story: ${business_info.origin_story}` : ''}
${business_info.values?.length ? `Values: ${business_info.values.join(', ')}` : ''}
${business_info.target_customers?.length ? `Target Customers: ${business_info.target_customers.join(', ')}` : ''}

Generate a complete vibe profile that will make this business irresistible to their ideal customers.`

    const responseContent = await openAIService.callChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      {
        model: 'gpt-4o',
        responseFormat: VibeCreationSchema,
        temperature: 0.8
      }
    )

    const vibeData = JSON.parse(responseContent || '{}')
    console.log('✅ [VIBE-CREATOR-API] Successfully generated vibe card')

    return NextResponse.json(vibeData)

  } catch (error) {
    console.error('🚨 [VIBE-CREATOR-API] Error creating vibe card:', error)
    return NextResponse.json(
      { error: 'Failed to create vibe card' },
      { status: 500 }
    )
  }
}