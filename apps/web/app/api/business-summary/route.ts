import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { getSupabaseServerClient } from "@/lib/shared/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    // Get user from auth
    // Authentication using server supabase client
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get business constraints from the view
    const { data: businessData, error: businessError } = await supabase
      .from('business_constraints_view')
      .select('business_constraints')
      .eq('organization_id', membership.organization_id)
      .single()

    if (businessError || !businessData?.business_constraints) {
      return NextResponse.json({ 
        error: 'No business information found',
        summary: 'No business information has been collected yet. Start a conversation with your AI assistant to begin gathering your business details.'
      }, { status: 404 })
    }

    // Format the business constraints using AI
    const formattedSummary = await formatBusinessSummary(businessData.business_constraints)

    return NextResponse.json({
      success: true,
      summary: formattedSummary,
      rawData: businessData.business_constraints
    })

  } catch (error) {
    console.error('Business summary API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business summary' }, 
      { status: 500 }
    )
  }
}

/**
 * Format business constraints JSON into a readable summary using AI
 */
async function formatBusinessSummary(businessConstraints: any): Promise<string> {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return fallbackFormatter(businessConstraints)
    }

    const prompt = `You are a business summary formatter. Convert the following business information JSON into a well-structured, human-readable summary.

BUSINESS DATA:
${JSON.stringify(businessConstraints, null, 2)}

FORMAT THE RESPONSE AS:
- Use clear headings and bullet points
- Group related information together
- Make it easy to scan and read
- Convert technical field names to user-friendly labels
- Only include fields that have actual values (not null, undefined, or empty)
- Use a professional but friendly tone
- If business_info_gathered exists, mention how much information has been collected

EXAMPLE FORMAT:
# Business Overview
• Business Name: [name]
• Business Type: [type]
• Industry: [industry]

# Products & Services
• [list services/products]

# Business Details
• Target Customers: [customers]
• Business Goals: [goals]
• Challenges: [challenges]

[Include other relevant sections based on available data]

Respond with ONLY the formatted summary, no additional text.`

    // Use centralized OpenAI service
    const { openAIService } = await import('@/lib/shared/services/OpenAIService')
    
    const aiResponse = await openAIService.callCompletion([
      {
        role: 'system',
        content: 'You are a professional business summary formatter. Format business data into clear, readable summaries.'
      },
      {
        role: 'user',
        content: prompt
      }
    ], {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 1500
    })

    return aiResponse || fallbackFormatter(businessConstraints)

  } catch (error) {
    console.error('AI formatting failed:', error)
    return fallbackFormatter(businessConstraints)
  }
}

/**
 * Fallback formatter when AI is not available
 */
function fallbackFormatter(constraints: any): string {
  let summary = '# Business Summary\n\n'

  if (constraints.name || constraints.business_name) {
    summary += `**Business Name:** ${constraints.name || constraints.business_name}\n\n`
  }

  if (constraints.business_type) {
    summary += `**Business Type:** ${constraints.business_type}\n\n`
  }

  if (constraints.industry) {
    summary += `**Industry:** ${constraints.industry}\n\n`
  }

  if (constraints.products_services && constraints.products_services.length > 0) {
    summary += `**Products & Services:**\n`
    constraints.products_services.forEach((service: string) => {
      summary += `• ${service}\n`
    })
    summary += '\n'
  }

  if (constraints.target_customers) {
    summary += `**Target Customers:** ${constraints.target_customers}\n\n`
  }

  if (constraints.business_goals && constraints.business_goals.length > 0) {
    summary += `**Business Goals:**\n`
    constraints.business_goals.forEach((goal: string) => {
      summary += `• ${goal}\n`
    })
    summary += '\n'
  }

  if (constraints.challenges && constraints.challenges.length > 0) {
    summary += `**Challenges:**\n`
    constraints.challenges.forEach((challenge: string) => {
      summary += `• ${challenge}\n`
    })
    summary += '\n'
  }

  if (constraints.contact_info) {
    summary += `**Contact Information:** ${constraints.contact_info}\n\n`
  }

  if (constraints.business_info_gathered) {
    summary += `**Information Collection Status:** ${constraints.business_info_gathered} business details collected\n\n`
  }

  if (summary === '# Business Summary\n\n') {
    summary += 'No detailed business information has been collected yet. Start a conversation with your AI assistant to begin gathering your business details.'
  }

  return summary
} 