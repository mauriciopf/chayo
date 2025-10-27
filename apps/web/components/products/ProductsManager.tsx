'use client'

import React, { useState, useEffect } from 'react'
import { 
  Package, Plus, Edit, Trash2, Search, Sparkles, 
  DollarSign, Tag, Image, Calendar, Percent, 
  CheckCircle, Clock, AlertCircle, Eye, Copy, Share2
} from 'lucide-react'
import ProductForm from './ProductForm'
import CreateOfferForm from '@/components/offers/CreateOfferForm'

interface Product {
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
  product_count: number
  created_at: string
  updated_at: string
}

interface ProductsManagerProps {
  organizationId: string
}

const ProductsManager: React.FC<ProductsManagerProps> = ({ organizationId }) => {
  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  // Offers state
  const [offers, setOffers] = useState<Offer[]>([])
  const [offersLoading, setOffersLoading] = useState(true)
  const [showCreateOffer, setShowCreateOffer] = useState(false)
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)

  // Load products
  useEffect(() => {
    if (organizationId) {
      loadProducts()
      loadOffers()
    }
  }, [organizationId])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products?organizationId=${organizationId}&limit=100`)
      if (response.ok) {
        const data = await response.json()
        // Fetch shareable links for all products
        const productsWithLinks = await Promise.all(
          (data.products || []).map(async (product: Product) => {
            const linkResponse = await fetch(`/api/shareable-links?contentType=product&contentId=${product.id}`)
            if (linkResponse.ok) {
              const linkData = await linkResponse.json()
              return { ...product, shareable_link: linkData.link?.full_url }
            }
            return product
          })
        )
        setProducts(productsWithLinks)
      }
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOffers = async () => {
    try {
      setOffersLoading(true)
      const response = await fetch(`/api/offers?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setOffers(data.offers || [])
      }
    } catch (error) {
      console.error('Error loading offers:', error)
    } finally {
      setOffersLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        loadProducts()
      }
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const handleCopyLink = async (link: string, productId: string) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedLink(productId)
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (error) {
      console.error('Error copying link:', error)
    }
  }

  const handleShareWhatsApp = (link: string, productName: string) => {
    const message = encodeURIComponent(`Hola! 👋 Mira este producto: ${productName}\n\n${link}`)
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  const handleCreateOffer = () => {
    setEditingOffer(null)
    setShowCreateOffer(true)
  }

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer)
    setShowCreateOffer(true)
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.description?.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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

  return (
    <div className="space-y-8">
      {/* 📦 PRODUCTS & SERVICES SECTION */}
      <div className="space-y-6">
        {/* Products Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Productos y Servicios
            </h2>
            <p className="text-gray-600">
              Gestiona tu catálogo de productos y servicios
            </p>
          </div>
          <button
            onClick={() => setShowProductForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700"
          >
            <Plus className="h-5 w-5" />
            Agregar Producto
          </button>
        </div>

        {/* Search */}
        <div className="p-4 rounded-lg border border-gray-200 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos y servicios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
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
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 rounded-xl border-2 border-dashed border-gray-300 bg-white">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2 text-gray-900">
                  {search ? 'No se encontraron productos' : 'Aún no hay productos'}
                </h3>
                <p className="mb-6 text-gray-600">
                  {search ? 'Intenta con otro término de búsqueda' : 'Crea tu primer producto o servicio'}
                </p>
                {!search && (
                  <button
                    onClick={() => setShowProductForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700"
                  >
                    <Plus className="h-5 w-5" />
                    Agregar Producto
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-6 rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {product.name}
                            </h3>
                            {product.price && (
                              <p className="text-lg font-bold text-purple-600">
                                ${product.price.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                        {product.description && (
                          <p className="text-sm mb-3 text-gray-600">
                            {product.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {product.supports_reservations && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border border-teal-500 bg-teal-50 text-teal-700">
                              <Calendar className="h-3 w-3" />
                              Reservaciones habilitadas
                            </span>
                          )}
                          {product.payment_link_url && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border border-purple-500 bg-purple-50 text-purple-700">
                              <DollarSign className="h-3 w-3" />
                              Pago online habilitado
                            </span>
                          )}
                        </div>
                        
                        {/* Shareable Link Section */}
                        {product.shareable_link && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-500">
                                🔗 Link compartible:
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCopyLink(product.shareable_link!, product.id)
                                  }}
                                  className="p-1.5 rounded-md transition-all hover:scale-110"
                                  style={{
                                    backgroundColor: copiedLink === product.id ? '#10b981' : '#8b5cf6',
                                    color: 'white',
                                  }}
                                  title="Copiar link"
                                >
                                  {copiedLink === product.id ? (
                                    <CheckCircle className="h-3.5 w-3.5" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleShareWhatsApp(product.shareable_link!, product.name)
                                  }}
                                  className="p-1.5 rounded-md transition-all hover:scale-110"
                                  style={{
                                    backgroundColor: '#25D366',
                                    color: 'white',
                                  }}
                                  title="Compartir por WhatsApp"
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            <div 
                              className="text-xs px-3 py-2 rounded-md font-mono truncate bg-gray-50 text-gray-600 border border-gray-200"
                            >
                              {product.shareable_link}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => {
                            setEditingProduct(product)
                            setShowProductForm(true)
                          }}
                          className="p-2 rounded-lg transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 rounded-lg transition-colors bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
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
      </div>

      {/* 🎯 PROMOTIONAL OFFERS - SIMPLIFIED SECTION */}
      <div className="p-6 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Ofertas Promocionales
              </h3>
              <p className="text-sm text-gray-600">
                Crea ofertas con IA y banners impresionantes
              </p>
            </div>
          </div>
          <button
            onClick={handleCreateOffer}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm bg-teal-500 text-white hover:bg-teal-600"
          >
            <Plus className="h-4 w-4" />
            Crear Oferta
          </button>
        </div>

        {/* Offers List - Compact */}
        {offersLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2" 
                 style={{ borderColor: 'var(--accent-secondary)' }}></div>
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-6">
            <Tag className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              Aún no hay ofertas. ¡Crea tu primera oferta promocional para impulsar tus ventas! 🚀
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className={`p-4 rounded-lg border transition-all bg-gray-50 ${
                  offer.status === 'active' ? 'border-teal-500' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4 justify-between">
                  {/* Banner Image */}
                  {offer.ai_banner_url && (
                    <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-200">
                      <img 
                        src={offer.ai_banner_url} 
                        alt={offer.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {offer.name}
                      </h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getOfferStatusColor(offer.status)}`}>
                        {offer.status === 'active' && <CheckCircle className="h-3 w-3" />}
                        {offer.status === 'inactive' && <Clock className="h-3 w-3" />}
                        {offer.status === 'expired' && <AlertCircle className="h-3 w-3" />}
                        {offer.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        {offer.offer_type === 'percentage' ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                        {offer.offer_type === 'percentage' ? `${offer.offer_value}% OFF` : `$${offer.offer_value} OFF`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(offer.start_date)} - {formatDate(offer.end_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {offer.product_count} products
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleEditOffer(offer)}
                    className="flex-shrink-0 p-2 rounded-lg transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          organizationId={organizationId}
          product={editingProduct}
          onSave={() => {
            loadProducts()
            setShowProductForm(false)
            setEditingProduct(null)
          }}
          onCancel={() => {
            setShowProductForm(false)
            setEditingProduct(null)
          }}
        />
      )}

      {/* Create Offer Form */}
      {showCreateOffer && (
        <CreateOfferForm
          organizationId={organizationId}
          products={products.map(p => ({ ...p, has_active_offer: p.has_active_offer ?? false }))}
          offer={editingOffer}
          onSave={() => {
            loadOffers()
            setShowCreateOffer(false)
            setEditingOffer(null)
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

export default ProductsManager

