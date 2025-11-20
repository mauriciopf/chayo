import { useState, useEffect, useCallback } from 'react'

export interface Property {
  id: string
  name: string
  description?: string
  image_url?: string
  price?: number
  payment_link_url?: string
  payment_provider_id?: string
  supports_reservations?: boolean
  has_active_offer?: boolean
  shareable_link?: string
  created_at: string
  updated_at: string
  // New fields
  address?: string
  bedrooms?: number
  bathrooms?: number
  property_type?: string
  meta_product_id?: string
  synced_to_meta_at?: string
}

export function useProperties(organizationId?: string) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProperties = useCallback(async () => {
    if (!organizationId) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/products?organizationId=${organizationId}&limit=100`)
      
      if (response.ok) {
        const data = await response.json()
        // Fetch shareable links
        const propertiesWithLinks = await Promise.all(
          (data.products || []).map(async (property: Property) => {
            // Optimisation: Only fetch link if not already present or if needed
            // For now, keeping consistent with PropertiesManager logic
            try {
              const linkResponse = await fetch(`/api/shareable-links?contentType=product&contentId=${property.id}`)
              if (linkResponse.ok) {
                const linkData = await linkResponse.json()
                return { ...property, shareable_link: linkData.link?.full_url }
              }
            } catch (e) {
              console.warn('Failed to fetch link for property', property.id)
            }
            return property
          })
        )
        setProperties(propertiesWithLinks)
      } else {
        setError('Failed to load properties')
      }
    } catch (err) {
      console.error('Error loading properties:', err)
      setError('Error loading properties')
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    loadProperties()
  }, [loadProperties])

  return {
    properties,
    loading,
    error,
    refreshProperties: loadProperties
  }
}

