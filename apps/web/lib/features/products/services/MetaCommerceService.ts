/**
 * MetaCommerceService
 * 
 * Service for syncing products to Meta Commerce catalog
 * when WhatsApp Business Account is connected
 */

export interface MetaProduct {
  id: string
  name: string
  description: string
  price: string | number
  image_url?: string
  organization_id: string
  organizations?: {
    name: string
  }
}

export interface MetaCatalog {
  id: string
  name: string
}

export class MetaCommerceService {
  
  /**
   * Sync products FROM Meta Commerce catalog TO Chayo
   * Imports any products that exist in Meta but not in Chayo
   */
  static async syncFromMeta(organizationId: string): Promise<{
    success: boolean
    totalMetaProducts: number
    imported: number
    error?: string
  }> {
    try {
      const response = await fetch(`/api/whatsapp/products?organizationId=${organizationId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to sync from Meta')
      }

      const data = await response.json()
      return {
        success: true,
        totalMetaProducts: data.totalMetaProducts,
        imported: data.imported
      }
    } catch (error) {
      console.error('❌ Failed to sync from Meta:', error)
      return {
        success: false,
        totalMetaProducts: 0,
        imported: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Get all catalogs for an organization's business
   */
  static async getCatalogs(organizationId: string): Promise<{
    catalogs: MetaCatalog[]
    currentCatalogId: string | null
  }> {
    try {
      const response = await fetch(`/api/whatsapp/catalogs?organizationId=${organizationId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get catalogs')
      }

      const data = await response.json()
      return {
        catalogs: data.catalogs || [],
        currentCatalogId: data.currentCatalogId || null
      }
    } catch (error) {
      console.error('❌ Failed to get catalogs:', error)
      return {
        catalogs: [],
        currentCatalogId: null
      }
    }
  }

  /**
   * Create a new catalog for the business
   */
  static async createCatalog(
    organizationId: string,
    catalogName?: string
  ): Promise<{
    success: boolean
    catalogId?: string
    error?: string
  }> {
    try {
      const response = await fetch('/api/whatsapp/catalogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          catalogName: catalogName || 'Chayo Products'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create catalog')
      }

      const data = await response.json()
      return {
        success: true,
        catalogId: data.catalogId
      }
    } catch (error) {
      console.error('❌ Failed to create catalog:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Sync a single product to Meta Commerce
   * Called after product creation/update in Chayo database
   * 
   * This method will:
   * 1. Check if WABA is connected
   * 2. Auto-create or use first catalog if none exists
   * 3. Sync product to Meta Commerce
   */
  static async syncProduct(productId: string): Promise<{
    success: boolean
    synced: boolean
    message: string
    metaHandle?: string
    error?: string
  }> {
    try {
      const response = await fetch(`/api/products/${productId}/sync-to-meta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to sync product')
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Failed to sync product to Meta:', error)
      return {
        success: false,
        synced: false,
        message: 'Failed to sync to Meta Commerce',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check if organization has Meta Commerce enabled
   * (i.e., WABA connected with catalog_id)
   */
  static async isMetaCommerceEnabled(organizationId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/whatsapp/status?organizationId=${organizationId}`)
      const data = await response.json()
      
      return data.connected && data.catalogId !== null
    } catch (error) {
      console.error('❌ Failed to check Meta Commerce status:', error)
      return false
    }
  }

  /**
   * Format product price for Meta Commerce API
   * Format: "9.99 USD" (number, space, ISO 4217 currency code)
   * Always defaults to USD
   */
  static formatPrice(price: string | number): string {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price
    const formattedPrice = numericPrice.toFixed(2)
    return `${formattedPrice} USD`
  }

  /**
   * Validate required fields for Meta Commerce
   * Returns true if all required fields are present
   * 
   * Only validates fields we actually collect from users:
   * - name (required)
   * - description (optional, but recommended)
   * - price (optional, defaults to 0)
   * - image_url (optional)
   */
  static validateProduct(product: Partial<MetaProduct>): {
    valid: boolean
    missingFields: string[]
  } {
    const requiredFields = ['name'] // Only name is truly required
    const recommendedFields = ['description', 'price', 'image_url']

    const missingRequired = requiredFields.filter(field => 
      !product[field as keyof MetaProduct]
    )

    const missingRecommended = recommendedFields.filter(field =>
      !product[field as keyof MetaProduct]
    )

    return {
      valid: missingRequired.length === 0,
      missingFields: [...missingRequired, ...missingRecommended]
    }
  }
}

