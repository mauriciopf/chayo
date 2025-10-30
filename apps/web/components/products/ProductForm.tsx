'use client'

import { useState, useRef } from 'react'
import { X, Upload, DollarSign, Package, Image as ImageIcon, Calendar, CreditCard, AlertCircle } from 'lucide-react'
import PaymentProviderSelector from '@/components/payments/PaymentProviderSelector'
import PaymentProviderConfigModal from '@/components/payments/PaymentProviderConfigModal'

interface Product {
  id: string
  name: string
  description?: string
  image_url?: string
  price?: number
  payment_enabled?: boolean
  payment_provider_id?: string
  supports_reservations?: boolean
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
    paymentEnabled: product?.payment_enabled || false,
    paymentProviderId: product?.payment_provider_id || null,
    supportsReservations: product?.supports_reservations || false
  })
  
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showProviderConfigModal, setShowProviderConfigModal] = useState(false)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: string, value: string | boolean | null) => {
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
        alert('Error al subir la imagen')
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
      alert('El nombre del producto es requerido')
      return
    }

    try {
      setSaving(true)
      setWarningMessage(null) // Clear previous warnings

      const productData = {
        organizationId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        imageUrl: formData.imageUrl || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        paymentEnabled: formData.paymentEnabled,
        paymentProviderId: formData.paymentProviderId || undefined,
        supportsReservations: formData.supportsReservations
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

      const data = await response.json()

      if (response.ok) {
        // Check if there's a warning (e.g., Stripe account incomplete)
        if (data.warning) {
          setWarningMessage(data.warning)
          // Don't close the form - let user see the warning
          return
        }
        onSave()
      } else {
        console.error('Save failed:', data.error)
        alert('Error al guardar el producto')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={(e) => {
          // Close when clicking backdrop
          if (e.target === e.currentTarget) {
            onCancel()
          }
        }}
      >
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
              {product ? 'Editar Producto/Servicio' : 'Agregar Nuevo Producto o Servicio'}
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
          {/* Stripe Warning Message */}
          {warningMessage && (
            <div 
              className="p-4 rounded-lg border-l-4 flex gap-3"
              style={{ 
                backgroundColor: 'var(--bg-warning)',
                borderColor: '#f59e0b',
                borderLeftColor: '#f59e0b'
              }}
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
              <div className="flex-1">
                <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Configuración de Stripe Incompleta
                </p>
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {warningMessage.includes('business name') 
                    ? 'Tu cuenta de Stripe necesita completar información básica para generar enlaces de pago.'
                    : warningMessage
                  }
                </p>
                {warningMessage.includes('business name') && (
                  <div className="text-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
                    <p className="font-medium">Cómo solucionarlo:</p>
                    <ol className="list-decimal list-inside space-y-1 pl-2">
                      <li>Ve al Dashboard de Stripe: <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80" style={{ color: '#6366f1' }}>dashboard.stripe.com</a></li>
                      <li>Navega a: <strong>Ajustes → Detalles del negocio</strong></li>
                      <li>Completa: <strong>Nombre del negocio</strong> (y opcionalmente URL del sitio web)</li>
                      <li>Guarda los cambios y vuelve a intentar</li>
                    </ol>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setWarningMessage(null)
                    onSave() // Close and refresh
                  }}
                  className="mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ 
                    backgroundColor: '#f59e0b',
                    color: 'white'
                  }}
                >
                  Entendido, lo configuraré después
                </button>
              </div>
            </div>
          )}

          {/* Image Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Imagen del Producto (Opcional)
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
                        Haz clic para subir imagen
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Ideal para productos, opcional para servicios
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
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ingresa el nombre del producto o servicio"
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
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe tu producto o servicio"
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
              Precio (Opcional)
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
                onFocus={(e) => e.target.select()}
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

          {/* Payment Configuration */}
          <div 
            className="p-4 rounded-lg border space-y-4"
            style={{ 
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-secondary)'
            }}
          >
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.paymentEnabled}
                onChange={(e) => {
                  const enabled = e.target.checked
                  handleInputChange('paymentEnabled', enabled)
                  // Don't clear provider - let user's selection persist
                }}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                style={{ accentColor: 'var(--accent-secondary)' }}
              />
              <CreditCard className="h-5 w-5" style={{ color: 'var(--accent-secondary)' }} />
              <div>
                <span className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Habilitar Pago Online
                </span>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Permite a los clientes pagar este producto/servicio en línea
                </p>
              </div>
            </label>

            {/* Payment Provider Selector - only shown if payment is enabled */}
            {formData.paymentEnabled && (
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                <PaymentProviderSelector
                  organizationId={organizationId}
                  selectedProviderId={formData.paymentProviderId}
                  onProviderSelected={(providerId) => handleInputChange('paymentProviderId', providerId)}
                  onConfigureClick={() => setShowProviderConfigModal(true)}
                  showLabel={true}
                  compact={true}
                />
              </div>
            )}
          </div>

          {/* Supports Reservations Toggle */}
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-secondary)'
            }}
          >
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.supportsReservations}
                onChange={(e) => handleInputChange('supportsReservations', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                style={{ accentColor: 'var(--accent-secondary)' }}
              />
              <Calendar className="h-5 w-5" style={{ color: 'var(--accent-secondary)' }} />
              <div>
                <span className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Habilitar Reservaciones
                </span>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Permite a los clientes reservar citas para este producto/servicio
                </p>
              </div>
            </label>
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
              Cancelar
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
                  Guardando...
                </div>
              ) : (
                product ? 'Actualizar Producto' : 'Crear Producto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>

      {/* Payment Provider Config Modal */}
      <PaymentProviderConfigModal
        organizationId={organizationId}
        isOpen={showProviderConfigModal}
        onClose={() => setShowProviderConfigModal(false)}
        onProviderAdded={() => {
          // Refresh will happen automatically when modal closes
          // The PaymentProviderSelector will reload providers
        }}
      />
    </>
  )
}
