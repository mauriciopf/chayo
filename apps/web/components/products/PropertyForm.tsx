'use client'

import { useState, useRef } from 'react'
import { X, DollarSign, Home, Image as ImageIcon, Calendar, CreditCard, AlertCircle, MapPin, Bed, Bath } from 'lucide-react'
import PaymentProviderSelector from '@/components/payments/PaymentProviderSelector'
import PaymentProviderConfigModal from '@/components/payments/PaymentProviderConfigModal'

interface Property {
  id: string
  name: string
  description?: string
  image_url?: string
  price?: number
  payment_enabled?: boolean
  payment_provider_id?: string
  supports_reservations?: boolean
  address?: string
  bedrooms?: number
  bathrooms?: number
  property_type?: string
}

interface PropertyFormProps {
  organizationId: string
  property?: Property | null
  onSave: () => void
  onCancel: () => void
}

export default function PropertyForm({ organizationId, property, onSave, onCancel }: PropertyFormProps) {
  const [formData, setFormData] = useState({
    name: property?.name || '',
    description: property?.description || '',
    imageUrl: property?.image_url || '',
    price: property?.price?.toString() || '',
    paymentEnabled: property?.payment_enabled || false,
    paymentProviderId: property?.payment_provider_id || null,
    supportsReservations: property?.supports_reservations || false,
    address: property?.address || '',
    bedrooms: property?.bedrooms?.toString() || '',
    bathrooms: property?.bathrooms?.toString() || '',
    propertyType: property?.property_type || 'apartment'
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
      uploadFormData.append('folder', 'products') // We can keep 'products' folder or change to 'properties'

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
      alert('Error al subir la imagen')
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
      alert('El título de la propiedad es requerido')
      return
    }

    try {
      setSaving(true)
      setWarningMessage(null)

      const propertyData = {
        organizationId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        imageUrl: formData.imageUrl || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        paymentEnabled: formData.paymentEnabled,
        paymentProviderId: formData.paymentProviderId || undefined,
        supportsReservations: formData.supportsReservations,
        // New fields
        address: formData.address.trim() || undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : undefined,
        property_type: formData.propertyType
      }

      const url = property ? `/api/products/${property.id}` : '/api/products'
      const method = property ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(propertyData)
      })

      const data = await response.json()

      if (response.ok) {
        if (data.warning) {
          setWarningMessage(data.warning)
          return
        }
        onSave()
      } else {
        console.error('Save failed:', data.error)
        alert('Error al guardar la propiedad')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Error al guardar la propiedad')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onCancel()
          }
        }}
      >
        <div 
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <div className="flex items-center gap-3">
            <Home className="h-6 w-6" style={{ color: 'var(--accent-secondary)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {property ? 'Editar Propiedad' : 'Agregar Nueva Propiedad'}
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
                  Configuración incompleta
                </p>
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {warningMessage}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setWarningMessage(null)
                    onSave()
                  }}
                  className="mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ 
                    backgroundColor: '#f59e0b',
                    color: 'white'
                  }}
                >
                  Entendido
                </button>
              </div>
            </div>
          )}

          {/* Image Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Foto Principal (Opcional)
            </label>
            <div className="flex flex-col gap-4">
              {formData.imageUrl ? (
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
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
                        Subir foto de la propiedad
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

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Property Title */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Título / Nombre de la Propiedad *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ej: Departamento en Condesa"
                required
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-secondary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            {/* Property Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Tipo de Propiedad
              </label>
              <select
                value={formData.propertyType}
                onChange={(e) => handleInputChange('propertyType', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-secondary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="apartment">Departamento</option>
                <option value="house">Casa</option>
                <option value="commercial">Local Comercial</option>
                <option value="land">Terreno</option>
                <option value="office">Oficina</option>
              </select>
            </div>

            {/* Monthly Rent */}
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Renta Mensual
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

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Dirección Completa
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5" 
                            style={{ color: 'var(--text-muted)' }} />
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Calle, Número, Colonia, Ciudad"
                  rows={2}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors resize-none"
                  style={{ 
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Bedrooms & Bathrooms */}
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Recámaras
              </label>
              <div className="relative">
                <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" 
                     style={{ color: 'var(--text-muted)' }} />
                <input
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                  placeholder="Ej: 2"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Baños
              </label>
              <div className="relative">
                <Bath className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" 
                      style={{ color: 'var(--text-muted)' }} />
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                  placeholder="Ej: 1.5"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Descripción Detallada
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Características, amenidades, requisitos..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors resize-none"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-secondary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Features: Reservations & Payments */}
          <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
            <h3 className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Funcionalidades Adicionales</h3>
            
            {/* Supports Reservations */}
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
                    Habilitar Citas de Visita
                  </span>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Permite a los interesados agendar visitas a la propiedad
                  </p>
                </div>
              </label>
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
                  onChange={(e) => handleInputChange('paymentEnabled', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  style={{ accentColor: 'var(--accent-secondary)' }}
                />
                <CreditCard className="h-5 w-5" style={{ color: 'var(--accent-secondary)' }} />
                <div>
                  <span className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Habilitar Pago de Renta/Apartado
                  </span>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Permite recibir pagos online para esta propiedad
                  </p>
                </div>
              </label>

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
                property ? 'Actualizar Propiedad' : 'Guardar Propiedad'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>

    <PaymentProviderConfigModal
      organizationId={organizationId}
      isOpen={showProviderConfigModal}
      onClose={() => setShowProviderConfigModal(false)}
      onProviderAdded={() => {}}
    />
  </>
  )
}

