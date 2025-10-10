'use client'

import React, { useState, useEffect } from 'react'
import { 
  Package, Plus, Edit, Trash2, Search, Sparkles, 
  DollarSign, Tag, Image, Calendar, Percent, 
  CheckCircle, Clock, AlertCircle, Eye
} from 'lucide-react'
import ProductForm from './ProductForm'
import CreateOfferForm from '@/components/offers/CreateOfferForm'

interface Product {
  id: string
  name: string
  description?: string
  image_url?: string
  price?: number
  payment_transaction_id?: string
  supports_reservations?: boolean
  has_active_offer?: boolean
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
        setProducts(data.products || [])
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
      const response = await fetch(`/api/organizations/${organizationId}/offers`)
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Productos y Servicios
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Gestiona tu catálogo de productos y servicios
            </p>
          </div>
          <button
            onClick={() => {
              setEditingProduct(null)
              setShowProductForm(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{ 
              backgroundColor: 'var(--accent-primary)',
              color: 'white'
            }}
          >
            <Plus className="h-5 w-5" />
            Agregar Producto
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
              placeholder="Buscar productos y servicios..."
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
            {filteredProducts.length === 0 ? (
              <div 
                className="text-center py-12 rounded-xl border-2 border-dashed"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-secondary)'
                }}
              >
                <Package className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {search ? 'No se encontraron productos' : 'Aún no hay productos'}
                </h3>
                <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                  {search ? 'Intenta con otro término de búsqueda' : 'Crea tu primer producto o servicio'}
                </p>
                {!search && (
                  <button
                    onClick={() => setShowProductForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{ 
                      backgroundColor: 'var(--accent-primary)',
                      color: 'white'
                    }}
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
                    className="p-6 rounded-xl border transition-all duration-200 hover:shadow-lg"
                    style={{ 
                      backgroundColor: 'var(--bg-primary)',
                      borderColor: 'var(--border-primary)'
                    }}
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
                            <div 
                              className="w-16 h-16 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: 'var(--bg-tertiary)' }}
                            >
                              <Package className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {product.name}
                            </h3>
                            {product.price && (
                              <p className="text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>
                                ${product.price.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                        {product.description && (
                          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                            {product.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {product.supports_reservations && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border"
                                  style={{ color: 'var(--accent-secondary)', backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--accent-secondary)' }}>
                              <Calendar className="h-3 w-3" />
                              Reservaciones habilitadas
                            </span>
                          )}
                          {product.payment_transaction_id && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border"
                                  style={{ color: 'var(--accent-primary)', backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--accent-primary)' }}>
                              <DollarSign className="h-3 w-3" />
                              Enlace de pago conectado
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => {
                            setEditingProduct(product)
                            setShowProductForm(true)
                          }}
                          className="p-2 rounded-lg transition-colors"
                          style={{ 
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ 
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)'
                          }}
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
      <div 
        className="p-6 rounded-xl border"
        style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)'
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-secondary)' }}>
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Ofertas Promocionales
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Crea ofertas con IA y banners impresionantes
              </p>
            </div>
          </div>
          <button
            onClick={handleCreateOffer}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            style={{ 
              backgroundColor: 'var(--accent-secondary)',
              color: 'white'
            }}
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
            <Tag className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Aún no hay ofertas. ¡Crea tu primera oferta promocional para impulsar tus ventas! 🚀
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="p-4 rounded-lg border transition-all"
                style={{ 
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: offer.status === 'active' ? 'var(--accent-secondary)' : 'var(--border-secondary)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {offer.name}
                      </h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getOfferStatusColor(offer.status)}`}>
                        {offer.status === 'active' && <CheckCircle className="h-3 w-3" />}
                        {offer.status === 'inactive' && <Clock className="h-3 w-3" />}
                        {offer.status === 'expired' && <AlertCircle className="h-3 w-3" />}
                        {offer.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
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
                    className="p-2 rounded-lg transition-colors ml-2"
                    style={{ 
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)'
                    }}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
          </div>
        </div>
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

