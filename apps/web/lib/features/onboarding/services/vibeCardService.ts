import { supabase } from '@/lib/shared/supabase/client'
import { openAIService } from '@/lib/shared/services/OpenAIService'
import { VibeCardData, VIBE_CARD_FIELDS, VIBE_AESTHETICS } from '@/lib/shared/types/vibeCardTypes'

export class VibeCardService {
  private supabaseClient: any

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient || supabase
  }

  /**
   * Generate AI-enhanced vibe data from business info (integrated AI generation)
   */
  private async generateAIVibeData(businessInfo: {
    business_name: string
    business_type: string
    origin_story: string
    values: string[]
    target_customers: string[]
  }): Promise<any> {
    console.log('🤖 [VIBE-SERVICE] Starting AI vibe generation...')
    
    try {
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

Business Name: ${businessInfo.business_name}
Business Type: ${businessInfo.business_type}
${businessInfo.origin_story ? `Origin Story: ${businessInfo.origin_story}` : ''}
${businessInfo.values?.length ? `Values: ${businessInfo.values.join(', ')}` : ''}
${businessInfo.target_customers?.length ? `Target Customers: ${businessInfo.target_customers.join(', ')}` : ''}

Generate a complete vibe profile that will make this business irresistible to their ideal customers.`

      // AI Vibe Creation Schema (inline)
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
              value_badges: { type: "array", items: { type: "string" }, maxItems: 6, description: "Key value propositions" },
              personality_traits: { type: "array", items: { type: "string" }, maxItems: 5, description: "Business personality traits" },
              why_different: { type: "string", description: "What makes this business unique" },
              perfect_for: { type: "array", items: { type: "string" }, maxItems: 4, description: "Perfect customer types" },
              customer_love: { type: "string", description: "Testimonial-style statement" }
            },
            required: ["vibe_colors", "vibe_aesthetic", "enhanced_origin_story", "value_badges", "personality_traits", "why_different", "perfect_for", "customer_love"],
            additionalProperties: false
          }
        }
      } as const

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

      return JSON.parse(responseContent || '{}')

    } catch (error) {
      console.error('🚨 [VIBE-SERVICE] AI generation error:', error)
      throw error
    }
  }

  /**
   * Generate vibe card data from collected business info fields
   */
  async generateVibeCardFromBusinessInfo(organizationId: string): Promise<VibeCardData | null> {
    console.log('🎨 [VIBE-SERVICE] Starting vibe card generation for organization:', organizationId)
    
    try {
      // Get all business info fields for this organization
      console.log('🔍 [VIBE-SERVICE] Fetching business info fields...')
      const { data: businessFields, error } = await this.supabaseClient
        .from('business_info_fields')
        .select('field_name, field_value')
        .eq('organization_id', organizationId)
        .eq('is_answered', true)

      console.log('📊 [VIBE-SERVICE] Business fields result:', { count: businessFields?.length || 0, error })
      
      if (error || !businessFields?.length) {
        console.error('🚨 [VIBE-SERVICE] Error fetching business info fields:', error)
        console.log('📋 [VIBE-SERVICE] No answered business fields found for organization:', organizationId)
        return null
      }

      // Convert fields to object
      const fieldsData: Record<string, any> = {}
      businessFields.forEach((field: any) => {
        if (field.field_value) {
          // Handle array fields (stored as JSON strings)
          try {
            const parsedValue = JSON.parse(field.field_value)
            fieldsData[field.field_name] = parsedValue
          } catch {
            // If not JSON, store as string
            fieldsData[field.field_name] = field.field_value
          }
        }
      })

      console.log('🎨 [VIBE-SERVICE] Collected fields data:', fieldsData)
      
      // Generate AI-enhanced vibe data directly (no API call needed)
      console.log('🤖 [VIBE-SERVICE] Generating AI-enhanced vibe data...')
      const aiVibeData = await this.generateAIVibeData({
        business_name: fieldsData[VIBE_CARD_FIELDS.BUSINESS_NAME] || 'Business',
        business_type: fieldsData[VIBE_CARD_FIELDS.BUSINESS_TYPE] || 'Business',
        origin_story: fieldsData[VIBE_CARD_FIELDS.ORIGIN_STORY] || '',
        values: fieldsData[VIBE_CARD_FIELDS.VALUE_BADGES] || [],
        target_customers: fieldsData[VIBE_CARD_FIELDS.PERFECT_FOR] || []
      })
      
      console.log('✅ [VIBE-SERVICE] AI vibe data generated:', aiVibeData)

      // Construct final vibe card data (streamlined with AI enhancement)
      const vibeCardData: VibeCardData = {
        // Essential collected fields
        business_name: fieldsData[VIBE_CARD_FIELDS.BUSINESS_NAME] || 'Business',
        business_type: fieldsData[VIBE_CARD_FIELDS.BUSINESS_TYPE] || 'Business',
        
        // AI-enhanced fields (optional - AI will generate if missing)
        origin_story: aiVibeData.enhanced_origin_story || fieldsData[VIBE_CARD_FIELDS.ORIGIN_STORY] || '',
        value_badges: aiVibeData.value_badges || fieldsData[VIBE_CARD_FIELDS.VALUE_BADGES] || [],
        perfect_for: aiVibeData.perfect_for || fieldsData[VIBE_CARD_FIELDS.PERFECT_FOR] || [],
        
        // AI-generated fields (always from AI)
        vibe_colors: aiVibeData.vibe_colors || {
          primary: '#8B7355',
          secondary: '#A8956F', 
          accent: '#E6D7C3'
        },
        vibe_aesthetic: aiVibeData.vibe_aesthetic || 'Boho-chic',
        personality_traits: aiVibeData.personality_traits || [],
        why_different: aiVibeData.why_different || '',
        customer_love: aiVibeData.customer_love || '',
        
        // Optional contact info
        location: fieldsData['location'],
        website: fieldsData['website'],
        contact_info: {
          phone: fieldsData['phone'] || fieldsData['contact_phone'],
          email: fieldsData['email'] || fieldsData['contact_email']
        }
      }

      return vibeCardData

    } catch (error) {
      console.error('Error generating vibe card:', error)
      return null
    }
  }

  /**
   * Complete onboarding by generating and storing vibe card data
   */
  async completeOnboardingWithVibeCard(organizationId: string): Promise<boolean> {
    try {
      // Generate vibe card data
      const vibeCardData = await this.generateVibeCardFromBusinessInfo(organizationId)
      
      if (!vibeCardData) {
        console.error('Failed to generate vibe card data')
        return false
      }

      // Store vibe card in dedicated table (with proper null handling)
      const { error: vibeCardError } = await this.supabaseClient
        .from('vibe_cards')
        .upsert({
          organization_id: organizationId,
          business_name: vibeCardData.business_name,
          business_type: vibeCardData.business_type,
          origin_story: vibeCardData.origin_story || '',
          value_badges: vibeCardData.value_badges || [],
          personality_traits: vibeCardData.personality_traits || [],
          vibe_colors: vibeCardData.vibe_colors || {
            primary: '#8B7355',
            secondary: '#A8956F', 
            accent: '#E6D7C3'
          },
          vibe_aesthetic: vibeCardData.vibe_aesthetic || 'Boho-chic',
          why_different: vibeCardData.why_different || '',
          perfect_for: vibeCardData.perfect_for || [],
          customer_love: vibeCardData.customer_love || '',
          location: vibeCardData.location || null,
          website: vibeCardData.website || null,
          contact_phone: vibeCardData.contact_info?.phone || null,
          contact_email: vibeCardData.contact_info?.email || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'organization_id'
        })

      if (vibeCardError) {
        console.error('Error storing vibe card:', vibeCardError)
        return false
      }

      // Update setup_completion to mark as completed with vibe card created
      const { error: setupError } = await this.supabaseClient
        .from('setup_completion')
        .update({
          setup_status: 'completed',
          completed_at: new Date().toISOString(),
          vibe_card_created: true,
          completion_data: { vibe_card_generated_at: new Date().toISOString() }
        })
        .eq('organization_id', organizationId)

      if (setupError) {
        console.error('Error updating setup completion:', setupError)
        return false
      }

      // Update organization name if business_name was collected
      if (vibeCardData.business_name && vibeCardData.business_name !== 'Business') {
        try {
          const { error: orgUpdateError } = await this.supabaseClient
            .from('organizations')
            .update({
              name: vibeCardData.business_name,
              updated_at: new Date().toISOString()
            })
            .eq('id', organizationId)

          if (orgUpdateError) {
            console.warn('⚠️ Failed to update organization name:', orgUpdateError)
          } else {
            console.log('✅ Updated organization name to:', vibeCardData.business_name)
          }
        } catch (orgError) {
          console.warn('⚠️ Error updating organization name:', orgError)
        }
      }

      console.log('✅ Onboarding completed with vibe card for organization:', organizationId)
      return true

    } catch (error) {
      console.error('Error completing onboarding with vibe card:', error)
      return false
    }
  }

  /**
   * Get vibe card data for a completed organization
   */
  async getVibeCardData(organizationId: string): Promise<VibeCardData | null> {
    try {
      const { data, error } = await this.supabaseClient
        .from('vibe_cards')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

      if (error || !data) {
        return null
      }

      // Convert database format to VibeCardData interface
      return {
        business_name: data.business_name,
        business_type: data.business_type,
        origin_story: data.origin_story,
        value_badges: data.value_badges || [],
        personality_traits: data.personality_traits || [],
        vibe_colors: data.vibe_colors || {
          primary: '#8B7355',
          secondary: '#A8956F',
          accent: '#E6D7C3'
        },
        vibe_aesthetic: data.vibe_aesthetic || 'Boho-chic',
        why_different: data.why_different,
        perfect_for: data.perfect_for || [],
        customer_love: data.customer_love,
        location: data.location,
        website: data.website,
        contact_info: {
          phone: data.contact_phone,
          email: data.contact_email
        }
      } as VibeCardData

    } catch (error) {
      console.error('Error getting vibe card data:', error)
      return null
    }
  }

  /**
   * Get all marketplace-ready vibe cards
   */
  async getMarketplaceVibeCards(): Promise<any[]> {
    try {
      const { data, error } = await this.supabaseClient
        .from('marketplace_vibe_cards')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching marketplace vibe cards:', error)
        return []
      }

      return data?.map((item: any) => ({
        organization_id: item.organization_id,
        slug: item.slug,
        setup_status: 'completed',
        completed_at: item.created_at,
        vibe_data: {
          business_name: item.business_name,
          business_type: item.business_type,
          origin_story: item.origin_story,
          value_badges: item.value_badges || [],
          personality_traits: item.personality_traits || [],
          vibe_colors: item.vibe_colors || {
            primary: '#8B7355',
            secondary: '#A8956F',
            accent: '#E6D7C3'
          },
          vibe_aesthetic: item.vibe_aesthetic || 'Boho-chic',
          why_different: item.why_different,
          perfect_for: item.perfect_for || [],
          customer_love: item.customer_love,
          location: item.location,
          website: item.website,
          contact_info: {
            phone: item.contact_phone,
            email: item.contact_email
          }
        }
      })) || []

    } catch (error) {
      console.error('Error fetching marketplace vibe cards:', error)
      return []
    }
  }

  /**
   * Regenerate vibe card for an organization (public method for dashboard use)
   */
  async regenerateVibeCard(organizationId: string): Promise<VibeCardData | null> {
    console.log('🔄 [VIBE-SERVICE] Regenerating vibe card for organization:', organizationId)
    
    try {
      // Generate new vibe card data
      const vibeCardData = await this.generateVibeCardFromBusinessInfo(organizationId)
      
      if (!vibeCardData) {
        console.error('🚨 [VIBE-SERVICE] Failed to generate vibe card data')
        return null
      }

      // Update existing vibe card in database
      const { error } = await this.supabaseClient
        .from('vibe_cards')
        .update({
          business_name: vibeCardData.business_name,
          business_type: vibeCardData.business_type,
          origin_story: vibeCardData.origin_story || '',
          value_badges: vibeCardData.value_badges || [],
          perfect_for: vibeCardData.perfect_for || [],
          vibe_colors: vibeCardData.vibe_colors || {
            primary: '#8B7355',
            secondary: '#A8956F', 
            accent: '#E6D7C3'
          },
          vibe_aesthetic: vibeCardData.vibe_aesthetic || 'Boho-chic',
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)

      if (error) {
        console.error('🚨 [VIBE-SERVICE] Error updating vibe card:', error)
        return null
      }

      console.log('✅ [VIBE-SERVICE] Vibe card regenerated successfully')
      return vibeCardData

    } catch (error) {
      console.error('🚨 [VIBE-SERVICE] Error regenerating vibe card:', error)
      return null
    }
  }

  /**
   * Update vibe card data (public method for dashboard editing)
   */
  async updateVibeCard(organizationId: string, updates: Partial<VibeCardData>): Promise<boolean> {
    console.log('✏️ [VIBE-SERVICE] Updating vibe card for organization:', organizationId)
    
    try {
      const { error } = await this.supabaseClient
        .from('vibe_cards')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)

      if (error) {
        console.error('🚨 [VIBE-SERVICE] Error updating vibe card:', error)
        return false
      }

      console.log('✅ [VIBE-SERVICE] Vibe card updated successfully')
      return true

    } catch (error) {
      console.error('🚨 [VIBE-SERVICE] Error updating vibe card:', error)
      return false
    }
  }
}
