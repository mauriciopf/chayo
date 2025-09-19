import { supabase } from '@/lib/shared/supabase/client'
import { VibeCardData, VIBE_CARD_FIELDS } from '@/lib/shared/types/vibeCardTypes'

export class VibeCardService {
  private supabaseClient: any

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient || supabase
  }

  /**
   * Generate vibe card data from collected business info fields
   */
  async generateVibeCardFromBusinessInfo(organizationId: string): Promise<VibeCardData | null> {
    try {
      // Get all business info fields for this organization
      const { data: businessFields, error } = await this.supabaseClient
        .from('business_info_fields')
        .select('field_name, field_value')
        .eq('organization_id', organizationId)
        .eq('is_answered', true)

      if (error || !businessFields?.length) {
        console.error('Error fetching business info fields:', error)
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

      // Call AI Vibe Creator API to enhance the data
      const response = await fetch('/api/ai/vibe-creator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          business_info: {
            business_name: fieldsData[VIBE_CARD_FIELDS.BUSINESS_NAME] || 'Business',
            business_type: fieldsData[VIBE_CARD_FIELDS.BUSINESS_TYPE] || 'Business',
            origin_story: fieldsData[VIBE_CARD_FIELDS.ORIGIN_STORY] || '',
            values: fieldsData[VIBE_CARD_FIELDS.VALUE_BADGES] || [],
            target_customers: fieldsData[VIBE_CARD_FIELDS.PERFECT_FOR] || []
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate vibe card')
      }

      const aiVibeData = await response.json()

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
}
