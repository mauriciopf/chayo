import React, { useState } from 'react'
import { 
  Plus, 
  Tag, 
  Percent, 
  Calendar, 
  Package, 
  DollarSign, 
  Sparkles,
  CheckCircle
} from 'lucide-react'

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

interface CreateOfferFormProps {
  organizationId: string
  offer?: Offer | null
  products: Product[]
  onSave: () => void
  onCancel: () => void
}

export default function CreateOfferForm({
  organizationId,
  offer,
  products,
  onSave,
  onCancel
}: CreateOfferFormProps) {
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
                      color: 'var(--text-primary)'
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
                    {offer ? 'Updating & Regenerating Banner...' : 'Creating & Generating Banner...'}
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
