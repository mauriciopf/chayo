import { supabase } from '@/lib/shared/supabase/client'

export class VibeCardImageService {
  private supabaseClient: any

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient || supabase
  }

  /**
   * Download DALL-E generated image and store permanently in Supabase Storage
   */
  async storeVibeCardImageFromUrl(
    dalleImageUrl: string, 
    organizationId: string, 
    filename: string
  ): Promise<string | null> {
    try {
      // Download the image from DALL-E URL (temporary)
      const response = await fetch(dalleImageUrl)
      
      if (!response.ok) {
        throw new Error(`Failed to download DALL-E image: ${response.status} ${response.statusText}`)
      }

      const imageBlob = await response.blob()

      // Generate storage path: {organizationId}/{filename}
      const storagePath = `${organizationId}/${filename}`

      // Upload to Supabase Storage (vibecard-images bucket)
      const { data, error } = await this.supabaseClient.storage
        .from('vibecard-images')
        .upload(storagePath, imageBlob, {
          contentType: imageBlob.type || 'image/png',
          upsert: true // Replace if exists
        })

      if (error) {
        throw error
      }

      // Get the public URL
      const { data: publicUrlData } = this.supabaseClient.storage
        .from('vibecard-images')
        .getPublicUrl(storagePath)

      return publicUrlData.publicUrl

    } catch (error) {
      console.error('Error storing vibe card image:', error)
      return null
    }
  }

  /**
   * Generate a unique filename for vibe card images
   */
  generateVibeImageFilename(organizationId: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `vibe-card-${organizationId}-${timestamp}-${random}.png`
  }

  /**
   * Delete a vibe card image from Supabase Storage
   * Also handles cleanup of old images when regenerating
   */
  async deleteVibeCardImage(storagePath: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseClient.storage
        .from('vibecard-images')
        .remove([storagePath])

      if (error) {
        console.error('Error deleting vibe card image:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting vibe card image:', error)
      return false
    }
  }

  /**
   * Extract storage path from Supabase public URL for vibe card images
   */
  extractVibeCardStoragePath(publicUrl: string): string | null {
    try {
      // Extract path from URL like: https://xxx.supabase.co/storage/v1/object/public/vibecard-images/org-id/filename.png
      const match = publicUrl.match(/\/vibecard-images\/(.+)$/)
      return match ? match[1] : null
    } catch (error) {
      console.error('Error extracting vibe card storage path:', error)
      return null
    }
  }

}