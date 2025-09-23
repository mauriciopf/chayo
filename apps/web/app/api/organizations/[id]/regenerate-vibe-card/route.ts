import { NextRequest, NextResponse } from 'next/server'
import { VibeCardService } from '@/lib/features/onboarding/services/vibeCardService'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: organizationId } = params

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    console.log('🔄 Regenerating vibe card for organization:', organizationId)

    const vibeCardService = new VibeCardService()
    
    // Regenerate the entire vibe card (content + image)
    const regeneratedVibeCard = await vibeCardService.regenerateVibeCard(organizationId)
    
    if (!regeneratedVibeCard) {
      return NextResponse.json(
        { error: 'Failed to regenerate vibe card' },
        { status: 500 }
      )
    }

    // Also regenerate the image with the new vibe data
    try {
      const newImageUrl = await vibeCardService.regenerateVibeCardImage(organizationId)
      if (newImageUrl) {
        regeneratedVibeCard.ai_generated_image_url = newImageUrl
      }
    } catch (imageError) {
      console.warn('⚠️ Failed to regenerate image, continuing without new image:', imageError)
      // Continue without failing - image generation is optional
    }

    console.log('✅ Vibe card regenerated successfully')
    
    return NextResponse.json(regeneratedVibeCard)

  } catch (error) {
    console.error('❌ Error regenerating vibe card:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to regenerate vibe card',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
