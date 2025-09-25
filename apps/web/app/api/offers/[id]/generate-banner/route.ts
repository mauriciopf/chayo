import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

// POST /api/offers/[id]/generate-banner - Generate AI banner for offer
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get offer details
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select(`
        *,
        product_offers!inner(
          products_list_tool(name, description)
        )
      `)
      .eq('id', params.id)
      .single()

    if (offerError || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    // Extract product information
    const products = offer.product_offers?.map((po: any) => po.products_list_tool) || []
    const productNames = products.map((p: any) => p.name).join(', ')
    const productDescriptions = products.map((p: any) => p.description).filter(Boolean).join('. ')

    // Create comprehensive AI prompt for banner generation
    const discountText = offer.offer_type === 'percentage' 
      ? `${offer.offer_value}% OFF`
      : `$${offer.offer_value} OFF`

    const prompt = `Create a stunning, professional promotional banner image for an e-commerce offer.

OFFER DETAILS:
- Offer Name: "${offer.name}"
- Description: "${offer.description}"
- Discount: ${discountText}
- Products: ${productNames}
${productDescriptions ? `- Product Details: ${productDescriptions}` : ''}

DESIGN REQUIREMENTS:
- Modern, eye-catching design with vibrant colors
- Professional marketing banner style
- Clear, readable typography
- Include the discount prominently (${discountText})
- Include the offer name: "${offer.name}"
- Use gradients, modern UI elements
- Suitable for web and mobile display
- High contrast for readability
- Professional e-commerce aesthetic
- Size: 1200x400 pixels (banner format)

STYLE: Modern, clean, professional marketing banner with vibrant gradients, clear typography, and eye-catching design elements that would work well for an online store promotion.`

    console.log('Generating AI banner with prompt:', prompt)

    // Generate image using DALL-E 3
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1792x1024", // High quality banner size
      quality: "hd",
      style: "vivid"
    })

    const imageUrl = imageResponse.data[0]?.url

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI')
    }

    // Download and store the image (in a real app, you'd upload to your storage)
    // For now, we'll store the OpenAI URL directly
    const { data: updatedOffer, error: updateError } = await supabase
      .from('offers')
      .update({
        ai_banner_url: imageUrl,
        ai_banner_prompt: prompt,
        banner_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating offer with banner:', updateError)
      return NextResponse.json({ error: 'Failed to save banner' }, { status: 500 })
    }

    return NextResponse.json({
      banner_url: imageUrl,
      banner_prompt: prompt,
      offer: updatedOffer
    })

  } catch (error) {
    console.error('Error generating AI banner:', error)
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('billing')) {
        return NextResponse.json({ 
          error: 'AI banner generation is temporarily unavailable. Please try again later.' 
        }, { status: 503 })
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json({ 
          error: 'Too many requests. Please wait a moment and try again.' 
        }, { status: 429 })
      }
    }

    return NextResponse.json({ 
      error: 'Failed to generate AI banner. Please try again.' 
    }, { status: 500 })
  }
}

// POST /api/offers/[id]/regenerate-banner - Regenerate banner (alias for generate-banner)
export { POST as regenerateBanner }
