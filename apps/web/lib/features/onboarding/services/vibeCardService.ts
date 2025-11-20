import { supabase } from '@/lib/shared/supabase/client'
import { VibeCardData, VIBE_CARD_FIELDS, VIBE_AESTHETICS, RealEstateService } from '@/lib/shared/types/vibeCardTypes'
import { openAIService } from '@/lib/shared/services/OpenAIService'
import { SSEEmitter } from '@/lib/shared/types/sseEvents'
import { SSEService } from '@/lib/shared/services/SSEService'

export class VibeCardService {
  private supabaseClient: any

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient || supabase
  }

  /**
   * Generate vibe card with AI directly (no HTTP calls)
   * Updated for Real Estate Agent flow
   */
  private async generateVibeCardWithAI(agentInfo: {
    agent_name: string
    coverage_location: string
    services: string[]
    online_presence: string
    unique_value: string
  }): Promise<any> {
    console.log('🤖 [VIBE-SERVICE] Generating real estate vibe card for:', agentInfo.agent_name)

    // AI Generation Schema - Updated for Real Estate
    const VibeCreationSchema = {
      type: "json_schema",
      json_schema: {
        name: "vibe_creation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            agent_name: { type: "string", description: "Professional agent or brokerage name" },
            coverage_location: { type: "string", description: "Primary areas served" },
            services: { type: "array", items: { type: "string" }, description: "Real estate services offered" },
            unique_value: { type: "string", description: "Enhanced unique value proposition" },
            
            // Vibe elements
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
            
            // Generated marketing copy
            why_different: { type: "string", description: "Compelling 'Why Choose Us' text" },
            perfect_for: { type: "array", items: { type: "string" }, description: "Ideal client types (e.g. First-time buyers, Investors)" },
            customer_love: { type: "string", description: "A short, simulated testimonial or reputation statement" }
          },
          required: ["agent_name", "coverage_location", "services", "unique_value", "vibe_colors", "vibe_aesthetic", "why_different", "perfect_for", "customer_love"],
          additionalProperties: false
        }
      }
    } as const

    const systemPrompt = `You are an expert real estate brand strategist creating compelling profiles for AI real estate agents. 

Based on the provided agent information, create a COMPLETE agent profile by:

1. **Professional Identity**: Polish the agent name and location for professional appeal
2. **Visual Identity**: Choose a color palette that builds trust and authority (Real Estate colors like Navy, Gold, Charcoal, Slate, Forest Green)
3. **Value Proposition**: Polish their unique value into a magnetic statement
4. **Client Targeting**: Identify ideal client types based on their services and location
5. **Brand Voice**: Choose an aesthetic that matches their market position (Luxury, Friendly, Commercial, etc.)

IMPORTANT: Create a professional, trustworthy profile that positions this AI agent as a capable 24/7 assistant.`

    const userPrompt = `Create a compelling profile for this real estate agent:

Agent Name: ${agentInfo.agent_name}
Location: ${agentInfo.coverage_location}
Services: ${agentInfo.services.join(', ')}
Online Presence: ${agentInfo.online_presence}
Unique Value: ${agentInfo.unique_value}

Generate a complete brand profile that communicates trust, expertise, and 24/7 availability.`

    const vibeData = await openAIService.callStructuredCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      VibeCreationSchema,
      {
        temperature: 0.7 // Slightly lower temp for professional consistency
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

      // Prepare agent info for AI generation using new fields
      // Fallback to legacy fields if new ones are missing (for backward compatibility)
      const agentInfo = {
        agent_name: fieldsData[VIBE_CARD_FIELDS.AGENT_NAME] || fieldsData['business_name'] || 'Real Estate Agent',
        coverage_location: fieldsData[VIBE_CARD_FIELDS.COVERAGE_LOCATION] || 'Local Area',
        services: parseFieldValue(fieldsData[VIBE_CARD_FIELDS.SERVICES] || fieldsData['value_badges']),
        online_presence: fieldsData[VIBE_CARD_FIELDS.ONLINE_PRESENCE] || fieldsData['website'] || '',
        unique_value: fieldsData[VIBE_CARD_FIELDS.UNIQUE_VALUE] || fieldsData['origin_story'] || ''
      }

      console.log('🤖 [VIBE-SERVICE] Generating vibe card with AI...')
      
      // Generate vibe card directly with AI
      const aiVibeData = await this.generateVibeCardWithAI(agentInfo)
      console.log('✅ [VIBE-SERVICE] AI vibe creator response:', aiVibeData)

      // Construct final vibe card data
      const vibeCardData: VibeCardData = {
        // Core Agent Info
        agent_name: agentInfo.agent_name,
        coverage_location: agentInfo.coverage_location,
        services: agentInfo.services,
        online_presence: agentInfo.online_presence,
        unique_value: agentInfo.unique_value,

        // Map to legacy fields for compatibility
        business_name: agentInfo.agent_name,
        business_type: 'Real Estate', // Fixed type for this pivot
        origin_story: agentInfo.unique_value,
        value_badges: aiVibeData.services || agentInfo.services,
        
        // AI-generated fields
        vibe_colors: aiVibeData.vibe_colors || {
          primary: '#1E3A8A', // Navy Blue default
          secondary: '#F59E0B', // Gold default
          accent: '#F3F4F6' // Slate default
        },
        vibe_aesthetic: aiVibeData.vibe_aesthetic || 'Professional-modern',
        personality_traits: [], // Deprecated
        
        // Generated content
        why_different: aiVibeData.why_different || '',
        perfect_for: aiVibeData.perfect_for || [],
        customer_love: aiVibeData.customer_love || '',
        
        // Optional contact info
        location: agentInfo.coverage_location,
        website: agentInfo.online_presence,
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
    emit?: SSEEmitter
  ): Promise<boolean> {
    try {
      console.log('🎨 [VIBE-CARD] Starting vibe card generation for:', organizationId)
      
      if (!emit) {
        console.warn('⚠️ [VIBE-CARD] No emitter provided - progress updates will not be sent')
      }
      
      // Show the vibe card generation modal
      if (emit) {
        SSEService.showVibeCardModal(emit)
      }
      
      // Phase 1: Analyzing business information
      if (emit) {
        SSEService.updateVibeCardProgress(emit, 'analyzing_business', 20, 'Analyzing your agent profile...')
      }
      
      const vibeCardData = await this.generateVibeCardFromBusinessInfo(organizationId)
      
      if (!vibeCardData) {
        console.error('❌ [VIBE-CARD] Failed to generate vibe card data')
        return false
      }

      // Phase 2: Crafting brand story
      if (emit) {
        SSEService.updateVibeCardProgress(emit, 'crafting_story', 40, 'Crafting your professional brand...')
      }

      // Phase 3: Selecting colors
      if (emit) {
        SSEService.updateVibeCardProgress(emit, 'selecting_colors', 60, 'Choosing trustworthy colors...')
      }

      // Phase 4: Generating AI image
      let aiGeneratedImageUrl: string | null = null
      try {
        if (emit) {
          SSEService.updateVibeCardProgress(emit, 'generating_image', 75, 'Creating your AI agent avatar...')
        }
        
        console.log('🎨 [VIBE-CARD] Generating AI image for vibe card...')
        aiGeneratedImageUrl = await this.generateVibeCardImage({
          business_name: vibeCardData.agent_name, // Use agent name
          business_type: 'Real Estate Agent', // Fixed type for image gen
          origin_story: vibeCardData.unique_value || '',
          vibe_aesthetic: vibeCardData.vibe_aesthetic,
          vibe_colors: vibeCardData.vibe_colors,
          organization_id: organizationId
        })
        console.log('✅ AI image generated successfully:', aiGeneratedImageUrl)
      } catch (imageError) {
        console.warn('⚠️ Failed to generate AI image, continuing without image:', imageError)
      }

      // Phase 5: Finalizing
      if (emit) {
        SSEService.updateVibeCardProgress(emit, 'finalizing', 95, 'Finalizing your AI agent...')
      }

      // Store vibe card in streamlined table (only essential columns)
      const { error: vibeCardError } = await this.supabaseClient
        .from('vibe_cards')
        .upsert({
          organization_id: organizationId,
          business_name: vibeCardData.agent_name, // Map agent_name to business_name column
          business_type: 'Real Estate Agent',     // Map to business_type column
          origin_story: vibeCardData.unique_value || '', // Map to origin_story
          value_badges: vibeCardData.services || [], // Map services to value_badges
          perfect_for: vibeCardData.perfect_for || [],
          vibe_colors: vibeCardData.vibe_colors,
          vibe_aesthetic: vibeCardData.vibe_aesthetic,
          ai_generated_image_url: aiGeneratedImageUrl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'organization_id'
        })

      if (vibeCardError) {
        console.error('Error storing vibe card:', vibeCardError)
        return false
      }

      // Update setup_completion to mark as completed
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

      // Update organization name if agent_name was collected
      if (vibeCardData.agent_name && vibeCardData.agent_name !== 'Real Estate Agent') {
        try {
          let slugifiedName = vibeCardData.agent_name
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '')
          
          const { error: orgUpdateError } = await this.supabaseClient
            .from('organizations')
            .update({
              name: vibeCardData.agent_name,
              slug: slugifiedName,
              updated_at: new Date().toISOString()
            })
            .eq('id', organizationId)

          if (orgUpdateError) {
            console.warn('⚠️ Failed to update organization name:', orgUpdateError)
          } else {
            console.log('✅ Updated organization name to:', vibeCardData.agent_name)
          }
        } catch (orgError) {
          console.warn('⚠️ Error updating organization name:', orgError)
        }
      }

      // Phase 6: Completed
      if (emit) {
        SSEService.updateVibeCardProgress(emit, 'completed', 100, 'Your AI agent is ready!')
      }
      
      console.log('✅ [VIBE-CARD] Onboarding completed with vibe card for:', organizationId)
      return true

    } catch (error) {
      console.error('❌ [VIBE-CARD] Error completing onboarding with vibe card:', error)
      
      if (emit) {
        SSEService.emitErrorEvent(emit, {
          message: 'Failed to complete AI agent generation',
          severity: 'error',
          recoverable: true,
          retryable: true
        })
      }
      
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

      // Convert database format to VibeCardData interface with Real Estate mapping
      return {
        // Map DB fields to Real Estate fields
        agent_name: data.business_name,
        coverage_location: data.location || 'Local', // Fallback if location not stored in dedicated col
        services: data.value_badges || [],
        online_presence: data.website || '',
        unique_value: data.origin_story || '',

        // Keep legacy for compatibility
        business_name: data.business_name,
        business_type: data.business_type,
        origin_story: data.origin_story,
        value_badges: data.value_badges || [],
        
        vibe_colors: data.vibe_colors || {
          primary: '#1E3A8A',
          secondary: '#F59E0B',
          accent: '#F3F4F6'
        },
        vibe_aesthetic: data.vibe_aesthetic || 'Professional-modern',
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
          agent_name: item.business_name,
          coverage_location: '', // Not in view usually
          services: parseJsonArray(item.value_badges),
          online_presence: '',
          unique_value: item.origin_story,
          
          // Legacy
          business_name: item.business_name || '',
          business_type: item.business_type || '',
          origin_story: item.origin_story || '',
          value_badges: parseJsonArray(item.value_badges),
          
          vibe_colors: item.vibe_colors || {
            primary: '#1E3A8A',
            secondary: '#F59E0B',
            accent: '#F3F4F6'
          },
          vibe_aesthetic: item.vibe_aesthetic || 'Professional-modern',
          why_different: '', 
          perfect_for: parseJsonArray(item.perfect_for),
          customer_love: '', 
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

      // Update existing vibe card
      const { error } = await this.supabaseClient
        .from('vibe_cards')
        .update({
          business_name: vibeCardData.agent_name, // Map agent_name -> business_name
          business_type: 'Real Estate Agent',
          origin_story: vibeCardData.unique_value || '',
          value_badges: vibeCardData.services || [],
          perfect_for: vibeCardData.perfect_for || [],
          vibe_colors: vibeCardData.vibe_colors,
          vibe_aesthetic: vibeCardData.vibe_aesthetic,
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
      // Map Real Estate fields to DB columns
      const dbUpdates: any = {
        updated_at: new Date().toISOString()
      }
      
      if (updates.agent_name) dbUpdates.business_name = updates.agent_name
      if (updates.unique_value) dbUpdates.origin_story = updates.unique_value
      if (updates.services) dbUpdates.value_badges = updates.services
      if (updates.vibe_colors) dbUpdates.vibe_colors = updates.vibe_colors
      if (updates.vibe_aesthetic) dbUpdates.vibe_aesthetic = updates.vibe_aesthetic
      if (updates.ai_generated_image_url) dbUpdates.ai_generated_image_url = updates.ai_generated_image_url

      const { error } = await this.supabaseClient
        .from('vibe_cards')
        .update(dbUpdates)
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
        business_name: vibeCard.agent_name, // Use agent name
        business_type: 'Real Estate Agent',
        origin_story: vibeCard.unique_value || '',
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
