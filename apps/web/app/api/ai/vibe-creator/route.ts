import { NextRequest, NextResponse } from 'next/server'
import { openAIService } from '@/lib/shared/services/OpenAIService'
import { VibeCardData, VibeColors, VIBE_AESTHETICS } from '@/lib/shared/types/vibeCardTypes'

interface VibeCreationRequest {
  business_info: {
    business_name: string
    business_type: string
    origin_story?: string
    values?: string[]
    personality?: string[]
    target_customers?: string[]
  }
}

interface VibeCreationResponse {
  vibe_colors: VibeColors
  vibe_aesthetic: string
  enhanced_origin_story: string
  value_badges: string[]
  personality_traits: string[]
  why_different: string
  perfect_for: string[]
  customer_love: string
}

// OpenAI Schema for Vibe Creation
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
            primary: {
              type: "string",
              description: "Primary color in hex format that reflects the business vibe"
            },
            secondary: {
              type: "string", 
              description: "Secondary color in hex format that complements the primary"
            },
            accent: {
              type: "string",
              description: "Accent color in hex format for highlights and emphasis"
            }
          },
          required: ["primary", "secondary", "accent"],
          additionalProperties: false
        },
        vibe_aesthetic: {
          type: "string",
          enum: [...VIBE_AESTHETICS],
          description: "The overall aesthetic vibe that best represents this business"
        },
        enhanced_origin_story: {
          type: "string",
          description: "A polished, compelling version of their origin story (2-3 sentences max)"
        },
        value_badges: {
          type: "array",
          items: {
            type: "string"
          },
          maxItems: 6,
          description: "Key value propositions as short badges (e.g., 'Sustainable', 'Family-owned', 'Local')"
        },
        personality_traits: {
          type: "array", 
          items: {
            type: "string"
          },
          maxItems: 5,
          description: "Personality traits that define the business character"
        },
        why_different: {
          type: "string",
          description: "What makes this business uniquely different (1-2 sentences)"
        },
        perfect_for: {
          type: "array",
          items: {
            type: "string"
          },
          maxItems: 4,
          description: "Types of customers who would be perfect matches"
        },
        customer_love: {
          type: "string",
          description: "A testimonial-style statement about what customers love most (1-2 sentences)"
        }
      },
      required: [
        "vibe_colors", 
        "vibe_aesthetic", 
        "enhanced_origin_story", 
        "value_badges", 
        "personality_traits",
        "why_different",
        "perfect_for", 
        "customer_love"
      ],
      additionalProperties: false
    }
  }
} as const

export async function POST(request: NextRequest) {
  try {
    const body: VibeCreationRequest = await request.json()
    const { business_info } = body

    if (!business_info.business_name || !business_info.business_type) {
      return NextResponse.json(
        { error: 'Business name and type are required' },
        { status: 400 }
      )
    }

    // Create AI prompt for vibe creation
    const systemPrompt = `You are an expert brand strategist creating compelling vibe cards for a boho marketplace. 

Based on the provided business information (which may be minimal), you must create a COMPLETE vibe card by:

1. **Perfect Color Palette**: Choose colors that reflect the business type and create emotional appeal
2. **Enhanced Storytelling**: Polish any origin story provided, or create one based on business type
3. **Value Badges**: Extract or infer key values that customers would care about
4. **Personality Traits**: Define business character based on type and any provided info
5. **Differentiation**: Create compelling uniqueness statements
6. **Customer Connection**: Identify ideal customer types for this business
7. **Social Proof**: Generate authentic testimonial-style statements

IMPORTANT: Even with minimal input, create a complete, compelling vibe card that would attract customers.`

    const userPrompt = `Create a compelling vibe card for this business:

Business Name: ${business_info.business_name}
Business Type: ${business_info.business_type}
${business_info.origin_story ? `Origin Story: ${business_info.origin_story}` : ''}
${business_info.values?.length ? `Values: ${business_info.values.join(', ')}` : ''}
${business_info.personality?.length ? `Personality: ${business_info.personality.join(', ')}` : ''}
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
        temperature: 0.8 // Higher creativity for vibe creation
      }
    )

    const vibeData = JSON.parse(responseContent || '{}') as VibeCreationResponse

    return NextResponse.json(vibeData)

  } catch (error) {
    console.error('Vibe creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create vibe card' },
      { status: 500 }
    )
  }
}
