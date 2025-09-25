'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  DollarSign, 
  Tag, 
  Percent, 
  Calendar, 
  Image, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import ProductForm from '@/components/products/ProductForm'

interface Product {
  id: string
  name: string
  description?: string
  image_url?: string
  price?: number
  discounted_price?: number
  has_active_offer: boolean
  payment_transaction_id?: string
  created_at: string
  updated_at: string
}

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
  product_count: number
  assigned_products?: string[]
}

interface ProductsManagerProps {
  organizationId: string
}

export default function ProductsManager({ organizationId }: ProductsManagerProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [offersLoading, setOffersLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Offers state
  const [showCreateOffer, setShowCreateOffer] = useState(false)
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  const [generatingBanner, setGeneratingBanner] = useState<string | null>(null)
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        organizationId,
        page: page.toString(),
        limit: '20'
      })

      if (search) params.append('search', search)

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()

      if (response.ok) {
        setProducts(data.products)
        setTotalPages(data.pagination.totalPages)
      } else {
        console.error('Failed to fetch products:', data.error)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchOffers()
  }, [organizationId, page, search])

  const fetchOffers = async () => {
    try {
      setOffersLoading(true)
      const response = await fetch(`/api/offers?organizationId=${organizationId}`)
      const data = await response.json()

      if (response.ok) {
        setOffers(data.offers || [])
      } else {
        console.error('Failed to fetch offers:', data.error)
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
    } finally {
      setOffersLoading(false)
    }
  }

  const handleProductSaved = () => {
    setShowProductForm(false)
    setEditingProduct(null)
    fetchProducts()
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setShowProductForm(true)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchProducts()
      } else {
        console.error('Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  // Offers management functions
  const handleCreateOffer = () => {
    setEditingOffer(null)
    setShowCreateOffer(true)
  }

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer)
    setShowCreateOffer(true)
  }

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer? This will remove all product assignments and cannot be undone.')) return

    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setOffers(offers.filter(o => o.id !== offerId))
        fetchProducts() // Refresh products to update pricing
      } else {
        console.error('Failed to delete offer')
      }
    } catch (error) {
      console.error('Error deleting offer:', error)
    }
  }

  const handleToggleOfferStatus = async (offerId: string, currentStatus: string) => {
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
        fetchProducts() // Refresh products to update pricing
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
                ai_banner_prompt: data.banner_prompt,
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

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getOfferStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-700 bg-green-100 border-green-200'
      case 'inactive': return 'text-gray-700 bg-gray-100 border-gray-200'
      case 'expired': return 'text-red-700 bg-red-100 border-red-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const getOfferStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'inactive': return <Clock className="h-4 w-4" />
      case 'expired': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const isOfferExpired = (endDate: string) => {
    return new Date(endDate) < new Date()
  }

  return (
    <div className="space-y-8">
      {/* 🎯 PROMOTIONAL OFFERS SECTION - THE BEST EVER! */}
      <div className="space-y-6">
        {/* Offers Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-secondary)' }}>
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                AI-Powered Promotional Offers
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Create stunning offers with AI-generated banners that boost sales and engage customers
            </p>
          </div>
          <button
            onClick={handleCreateOffer}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, var(--accent-secondary) 0%, #8B5CF6 100%)',
              color: 'white'
            }}
          >
            <Plus className="h-5 w-5" />
            Create AI Offer
          </button>
        </div>

        {/* Offers Display */}
        {offersLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" 
                 style={{ borderColor: 'var(--accent-secondary)' }}></div>
          </div>
        ) : offers.length === 0 ? (
          <div 
            className="text-center py-12 rounded-xl border-2 border-dashed relative overflow-hidden"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-secondary)'
            }}
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-50"></div>
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                  <Tag className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Ready to Boost Your Sales? 🚀
              </h3>
              <p className="mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                Create your first AI-powered promotional offer with stunning banners that convert visitors into customers
              </p>
              <button
                onClick={handleCreateOffer}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg"
                style={{ 
                  background: 'linear-gradient(135deg, var(--accent-secondary) 0%, #8B5CF6 100%)',
                  color: 'white'
                }}
              >
                <Sparkles className="h-5 w-5" />
                Create Your First Offer
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-xl border transition-all duration-200 hover:shadow-xl relative overflow-hidden"
                style={{ 
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: offer.status === 'active' ? 'var(--accent-secondary)' : 'var(--border-primary)',
                  borderWidth: offer.status === 'active' ? '2px' : '1px'
                }}
              >
                {/* Active offer glow effect */}
                {offer.status === 'active' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
                )}
                
                <div className="p-6 relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                          {offer.name}
                        </h3>
                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getOfferStatusColor(offer.status)}`}>
                          {getOfferStatusIcon(offer.status)}
                          <span className="capitalize">{offer.status}</span>
                        </div>
                        {isOfferExpired(offer.end_date) && offer.status === 'active' && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                            <AlertCircle className="h-3 w-3" />
                            Expired
                          </div>
                        )}
                      </div>
                      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                        {offer.description}
                      </p>
                      
                      {/* Offer Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          {offer.offer_type === 'percentage' ? (
                            <Percent className="h-4 w-4" style={{ color: 'var(--accent-secondary)' }} />
                          ) : (
                            <DollarSign className="h-4 w-4" style={{ color: 'var(--accent-secondary)' }} />
                          )}
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {offer.offer_type === 'percentage' 
                              ? `${offer.offer_value}% OFF`
                              : `$${offer.offer_value} OFF`
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {formatDate(offer.start_date)} - {formatDate(offer.end_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {offer.product_count} products
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {offer.ai_banner_url ? (
                            <>
                              <Image className="h-4 w-4" style={{ color: 'var(--accent-secondary)' }} />
                              <span className="text-sm font-medium" style={{ color: 'var(--accent-secondary)' }}>
                                AI Banner Ready
                              </span>
                            </>
                          ) : (
                            <>
                              <Image className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                No Banner
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {/* Generate/Regenerate Banner */}
                      {offer.ai_banner_url ? (
                        <button
                          onClick={() => handleRegenerateBanner(offer.id)}
                          disabled={generatingBanner === offer.id}
                          className="p-2 rounded-lg transition-colors hover:bg-purple-50"
                          title="Regenerate AI Banner"
                          style={{ 
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--accent-secondary)'
                          }}
                        >
                          <RefreshCw 
                            className={`h-4 w-4 ${generatingBanner === offer.id ? 'animate-spin' : ''}`}
                          />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRegenerateBanner(offer.id)}
                          disabled={generatingBanner === offer.id}
                          className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors hover:bg-purple-50"
                          style={{ 
                            borderColor: 'var(--accent-secondary)',
                            color: 'var(--accent-secondary)'
                          }}
                        >
                          <Sparkles className="h-3 w-3" />
                          Generate Banner
                        </button>
                      )}

                      {/* Toggle Status */}
                      <button
                        onClick={() => handleToggleOfferStatus(offer.id, offer.status)}
                        className="p-2 rounded-lg transition-colors"
                        title={offer.status === 'active' ? 'Deactivate Offer' : 'Activate Offer'}
                        style={{ 
                          backgroundColor: 'var(--bg-tertiary)',
                          color: offer.status === 'active' ? 'var(--accent-danger)' : 'var(--accent-secondary)'
                        }}
                      >
                        {offer.status === 'active' ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleEditOffer(offer)}
                        className="p-2 rounded-lg transition-colors hover:bg-blue-50"
                        title="Edit Offer"
                        style={{ 
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="p-2 rounded-lg transition-colors hover:bg-red-50"
                        title="Delete Offer"
                        style={{ 
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--accent-danger)'
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      {/* Expand/Collapse */}
                      <button
                        onClick={() => setExpandedOffer(expandedOffer === offer.id ? null : offer.id)}
                        className="p-2 rounded-lg transition-colors"
                        title="View Details"
                        style={{ 
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {expandedOffer === offer.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedOffer === offer.id && (
                    <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                      {/* AI Banner Preview */}
                      {offer.ai_banner_url && (
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="h-4 w-4" style={{ color: 'var(--accent-secondary)' }} />
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              AI Generated Banner
                            </span>
                            {offer.banner_generated_at && (
                              <span className="text-xs px-2 py-1 rounded-full" 
                                    style={{ 
                                      backgroundColor: 'var(--bg-tertiary)', 
                                      color: 'var(--text-secondary)' 
                                    }}>
                                Generated {formatDate(offer.banner_generated_at)}
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <img 
                              src={offer.ai_banner_url} 
                              alt={`AI Banner for ${offer.name}`}
                              className="w-full max-w-2xl h-48 object-cover rounded-lg border shadow-lg"
                              style={{ borderColor: 'var(--border-primary)' }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
                          </div>
                        </div>
                      )}

                      {/* Assigned Products Preview */}
                      <div>
                        <h4 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                          Products in this offer ({offer.product_count})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {products
                            .filter(p => offer.assigned_products?.includes(p.id))
                            .slice(0, 6)
                            .map(product => (
                              <div 
                                key={product.id}
                                className="flex items-center gap-3 p-3 rounded-lg border"
                                style={{ 
                                  backgroundColor: 'var(--bg-secondary)',
                                  borderColor: 'var(--border-secondary)'
                                }}
                              >
                                {product.image_url ? (
                                  <img 
                                    src={product.image_url} 
                                    alt={product.name}
                                    className="w-10 h-10 rounded object-cover"
                                  />
                                ) : (
                                  <div 
                                    className="w-10 h-10 rounded flex items-center justify-center"
                                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                                  >
                                    <Package className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                    {product.name}
                                  </p>
                                  {product.price && (
                                    <div className="flex items-center gap-2">
                                      {product.discounted_price ? (
                                        <>
                                          <span className="text-xs line-through" style={{ color: 'var(--text-muted)' }}>
                                            ${product.price}
                                          </span>
                                          <span className="text-sm font-medium" style={{ color: 'var(--accent-secondary)' }}>
                                            ${product.discounted_price}
                                          </span>
                                        </>
                                      ) : (
                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                          ${product.price}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          {offer.product_count > 6 && (
                            <div 
                              className="flex items-center justify-center p-3 rounded-lg border border-dashed"
                              style={{ 
                                backgroundColor: 'var(--bg-secondary)',
                                borderColor: 'var(--border-secondary)'
                              }}
                            >
                              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                +{offer.product_count - 6} more
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t" style={{ borderColor: 'var(--border-secondary)' }}></div>

      {/* 📦 PRODUCTS & SERVICES SECTION */}
      <div className="space-y-6">
        {/* Products Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Products & Services
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Manage your products and services catalog
            </p>
          </div>
          <button
            onClick={() => setShowProductForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
            style={{ 
              backgroundColor: 'var(--accent-secondary)',
              color: 'white'
            }}
          >
            <Plus className="h-4 w-4" />
            Add Product/Service
          </button>
        </div>

      {/* Search */}
      <div 
        className="p-4 rounded-lg border"
        style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)'
        }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                  style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search products & services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors"
            style={{ 
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-secondary)',
              color: 'var(--text-primary)'
            }}
          />
        </div>
      </div>

      {/* Products Display */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" 
               style={{ borderColor: 'var(--accent-secondary)' }}></div>
        </div>
      ) : (
        <>
          {products.length === 0 ? (
            <div 
              className="text-center py-12 rounded-lg border-2 border-dashed"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-secondary)'
              }}
            >
              <Package className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                No products or services yet
              </h3>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                {search ? 'No products match your search.' : 'Get started by adding your first product or service.'}
              </p>
              {!search && (
                <button
                  onClick={() => setShowProductForm(true)}
                  className="px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{ 
                    backgroundColor: 'var(--accent-secondary)',
                    color: 'white'
                  }}
                >
                  Add your first product
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {products.map((product) => (
                <div 
                  key={product.id}
                  className="p-6 rounded-lg border transition-all duration-200 hover:shadow-lg"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-primary)'
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div 
                            className="w-16 h-16 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: 'var(--bg-tertiary)' }}
                          >
                            <Package className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                            {product.name}
                          </h3>
                          {product.description && (
                            <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>
                              {product.description}
                            </p>
                          )}
                          {product.price && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" style={{ color: 'var(--accent-secondary)' }} />
                              {product.discounted_price ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm line-through" style={{ color: 'var(--text-muted)' }}>
                                    ${product.price}
                                  </span>
                                  <span className="text-lg font-bold" style={{ color: 'var(--accent-secondary)' }}>
                                    ${product.discounted_price}
                                  </span>
                                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                                    ON SALE
                                  </span>
                                </div>
                              ) : (
                                <span className="text-lg font-medium" style={{ color: 'var(--accent-secondary)' }}>
                                  ${product.price}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ 
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-secondary)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ 
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--accent-danger)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-danger-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)'
            }}
          >
            Previous
          </button>
          <span className="flex items-center px-4" style={{ color: 'var(--text-secondary)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)'
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          organizationId={organizationId}
          product={editingProduct}
          onSave={handleProductSaved}
          onCancel={() => {
            setShowProductForm(false)
            setEditingProduct(null)
          }}
        />
      )}

      {/* 🎯 CREATE/EDIT OFFER FORM - INLINE MAGIC! */}
      {showCreateOffer && (
        <CreateOfferForm
          organizationId={organizationId}
          offer={editingOffer}
          products={products}
          onSave={() => {
            setShowCreateOffer(false)
            setEditingOffer(null)
            fetchOffers()
            fetchProducts()
          }}
          onCancel={() => {
            setShowCreateOffer(false)
            setEditingOffer(null)
          }}
        />
      )}
    </div>
  )
}

// 🚀 THE MOST AMAZING CREATE OFFER FORM EVER BUILT!
interface CreateOfferFormProps {
  organizationId: string
  offer?: Offer | null
  products: Product[]
  onSave: () => void
  onCancel: () => void
}

const CreateOfferForm: React.FC<CreateOfferFormProps> = ({
  organizationId,
  offer,
  products,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: offer?.name || '',
    description: offer?.description || '',
    offer_type: offer?.offer_type || 'percentage' as 'percentage' | 'fixed_amount',
    offer_value: offer?.offer_value || 0,
    start_date: offer?.start_date ? offer.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
    end_date: offer?.end_date ? offer.end_date.split('T')[0] : '',
    selectedProducts: offer?.assigned_products || []
  })
  
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) newErrors.name = 'Offer name is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (formData.offer_value <= 0) newErrors.offer_value = 'Offer value must be greater than 0'
    if (formData.offer_type === 'percentage' && formData.offer_value > 100) {
      newErrors.offer_value = 'Percentage cannot exceed 100%'
    }
    if (!formData.end_date) newErrors.end_date = 'End date is required'
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      newErrors.end_date = 'End date must be after start date'
    }
    if (formData.selectedProducts.length === 0) {
      newErrors.selectedProducts = 'Please select at least one product'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setSaving(true)
    
    try {
      const url = offer ? `/api/offers/${offer.id}` : '/api/offers'
      const method = offer ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organizationId,
          start_date: new Date(formData.start_date).toISOString(),
          end_date: new Date(formData.end_date).toISOString(),
        })
      })
      
      if (response.ok) {
        onSave()
      } else {
        const data = await response.json()
        setErrors({ submit: data.error || 'Failed to save offer' })
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const toggleProductSelection = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(productId)
        ? prev.selectedProducts.filter(id => id !== productId)
        : [...prev.selectedProducts, productId]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Header */}
        <div 
          className="px-8 py-6 border-b"
          style={{ 
            background: 'linear-gradient(135deg, var(--accent-secondary) 0%, #8B5CF6 100%)',
            borderColor: 'var(--border-primary)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {offer ? 'Edit AI Offer' : 'Create AI-Powered Offer'}
                </h2>
                <p className="text-white/80 text-sm">
                  {offer ? 'Update your promotional offer' : 'Boost sales with AI-generated promotional banners'}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Plus className="h-6 w-6 text-white rotate-45" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Basic Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Tag className="h-5 w-5" />
                Offer Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Offer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Summer Sale 2024"
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: errors.name ? '#EF4444' : 'var(--border-primary)',
                      color: 'var(--text-primary)',
                      focusRingColor: 'var(--accent-secondary)'
                    }}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Offer Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, offer_type: 'percentage' }))}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                        formData.offer_type === 'percentage' 
                          ? 'border-purple-500 bg-purple-50 text-purple-700' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Percent className="h-4 w-4" />
                      Percentage
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, offer_type: 'fixed_amount' }))}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                        formData.offer_type === 'fixed_amount' 
                          ? 'border-purple-500 bg-purple-50 text-purple-700' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <DollarSign className="h-4 w-4" />
                      Fixed Amount
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your amazing offer..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors resize-none"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: errors.description ? '#EF4444' : 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    {formData.offer_type === 'percentage' ? 'Discount Percentage *' : 'Discount Amount *'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.offer_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, offer_value: parseFloat(e.target.value) || 0 }))}
                      placeholder={formData.offer_type === 'percentage' ? '20' : '50'}
                      min="0"
                      max={formData.offer_type === 'percentage' ? '100' : undefined}
                      step={formData.offer_type === 'percentage' ? '1' : '0.01'}
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors"
                      style={{ 
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: errors.offer_value ? '#EF4444' : 'var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {formData.offer_type === 'percentage' ? (
                        <Percent className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                      ) : (
                        <DollarSign className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                      )}
                    </div>
                  </div>
                  {errors.offer_value && <p className="text-red-500 text-sm mt-1">{errors.offer_value}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    min={formData.start_date}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: errors.end_date ? '#EF4444' : 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
                </div>
              </div>
            </div>

            {/* Product Selection */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Package className="h-5 w-5" />
                  Select Products & Services ({formData.selectedProducts.length} selected)
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, selectedProducts: products.map(p => p.id) }))}
                    className="text-sm px-3 py-1 rounded-lg border transition-colors"
                    style={{ 
                      borderColor: 'var(--accent-secondary)',
                      color: 'var(--accent-secondary)'
                    }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, selectedProducts: [] }))}
                    className="text-sm px-3 py-1 rounded-lg border transition-colors"
                    style={{ 
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {products.length === 0 ? (
                <div 
                  className="text-center py-8 rounded-lg border-2 border-dashed"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-secondary)'
                  }}
                >
                  <Package className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>
                    No products available. Create some products first to add them to offers.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => toggleProductSelection(product.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.selectedProducts.includes(product.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          formData.selectedProducts.includes(product.id)
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-gray-300'
                        }`}>
                          {formData.selectedProducts.includes(product.id) && (
                            <CheckCircle className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-12 h-12 rounded object-cover mb-2"
                            />
                          ) : (
                            <div 
                              className="w-12 h-12 rounded flex items-center justify-center mb-2"
                              style={{ backgroundColor: 'var(--bg-tertiary)' }}
                            >
                              <Package className="h-6 w-6" style={{ color: 'var(--text-muted)' }} />
                            </div>
                          )}
                          <h4 className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                            {product.name}
                          </h4>
                          {product.price && (
                            <p className="text-sm font-medium" style={{ color: 'var(--accent-secondary)' }}>
                              ${product.price}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {errors.selectedProducts && <p className="text-red-500 text-sm">{errors.selectedProducts}</p>}
            </div>

            {/* Submit Errors */}
            {errors.submit && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 rounded-lg border font-medium transition-colors"
                style={{ 
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-secondary)'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: 'linear-gradient(135deg, var(--accent-secondary) 0%, #8B5CF6 100%)',
                  color: 'white'
                }}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {offer ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {offer ? 'Update Offer' : 'Create AI Offer'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
