'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Percent, 
  DollarSign, 
  Image,
  RefreshCw,
  Eye,
  EyeOff,
  Package
} from 'lucide-react'

interface Offer {
  id: string
  name: string
  description: string
  offer_type: 'percentage' | 'fixed_amount'
  offer_value: number
  start_date: string
  end_date: string
  status: 'active' | 'inactive' | 'expired'
  ai_banner_url?: string
  ai_banner_prompt?: string
  banner_generated_at?: string
  created_at: string
  updated_at: string
  product_count?: number
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  discounted_price?: number
  has_active_offer: boolean
}

interface OffersManagerProps {
  organizationId: string
}

const OffersManager: React.FC<OffersManagerProps> = ({ organizationId }) => {
  const t = useTranslations('offers')
  const [offers, setOffers] = useState<Offer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  const [generatingBanner, setGeneratingBanner] = useState<string | null>(null)

  // Fetch offers and products
  useEffect(() => {
    fetchOffers()
    fetchProducts()
  }, [organizationId])

  const fetchOffers = async () => {
    try {
      const response = await fetch(`/api/offers?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setOffers(data.offers || [])
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleCreateOffer = () => {
    setEditingOffer(null)
    setShowCreateForm(true)
  }

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer)
    setShowCreateForm(true)
  }

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return

    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setOffers(offers.filter(o => o.id !== offerId))
      }
    } catch (error) {
      console.error('Error deleting offer:', error)
    }
  }

  const handleToggleStatus = async (offerId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        setOffers(offers.map(o => 
          o.id === offerId ? { ...o, status: newStatus as any } : o
        ))
      }
    } catch (error) {
      console.error('Error updating offer status:', error)
    }
  }

  const handleRegenerateBanner = async (offerId: string) => {
    setGeneratingBanner(offerId)
    
    try {
      const response = await fetch(`/api/offers/${offerId}/regenerate-banner`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setOffers(offers.map(o => 
          o.id === offerId 
            ? { 
                ...o, 
                ai_banner_url: data.banner_url,
                banner_generated_at: new Date().toISOString()
              } 
            : o
        ))
      }
    } catch (error) {
      console.error('Error regenerating banner:', error)
    } finally {
      setGeneratingBanner(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'inactive': return 'text-gray-600 bg-gray-100'
      case 'expired': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-secondary)' }}></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Promotional Offers
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Create and manage promotional offers with AI-generated banners
          </p>
        </div>
        <button
          onClick={handleCreateOffer}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
          style={{ 
            backgroundColor: 'var(--accent-secondary)', 
            color: 'white' 
          }}
        >
          <Plus className="h-4 w-4" />
          Create Offer
        </button>
      </div>

      {/* Offers List */}
      {offers.length === 0 ? (
        <div 
          className="text-center p-8 rounded-lg border-2 border-dashed"
          style={{ borderColor: 'var(--border-secondary)' }}
        >
          <Package className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            No offers yet
          </h4>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Create your first promotional offer to boost sales with AI-generated banners
          </p>
          <button
            onClick={handleCreateOffer}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
            style={{ 
              backgroundColor: 'var(--accent-secondary)', 
              color: 'white' 
            }}
          >
            <Plus className="h-4 w-4" />
            Create Your First Offer
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="p-6 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {offer.name}
                    </h4>
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}
                    >
                      {offer.status}
                    </span>
                  </div>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {offer.description}
                  </p>
                  
                  {/* Offer Details */}
                  <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex items-center gap-1">
                      {offer.offer_type === 'percentage' ? (
                        <Percent className="h-4 w-4" />
                      ) : (
                        <DollarSign className="h-4 w-4" />
                      )}
                      <span>
                        {offer.offer_type === 'percentage' 
                          ? `${offer.offer_value}% off`
                          : `$${offer.offer_value} off`
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(offer.start_date)} - {formatDate(offer.end_date)}</span>
                    </div>
                    {offer.product_count && (
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        <span>{offer.product_count} products</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Banner Status */}
                  {offer.ai_banner_url ? (
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4" style={{ color: 'var(--accent-secondary)' }} />
                      <button
                        onClick={() => handleRegenerateBanner(offer.id)}
                        disabled={generatingBanner === offer.id}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                        title="Regenerate Banner"
                      >
                        <RefreshCw 
                          className={`h-4 w-4 ${generatingBanner === offer.id ? 'animate-spin' : ''}`}
                          style={{ color: 'var(--text-secondary)' }}
                        />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRegenerateBanner(offer.id)}
                      disabled={generatingBanner === offer.id}
                      className="flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors hover:bg-gray-50"
                      style={{ borderColor: 'var(--border-primary)' }}
                    >
                      <Image className="h-3 w-3" />
                      Generate Banner
                    </button>
                  )}

                  {/* Toggle Status */}
                  <button
                    onClick={() => handleToggleStatus(offer.id, offer.status)}
                    className="p-2 rounded hover:bg-gray-100 transition-colors"
                    title={offer.status === 'active' ? 'Deactivate' : 'Activate'}
                  >
                    {offer.status === 'active' ? (
                      <EyeOff className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                    ) : (
                      <Eye className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                    )}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleEditOffer(offer)}
                    className="p-2 rounded hover:bg-gray-100 transition-colors"
                    title="Edit Offer"
                  >
                    <Edit className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteOffer(offer.id)}
                    className="p-2 rounded hover:bg-red-50 transition-colors"
                    title="Delete Offer"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Banner Preview */}
              {offer.ai_banner_url && (
                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Image className="h-4 w-4" style={{ color: 'var(--accent-secondary)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      AI Generated Banner
                    </span>
                    {offer.banner_generated_at && (
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Generated {formatDate(offer.banner_generated_at)}
                      </span>
                    )}
                  </div>
                  <img 
                    src={offer.ai_banner_url} 
                    alt={`Banner for ${offer.name}`}
                    className="w-full max-w-md h-32 object-cover rounded border"
                    style={{ borderColor: 'var(--border-primary)' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreateOfferModal
          offer={editingOffer}
          products={products}
          organizationId={organizationId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchOffers()
          }}
        />
      )}
    </div>
  )
}

// Create Offer Modal Component (we'll create this next)
const CreateOfferModal: React.FC<{
  offer?: Offer | null
  products: Product[]
  organizationId: string
  onClose: () => void
  onSuccess: () => void
}> = ({ offer, products, organizationId, onClose, onSuccess }) => {
  // Modal implementation will go here
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        <h3 className="text-lg font-semibold mb-4">
          {offer ? 'Edit Offer' : 'Create New Offer'}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Modal implementation coming next...
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default OffersManager
