import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { VibeCardImageService } from '@/lib/shared/services/vibeCardImageService'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface VibeImageRequest {
  business_name: string
  business_type: string
  origin_story: string
  vibe_aesthetic?: string
  vibe_colors?: {
    primary: string
    secondary: string
    accent: string
  }
  organization_id?: string // Optional for storage
}

export async function POST(request: NextRequest) {
  try {
    const body: VibeImageRequest = await request.json()
    const { business_name, business_type, origin_story, vibe_aesthetic, vibe_colors, organization_id } = body

    if (!business_name || !business_type) {
      return NextResponse.json(
        { error: 'Business name and type are required' },
        { status: 400 }
      )
    }

    // Create a detailed prompt for DALL-E based on business info
    const imagePrompt = createVibeImagePrompt({
      business_name,
      business_type,
      origin_story,
      vibe_aesthetic,
      vibe_colors
    })

    console.log('🎨 Generating vibe image with prompt:', imagePrompt)

    // Generate image using DALL-E 3 - optimized for mobile vibe card layout
    const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1792x1024', // Wide rectangle format
        quality: 'standard'
      })
  

    const temporaryImageUrl = response.data?.[0]?.url

    if (!temporaryImageUrl) {
      throw new Error('No image URL returned from OpenAI')
    }

    console.log('✅ Vibe image generated successfully:', temporaryImageUrl)

    // If organization_id is provided, store the image in Supabase Storage
    let finalImageUrl = temporaryImageUrl
    if (organization_id) {
      console.log('🔄 [VIBE-IMAGE-API] Starting Supabase Storage process for organization:', organization_id)
      try {
        const vibeImageService = new VibeCardImageService()
        const filename = vibeImageService.generateVibeImageFilename(organization_id)
        console.log('📝 [VIBE-IMAGE-API] Generated filename:', filename)
        
        console.log('☁️ [VIBE-IMAGE-API] Calling storeVibeCardImageFromUrl...')
        const storedImageUrl = await vibeImageService.storeVibeCardImageFromUrl(
          temporaryImageUrl,
          organization_id,
          filename
        )

        if (storedImageUrl) {
          finalImageUrl = storedImageUrl
          console.log('✅ [VIBE-IMAGE-API] Image stored in Supabase Storage successfully:', storedImageUrl)
          console.log('🔄 [VIBE-IMAGE-API] Final URL changed from temporary to permanent')
        } else {
          console.warn('⚠️ [VIBE-IMAGE-API] storeVibeCardImageFromUrl returned null, using temporary URL')
        }
      } catch (storageError) {
        console.error('❌ [VIBE-IMAGE-API] Storage error, using temporary URL:', storageError)
        // Continue with temporary URL if storage fails
      }
    } else {
      console.log('⚠️ [VIBE-IMAGE-API] No organization_id provided, skipping Supabase Storage')
    }

    return NextResponse.json({
      success: true,
      image_url: finalImageUrl,
      prompt_used: imagePrompt,
      stored_in_supabase: finalImageUrl !== temporaryImageUrl
    })

  } catch (error) {
    console.error('❌ Error generating vibe image:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate vibe image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Create a detailed DALL-E prompt based on business information
 */
function createVibeImagePrompt({
  business_name,
  business_type,
  origin_story,
  vibe_aesthetic = 'Modern',
  vibe_colors
}: VibeImageRequest): string {
  // Build aesthetic description
  const aestheticDescription = getAestheticDescription(vibe_aesthetic)
  
  // Build color palette description
  const colorDescription = vibe_colors 
    ? `with a color palette of ${vibe_colors.primary}, ${vibe_colors.secondary}, and ${vibe_colors.accent}`
    : 'with warm, inviting colors'

  // Create comprehensive prompt optimized for wide rectangle format
  const prompt = `A professional, inviting wide-angle image representing a ${business_type} business called "${business_name}". 
${aestheticDescription} aesthetic ${colorDescription}. 
${origin_story ? `The business story: "${origin_story}". ` : ''}
Create a horizontal composition that captures the essence and atmosphere of this business. 
Style: Clean, modern, welcoming, suitable for a mobile business card header. 
Wide-angle view with good depth and visual interest across the frame.
No text or logos in the image. 
Focus on atmosphere, mood, and visual elements that represent the business's personality and values.
High quality, professional photography style with cinematic composition.`

  return prompt.replace(/\s+/g, ' ').trim()
}


/**
 * Get visual description for different aesthetics (matching our VIBE_AESTHETICS)
 */
function getAestheticDescription(aesthetic: string): string {
  const descriptions: Record<string, string> = {
    'Boho-chic': 'Bohemian-inspired with natural textures, plants, and organic shapes',
    'Modern-minimalist': 'Clean, minimal, with geometric shapes and plenty of white space',
    'Rustic-charm': 'Warm, rustic with natural wood textures and cozy elements',
    'Urban-industrial': 'Industrial elements with exposed brick, metal, and concrete textures',
    'Vintage-classic': 'Timeless, classic with vintage elements and nostalgic charm',
    'Earthy-natural': 'Natural, organic with earth tones and sustainable materials',
    'Luxury-elegant': 'Sophisticated, elegant with premium materials and refined details',
    'Creative-artsy': 'Artistic, creative with vibrant colors and unique compositions',
    'Warm-cozy': 'Cozy, inviting with soft textures and warm lighting',
    'Fresh-clean': 'Clean, fresh with bright lighting and crisp, modern elements'
  }
  
  return descriptions[aesthetic] || 'Modern and professional'
}
