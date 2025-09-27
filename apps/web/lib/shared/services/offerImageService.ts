import { supabase } from '@/lib/shared/supabase/client'

export class OfferImageService {
  private supabaseClient: any

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient || supabase
  }

  /**
   * Download DALL-E generated image and store permanently in Supabase Storage
   */
  async storeOfferImageFromUrl(
    dalleImageUrl: string, 
    organizationId: string, 
    offerId: string
  ): Promise<string | null> {
    try {
      // Download the image from DALL-E URL (temporary)
      const response = await fetch(dalleImageUrl)
      
      if (!response.ok) {
        throw new Error(`Failed to download DALL-E image: ${response.status} ${response.statusText}`)
      }

      const imageBlob = await response.blob()

      // Generate storage path: {organizationId}/{offerId}-{timestamp}.png
      const filename = this.generateOfferImageFilename(offerId)
      const storagePath = `${organizationId}/${filename}`

      // Upload to Supabase Storage (offer-banners bucket)
      const { data, error } = await this.supabaseClient.storage
        .from('offer-banners')
        .upload(storagePath, imageBlob, {
          contentType: imageBlob.type || 'image/png',
          upsert: true // Replace if exists
        })

      if (error) {
        throw error
      }

      // Get the public URL
      const { data: publicUrlData } = this.supabaseClient.storage
        .from('offer-banners')
        .getPublicUrl(storagePath)

      return publicUrlData.publicUrl

    } catch (error) {
      console.error('Error storing offer banner image:', error)
      return null
    }
  }

  /**
   * Generate a unique filename for offer banner images
   */
  generateOfferImageFilename(offerId: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `offer-banner-${offerId}-${timestamp}-${random}.png`
  }

  /**
   * Delete an offer banner image from Supabase Storage
   * Also handles cleanup of old images when regenerating
   */
  async deleteOfferImage(storagePath: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseClient.storage
        .from('offer-banners')
        .remove([storagePath])

      if (error) {
        console.error('Error deleting offer banner image:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting offer banner image:', error)
      return false
    }
  }

  /**
   * Extract storage path from Supabase public URL for offer banners
   */
  extractOfferStoragePath(publicUrl: string): string | null {
    try {
      // Extract path from URL like: https://xxx.supabase.co/storage/v1/object/public/offer-banners/org-id/filename.png
      const match = publicUrl.match(/\/offer-banners\/(.+)$/)
      return match ? match[1] : null
    } catch (error) {
      console.error('Error extracting offer storage path:', error)
      return null
    }
  }

  /**
   * Clean up old offer banner when regenerating
   */
  async cleanupOldOfferImage(oldImageUrl: string): Promise<void> {
    if (!oldImageUrl) return

    const storagePath = this.extractOfferStoragePath(oldImageUrl)
    if (storagePath) {
      await this.deleteOfferImage(storagePath)
    }
  }
}
