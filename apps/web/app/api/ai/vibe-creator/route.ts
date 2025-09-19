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
    const systemPrompt = `You are an expert brand strategist and color psychologist creating compelling vibe cards for a boho marketplace. Your task is to analyze the business information and create:

1. **Perfect Color Palette**: Choose colors that reflect the business's personality and appeal to their target customers
2. **Enhanced Storytelling**: Polish their origin story into something magnetic and authentic
3. **Value Badges**: Extract key value propositions that customers care about
4. **Personality Traits**: Define the business character in relatable terms
5. **Differentiation**: Articulate what makes them special
6. **Customer Connection**: Identify their perfect customer matches
7. **Social Proof**: Create a testimonial-style statement about customer love

Focus on creating an emotional connection that will attract ideal customers in a marketplace setting.`

    const userPrompt = `Create a compelling vibe card for this business:

Business Name: ${business_info.business_name}
Business Type: ${business_info.business_type}
${business_info.origin_story ? `Origin Story: ${business_info.origin_story}` : ''}
${business_info.values?.length ? `Values: ${business_info.values.join(', ')}` : ''}
${business_info.personality?.length ? `Personality: ${business_info.personality.join(', ')}` : ''}
${business_info.target_customers?.length ? `Target Customers: ${business_info.target_customers.join(', ')}` : ''}

Generate a complete vibe profile that will make this business irresistible to their ideal customers.`

    const response = await openAIService.createChatCompletion({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: VibeCreationSchema,
      temperature: 0.8 // Higher creativity for vibe creation
    })

    const vibeData = JSON.parse(response.choices[0].message.content || '{}') as VibeCreationResponse

    return NextResponse.json(vibeData)

  } catch (error) {
    console.error('Vibe creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create vibe card' },
      { status: 500 }
    )
  }
}
