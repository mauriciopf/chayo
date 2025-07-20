import { createClient } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'

export interface ClientBusinessConstraints {
  name: string
  tone: string
  industry?: string
  business_name?: string
  products_services?: string[]
  target_customers?: string
  business_goals?: string[]
  customer_service?: string
  contact_info?: string
  greeting?: string
  business_location?: string
  business_operating_years?: string
  client_communication_preferences?: string[]
  brand_voice?: string
  key_messages?: string[]
  business_size?: string
  business_operating_hours?: string
  business_qualifications?: string
  unique_approaches?: string
  business_phone?: string
  business_email?: string
  business_website?: string
  pricing_strategies?: string
  safety_measures?: string
}

export class ClientSystemPromptService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  /**
   * Generate a client-facing system prompt for customer interactions
   */
  async generateClientSystemPrompt(agentId: string): Promise<string> {
    try {
      // Get agent information
      const { data: agent, error: agentError } = await this.supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single()

      if (agentError || !agent) {
        throw new Error('Agent not found')
      }

      // Get business constraints from view
      const constraints = await this.getClientBusinessConstraints(agent.organization_id)

      // Build client-facing system prompt
      const systemPrompt = this.buildClientSystemPrompt(constraints)

      return systemPrompt
    } catch (error) {
      console.error('Error generating client system prompt:', error)
      throw new Error('Failed to generate client system prompt')
    }
  }

  /**
   * Get business constraints for client interactions
   */
  private async getClientBusinessConstraints(organizationId: string): Promise<ClientBusinessConstraints> {
    try {
      // Get business constraints directly from the view
      const { data: viewData, error } = await this.supabase
        .from('business_constraints_view')
        .select('business_constraints')
        .eq('organization_id', organizationId)
        .single()

      if (error || !viewData?.business_constraints) {
        console.warn('Failed to get business constraints from view, using fallback:', error)
        // Fallback to basic constraints
        return {
          name: 'Business Assistant',
          tone: 'professional',
          business_name: 'Our Business'
        }
      }

      const constraints: ClientBusinessConstraints = {
        name: viewData.business_constraints.business_name || viewData.business_constraints.name || 'Business Assistant',
        tone: viewData.business_constraints.tone || 'professional',
        business_name: viewData.business_constraints.business_name || 'Our Business',
        // Map all business info to client-facing constraints
        ...viewData.business_constraints
      }

      console.log('Retrieved client business constraints from view:', constraints)
      return constraints
    } catch (error) {
      console.error('Error parsing client business constraints:', error)
      // Fallback to basic constraints
      return {
        name: 'Business Assistant',
        tone: 'professional',
        business_name: 'Our Business'
      }
    }
  }

  /**
   * Build client-facing system prompt
   */
  private buildClientSystemPrompt(constraints: ClientBusinessConstraints): string {
    let prompt = `You are Chayo, the AI assistant for ${constraints.business_name || constraints.name}. You are here to help customers with information about the business and assist them with their needs.

## Business Information:
- Business Name: ${constraints.business_name || constraints.name}
- Communication Tone: ${constraints.tone}
${constraints.industry ? `- Industry: ${constraints.industry}` : ''}
${constraints.business_location ? `- Location: ${constraints.business_location}` : ''}
${constraints.business_operating_years ? `- Years in Business: ${constraints.business_operating_years}` : ''}
${constraints.business_size ? `- Business Size: ${constraints.business_size}` : ''}
${constraints.products_services ? `- Products/Services: ${Array.isArray(constraints.products_services) ? constraints.products_services.join(', ') : constraints.products_services}` : ''}
${constraints.target_customers ? `- Target Customers: ${constraints.target_customers}` : ''}
${constraints.business_operating_hours ? `- Operating Hours: ${constraints.business_operating_hours}` : ''}
${constraints.business_qualifications ? `- Qualifications: ${constraints.business_qualifications}` : ''}
${constraints.unique_approaches ? `- Unique Approach: ${constraints.unique_approaches}` : ''}
${constraints.contact_info ? `- Contact Information: ${constraints.contact_info}` : ''}
${constraints.business_phone ? `- Phone: ${constraints.business_phone}` : ''}
${constraints.business_email ? `- Email: ${constraints.business_email}` : ''}
${constraints.business_website ? `- Website: ${constraints.business_website}` : ''}
${constraints.pricing_strategies ? `- Pricing: ${constraints.pricing_strategies}` : ''}
${constraints.safety_measures ? `- Safety Measures: ${constraints.safety_measures}` : ''}

## Your Role as Customer Assistant:
- You represent ${constraints.business_name || constraints.name} professionally
- Help customers learn about products, services, and business information
- Answer questions about the business operations, hours, location, pricing, etc.
- Assist with general inquiries and provide helpful information
- Maintain a ${constraints.tone} tone throughout all interactions
- Be helpful, informative, and represent the business positively
- Use knowledge about the business's unique approach and qualifications when relevant

## Guidelines for Customer Service:
- Always respond in a ${constraints.tone} manner
- Provide accurate information about the business based on the details above
- If you don't know specific details, acknowledge this and suggest contacting the business directly
- Help customers understand what the business offers and how it can help them
- Be welcoming and professional in all interactions
- Use the business name when appropriate to reinforce brand recognition
- Highlight the business's unique qualities and qualifications when relevant
- Mention safety measures and quality standards when discussing services

## What you CAN do:
- Answer questions about products and services listed above
- Provide business information (location, hours, contact details)
- Explain what the business specializes in and their unique approach
- Help customers understand the business offerings and qualifications
- Provide general assistance and information about the business
- Share pricing information if available
- Discuss safety measures and quality standards

## What you CANNOT do:
- Make appointments or reservations (direct them to contact the business)
- Process payments or transactions
- Access customer personal information
- Make commitments on behalf of the business
- Provide medical, legal, or professional advice beyond the business scope
- Schedule services or guarantee availability

## Response Style:
- Keep responses helpful and informative
- Use the customer's language preference when possible
- Be concise but thorough
- Always end with an offer to help further or provide contact information if needed
- Maintain professionalism while being friendly and approachable
- Reference specific business qualifications or unique approaches when relevant

${constraints.greeting ? `## Custom Greeting: ${constraints.greeting}` : ''}

${constraints.brand_voice ? `## Brand Voice Guidelines: ${constraints.brand_voice}` : ''}

${constraints.key_messages && Array.isArray(constraints.key_messages) ? `## Key Messages to Emphasize:
${constraints.key_messages.map(msg => `- ${msg}`).join('\n')}` : ''}

Remember: You are the voice of ${constraints.business_name || constraints.name} to customers. Represent the business well, use all available business information to provide excellent customer service, and help customers understand why this business is the right choice for their needs.`

    return prompt
  }
} 