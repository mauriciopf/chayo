import { supabase } from '@/lib/shared/supabase/client'
import { VibeCardData, VIBE_CARD_FIELDS, VIBE_AESTHETICS } from '@/lib/shared/types/vibeCardTypes'
import { openAIService } from '@/lib/shared/services/OpenAIService'

export class VibeCardService {
  private supabaseClient: any

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient || supabase
  }

  /**
   * Generate vibe card with AI directly (no HTTP calls)
   */
  private async generateVibeCardWithAI(businessInfo: {
    business_name: string
    business_type: string
    origin_story?: string
    value_badges?: string[]
    perfect_for?: string[]
  }): Promise<any> {
    console.log('🤖 [VIBE-SERVICE] Generating vibe card for:', businessInfo.business_name)

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

Business Name: ${businessInfo.business_name}
Business Type: ${businessInfo.business_type}
${businessInfo.origin_story ? `Origin Story: ${businessInfo.origin_story}` : ''}
${businessInfo.value_badges?.length ? `Value Badges: ${businessInfo.value_badges.join(', ')}` : ''}
${businessInfo.perfect_for?.length ? `Perfect For: ${businessInfo.perfect_for.join(', ')}` : ''}

Generate a complete vibe profile that will make this business irresistible to their ideal customers.`

    const vibeData = await openAIService.callStructuredCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      VibeCreationSchema,
      {
        temperature: 0.8
      }
    )
    console.log('✅ [VIBE-SERVICE] Successfully generated vibe card')

    return vibeData
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
      
      // Helper function to convert string to array if needed
      const parseFieldValue = (value: any): string[] => {
        if (!value) return []
        if (Array.isArray(value)) return value
        if (typeof value === 'string') {
          // Split by comma and clean up
          return value.split(',').map(item => item.trim()).filter(item => item.length > 0)
        }
        return []
      }

      // Prepare business info for AI generation
      const businessInfo = {
        business_name: fieldsData[VIBE_CARD_FIELDS.BUSINESS_NAME] || 'Business',
        business_type: fieldsData[VIBE_CARD_FIELDS.BUSINESS_TYPE] || 'Business',
        origin_story: fieldsData[VIBE_CARD_FIELDS.ORIGIN_STORY] || '',
        value_badges: parseFieldValue(fieldsData[VIBE_CARD_FIELDS.VALUE_BADGES]),
        perfect_for: parseFieldValue(fieldsData[VIBE_CARD_FIELDS.PERFECT_FOR])
      }

      console.log('🤖 [VIBE-SERVICE] Generating vibe card with AI...')
      
      // Generate vibe card directly with AI (no HTTP calls)
      const aiVibeData = await this.generateVibeCardWithAI(businessInfo)
      console.log('✅ [VIBE-SERVICE] AI vibe creator response:', aiVibeData)

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
   * Complete onboarding by generating and storing vibe card data with AI image
   */
  async completeOnboardingWithVibeCard(
    organizationId: string, 
    progressEmitter?: (event: string, data?: any) => void
  ): Promise<boolean> {
    try {
      // Emit phase: Analyzing business information
      progressEmitter?.('phase', { name: 'analyzingBusiness' })
      
      // Generate vibe card data
      const vibeCardData = await this.generateVibeCardFromBusinessInfo(organizationId)
      
      if (!vibeCardData) {
        console.error('Failed to generate vibe card data')
        return false
      }

      // Emit phase: Crafting brand story
      progressEmitter?.('phase', { name: 'craftingStory' })

      // Generate AI image for the vibe card
      let aiGeneratedImageUrl: string | null = null
      try {
        // Emit phase: Generating visual identity
        progressEmitter?.('phase', { name: 'generatingVisuals' })
        
        console.log('🎨 Generating AI image for vibe card...')
        aiGeneratedImageUrl = await this.generateVibeCardImage({
          business_name: vibeCardData.business_name,
          business_type: vibeCardData.business_type,
          origin_story: vibeCardData.origin_story || '',
          vibe_aesthetic: vibeCardData.vibe_aesthetic,
          vibe_colors: vibeCardData.vibe_colors,
          organization_id: organizationId
        })
        console.log('✅ AI image generated successfully:', aiGeneratedImageUrl)
      } catch (imageError) {
        console.warn('⚠️ Failed to generate AI image, continuing without image:', imageError)
        // Continue without image - don't fail the entire onboarding
      }

      // Emit phase: Finalizing vibe card
      progressEmitter?.('phase', { name: 'finalizingVibeCard' })

      // Store vibe card in streamlined table (only essential columns)
      const { error: vibeCardError } = await this.supabaseClient
        .from('vibe_cards')
        .upsert({
          organization_id: organizationId,
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
          ai_generated_image_url: aiGeneratedImageUrl,
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

      console.log('🔍 DEBUG: Raw view data:', {
        count: data?.length || 0,
        firstItem: data?.[0],
        sampleData: data?.slice(0, 2)
      })

      // Helper function to safely parse JSONB arrays
      const parseJsonArray = (value: any): string[] => {
        if (!value) return []
        if (Array.isArray(value)) return value
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value)
            return Array.isArray(parsed) ? parsed : []
          } catch {
            return []
          }
        }
        return []
      }

      return data?.map((item: any) => ({
        organization_id: item.organization_id,
        slug: item.slug,
        setup_status: 'completed',
        completed_at: item.created_at,
        vibe_data: {
          business_name: item.business_name || '',
          business_type: item.business_type || '',
          origin_story: item.origin_story || '',
          value_badges: parseJsonArray(item.value_badges),
          personality_traits: [], // Not stored in streamlined table
          vibe_colors: item.vibe_colors || {
            primary: '#8B7355',
            secondary: '#A8956F',
            accent: '#E6D7C3'
          },
          vibe_aesthetic: item.vibe_aesthetic || 'Boho-chic',
          why_different: '', // Not stored in streamlined table
          perfect_for: parseJsonArray(item.perfect_for),
          customer_love: '', // Not stored in streamlined table
          ai_generated_image_url: item.ai_generated_image_url,
          contact_info: {
            phone: '',
            email: ''
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

      // Update existing vibe card in streamlined database
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

  /**
   * Generate AI image for vibe card
   */
  private async generateVibeCardImage(params: {
    business_name: string
    business_type: string
    origin_story: string
    vibe_aesthetic?: string
    vibe_colors?: any
    organization_id?: string
  }): Promise<string | null> {
    try {
      // Use absolute URL for server-side fetch - force localhost for development
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? (process.env.NEXT_PUBLIC_SITE_URL || 'https://chayo.ai')
        : 'http://localhost:3000'
      const apiUrl = `${baseUrl}/api/ai/generate-vibe-image`
      
      console.log('🌐 [VIBE-IMAGE] Calling image generation API:', apiUrl)
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        throw new Error(`Image generation failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success || !data.image_url) {
        throw new Error('No image URL returned from AI service')
      }

      return data.image_url
    } catch (error) {
      console.error('Error generating vibe card image:', error)
      throw error
    }
  }

  /**
   * Regenerate AI image for existing vibe card (for VibeCardEditor)
   */
  async regenerateVibeCardImage(organizationId: string): Promise<string | null> {
    try {
      // Get current vibe card data
      const vibeCard = await this.getVibeCardData(organizationId)
      if (!vibeCard) {
        throw new Error('No vibe card found for organization')
      }

      // Generate new image
      const newImageUrl = await this.generateVibeCardImage({
        business_name: vibeCard.business_name,
        business_type: vibeCard.business_type,
        origin_story: vibeCard.origin_story || '',
        vibe_aesthetic: vibeCard.vibe_aesthetic,
        vibe_colors: vibeCard.vibe_colors,
        organization_id: organizationId
      })

      if (newImageUrl) {
        // Update vibe card with new image
        await this.updateVibeCard(organizationId, {
          ai_generated_image_url: newImageUrl
        })
      }

      return newImageUrl
    } catch (error) {
      console.error('Error regenerating vibe card image:', error)
      return null
    }
  }
}
