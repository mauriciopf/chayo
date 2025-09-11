'use client'

import { useState, useRef } from 'react'
import { X, Upload, DollarSign, Package, Image as ImageIcon } from 'lucide-react'

interface Product {
  id: string
  name: string
  description?: string
  image_url?: string
  price?: number
  payment_transaction_id?: string
}

interface ProductFormProps {
  organizationId: string
  product?: Product | null
  onSave: () => void
  onCancel: () => void
}

export default function ProductForm({ organizationId, product, onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    imageUrl: product?.image_url || '',
    price: product?.price?.toString() || '',
    paymentTransactionId: product?.payment_transaction_id || ''
  })
  
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (file: File) => {
    if (!file) return

    try {
      setUploading(true)
      
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('organizationId', organizationId)
      uploadFormData.append('folder', 'products')

      const response = await fetch('/api/products/upload', {
        method: 'POST',
        body: uploadFormData
      })

      const data = await response.json()

      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          imageUrl: data.url
        }))
      } else {
        console.error('Upload failed:', data.error)
        alert('Failed to upload image')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Product name is required')
      return
    }

    try {
      setSaving(true)

      const productData = {
        organizationId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        imageUrl: formData.imageUrl || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        paymentTransactionId: formData.paymentTransactionId || undefined
      }

      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      })

      if (response.ok) {
        onSave()
      } else {
        const data = await response.json()
        console.error('Save failed:', data.error)
        alert('Failed to save product')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6" style={{ color: 'var(--accent-secondary)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {product ? 'Edit Product/Service' : 'Add New Product or Service'}
            </h2>
          </div>
          <button 
            onClick={onCancel}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Product Image (Optional)
            </label>
            <div className="flex flex-col gap-4">
              {formData.imageUrl ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden">
                  <img
                    src={formData.imageUrl}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                    className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  className="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors"
                  style={{ 
                    borderColor: 'var(--border-secondary)',
                    backgroundColor: 'var(--bg-tertiary)'
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" 
                         style={{ borderColor: 'var(--accent-secondary)' }}></div>
                  ) : (
                    <>
                      <ImageIcon className="h-12 w-12 mb-3" style={{ color: 'var(--text-muted)' }} />
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        Click to upload image
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Great for products, optional for services
                      </p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Product/Service Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter product or service name"
              required
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors"
              style={{ 
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-secondary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your product or service"
              rows={3}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors resize-none"
              style={{ 
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-secondary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Price (Optional)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" 
                          style={{ color: 'var(--text-muted)' }} />
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-secondary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Payment Link */}
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Payment Link (Optional)
            </label>
            <input
              type="text"
              value={formData.paymentTransactionId}
              onChange={(e) => handleInputChange('paymentTransactionId', e.target.value)}
              placeholder="Link to payment created by Payment Tool"
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors"
              style={{ 
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-secondary)',
                color: 'var(--text-primary)'
              }}
            />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Connect this product/service to a payment link created by the Payment Tool
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={onCancel}
              className="px-6 py-3 rounded-lg border font-medium transition-colors"
              style={{ 
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving || uploading}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ 
                backgroundColor: 'var(--accent-secondary)',
                color: 'white'
              }}
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </div>
              ) : (
                product ? 'Update Product' : 'Create Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
