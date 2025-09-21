import { NextRequest, NextResponse } from 'next/server'
import { openAIService } from '@/lib/shared/services/OpenAIService'
import { VIBE_AESTHETICS } from '@/lib/shared/types/vibeCardTypes'

interface VibeCreationRequest {
  business_info: {
    business_name: string
    business_type: string
    origin_story?: string
    value_badges?: string[] // Always arrays after parsing
    perfect_for?: string[] // Always arrays after parsing
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

    // AI Generation Schema - Streamlined to match database
    const VibeCreationSchema = {
      type: "json_schema",
      json_schema: {
        name: "vibe_creation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            business_name: { type: "string", description: "Enhanced business name" },
            business_type: { type: "string", description: "Refined business type" },
            origin_story: { type: "string", description: "Polished origin story" },
            value_badges: { type: "array", items: { type: "string" }, description: "Key value propositions" },
            perfect_for: { type: "array", items: { type: "string" }, description: "Perfect customer types" },
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
            }
          },
          required: ["business_name", "business_type", "origin_story", "value_badges", "perfect_for", "vibe_colors", "vibe_aesthetic"],
          additionalProperties: false
        }
      }
    } as const

    const systemPrompt = `You are an expert brand strategist creating compelling vibe cards for a boho marketplace. 

Based on the provided business information, create a COMPLETE vibe card by:

1. **Enhanced Business Identity**: Polish the business name and type for maximum appeal
2. **Perfect Color Palette**: Choose colors that reflect the business type and create emotional appeal
3. **Enhanced Storytelling**: Polish the origin story into something magnetic and authentic  
4. **Value Badges**: Extract or enhance key values that customers care about (3-5 badges)
5. **Customer Connection**: Identify ideal customer types for this business (3-5 types)
6. **Aesthetic Vibe**: Choose the perfect aesthetic that matches the business personality

IMPORTANT: Create a complete, compelling vibe card that would attract ideal customers in a boho marketplace.`

    const userPrompt = `Create a compelling vibe card for this business:

Business Name: ${business_info.business_name}
Business Type: ${business_info.business_type}
${business_info.origin_story ? `Origin Story: ${business_info.origin_story}` : ''}
${business_info.value_badges?.length ? `Value Badges: ${business_info.value_badges.join(', ')}` : ''}
${business_info.perfect_for?.length ? `Perfect For: ${business_info.perfect_for.join(', ')}` : ''}

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