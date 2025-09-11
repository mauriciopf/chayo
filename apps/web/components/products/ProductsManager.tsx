'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Package, DollarSign } from 'lucide-react'
import ProductForm from '@/components/products/ProductForm'

interface Product {
  id: string
  name: string
  description?: string
  image_url?: string
  price?: number
  payment_transaction_id?: string
  created_at: string
  updated_at: string
}

interface ProductsManagerProps {
  organizationId: string
}

export default function ProductsManager({ organizationId }: ProductsManagerProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

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
  }, [organizationId, page, search])

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Products & Services
          </h1>
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
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" style={{ color: 'var(--accent-secondary)' }} />
                              <span className="text-lg font-medium" style={{ color: 'var(--accent-secondary)' }}>
                                {product.price}
                              </span>
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
    </div>
  )
}
