'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, Edit, Trash2, Search, Sparkles, 
  DollarSign, Tag, Image, Calendar, Percent, 
  CheckCircle, Clock, AlertCircle, Eye, Copy, Share2,
  Home, MapPin, Bed, Bath
} from 'lucide-react'
import PropertyForm from './PropertyForm'
import CreateOfferForm from '@/components/offers/CreateOfferForm'

interface Property {
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

interface PropertiesManagerProps {
  organizationId: string
}

const PropertiesManager: React.FC<PropertiesManagerProps> = ({ organizationId }) => {
  // Properties state
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showPropertyForm, setShowPropertyForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  // Offers state
  const [offers, setOffers] = useState<Offer[]>([])
  const [offersLoading, setOffersLoading] = useState(true)
  const [showCreateOffer, setShowCreateOffer] = useState(false)
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)

  // Load properties
  useEffect(() => {
    if (organizationId) {
      syncPropertiesFromMeta()
      loadOffers()
    }
  }, [organizationId])

  const syncPropertiesFromMeta = async () => {
    try {
      setLoading(true)
      setSyncing(true)
      setSyncMessage('Sincronizando...')

      // First, sync from Meta Commerce (renaming to properties internally but API keeps products for now)
      const syncResponse = await fetch(`/api/whatsapp/products?organizationId=${organizationId}`)
      
      if (syncResponse.ok) {
        const syncData = await syncResponse.json()
        if (syncData.imported > 0) {
          setSyncMessage(`✅ ${syncData.imported} propiedades importadas`)
        } else if (syncData.totalMetaProducts > 0) {
          setSyncMessage('✅ Sincronizado con WhatsApp')
        } else {
          setSyncMessage(null)
        }
      } else {
        setSyncMessage(null)
      }

      await loadProperties()
    } catch (error) {
      console.error('Error syncing properties:', error)
      setSyncMessage(null)
      await loadProperties()
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMessage(null), 3000)
    }
  }

  const loadProperties = async () => {
    try {
      const response = await fetch(`/api/products?organizationId=${organizationId}&limit=100`)
      if (response.ok) {
        const data = await response.json()
        // Fetch shareable links
        const propertiesWithLinks = await Promise.all(
          (data.products || []).map(async (property: Property) => {
            const linkResponse = await fetch(`/api/shareable-links?contentType=product&contentId=${property.id}`)
            if (linkResponse.ok) {
              const linkData = await linkResponse.json()
              return { ...property, shareable_link: linkData.link?.full_url }
            }
            return property
          })
        )
        setProperties(propertiesWithLinks)
      }
    } catch (error) {
      console.error('Error loading properties:', error)
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

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta propiedad?')) return

    try {
      const response = await fetch(`/api/products/${propertyId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        loadProperties()
      }
    } catch (error) {
      console.error('Error deleting property:', error)
    }
  }

  const handleCopyLink = async (link: string, propertyId: string) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedLink(propertyId)
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (error) {
      console.error('Error copying link:', error)
    }
  }

  const handleShareWhatsApp = (link: string, propertyName: string) => {
    const message = encodeURIComponent(`¡Hola! 👋 Te comparto esta propiedad: ${propertyName}\n\n${link}`)
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

  const filteredProperties = properties.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.address?.toLowerCase().includes(search.toLowerCase())
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

  const translatePropertyType = (type?: string) => {
    switch(type) {
      case 'house': return 'Casa';
      case 'apartment': return 'Departamento';
      case 'commercial': return 'Local';
      case 'land': return 'Terreno';
      case 'office': return 'Oficina';
      default: return 'Propiedad';
    }
  }

  return (
    <div className="space-y-8">
      {/* 🏘️ PROPERTIES SECTION */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Gestión de Inmuebles
            </h2>
            <p className="text-gray-600">
              Administra tus propiedades en renta o venta
            </p>
          </div>
          <button
            onClick={() => setShowPropertyForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700"
          >
            <Plus className="h-5 w-5" />
            Agregar Propiedad
          </button>
        </div>

        {/* Search */}
        <div className="p-4 rounded-lg border border-gray-200 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, descripción o dirección..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Sync Message */}
        {syncMessage && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-800 flex items-center gap-2">
              {syncing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>}
              {syncMessage}
            </p>
          </div>
        )}

        {/* Properties Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mb-4" 
                 style={{ borderColor: 'var(--accent-secondary)' }}></div>
            <p className="text-sm text-gray-600">
              Cargando propiedades...
            </p>
          </div>
        ) : (
          <>
            {filteredProperties.length === 0 ? (
              <div className="text-center py-12 rounded-xl border-2 border-dashed border-gray-300 bg-white">
                <Home className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2 text-gray-900">
                  {search ? 'No se encontraron propiedades' : 'Aún no hay propiedades registradas'}
                </h3>
                <p className="mb-6 text-gray-600">
                  {search ? 'Intenta con otros términos' : 'Registra tu primera propiedad para comenzar'}
                </p>
                {!search && (
                  <button
                    onClick={() => setShowPropertyForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700"
                  >
                    <Plus className="h-5 w-5" />
                    Agregar Propiedad
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredProperties.map((property) => (
                  <div
                    key={property.id}
                    className="p-6 rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {property.image_url ? (
                            <img 
                              src={property.image_url} 
                              alt={property.name}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-lg flex items-center justify-center bg-gray-100">
                              <Home className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                {translatePropertyType(property.property_type)}
                              </span>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {property.name}
                              </h3>
                            </div>
                            
                            {property.price && (
                              <p className="text-lg font-bold text-purple-600">
                                ${property.price.toFixed(2)} <span className="text-sm font-normal text-gray-500">/ mes</span>
                              </p>
                            )}

                            {/* Property Details (Beds/Baths/Address) */}
                            <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-600">
                              {property.bedrooms !== undefined && (
                                <span className="flex items-center gap-1" title="Recámaras">
                                  <Bed className="h-4 w-4" /> {property.bedrooms}
                                </span>
                              )}
                              {property.bathrooms !== undefined && (
                                <span className="flex items-center gap-1" title="Baños">
                                  <Bath className="h-4 w-4" /> {property.bathrooms}
                                </span>
                              )}
                              {property.address && (
                                <span className="flex items-center gap-1 truncate max-w-md" title={property.address}>
                                  <MapPin className="h-4 w-4" /> {property.address}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {property.description && (
                          <p className="text-sm mb-3 text-gray-600 line-clamp-2">
                            {property.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {property.supports_reservations && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border border-teal-500 bg-teal-50 text-teal-700">
                              <Calendar className="h-3 w-3" />
                              Visitas Habilitadas
                            </span>
                          )}
                          {property.payment_link_url && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border border-purple-500 bg-purple-50 text-purple-700">
                              <DollarSign className="h-3 w-3" />
                              Pagos Online Activos
                            </span>
                          )}
                        </div>
                        
                        {/* Shareable Link Section */}
                        {property.shareable_link && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-500">
                                🔗 Link para compartir:
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCopyLink(property.shareable_link!, property.id)
                                  }}
                                  className="p-1.5 rounded-md transition-all hover:scale-110"
                                  style={{
                                    backgroundColor: copiedLink === property.id ? '#10b981' : '#8b5cf6',
                                    color: 'white',
                                  }}
                                  title="Copiar link"
                                >
                                  {copiedLink === property.id ? (
                                    <CheckCircle className="h-3.5 w-3.5" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleShareWhatsApp(property.shareable_link!, property.name)
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
                              {property.shareable_link}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => {
                            setEditingProperty(property)
                            setShowPropertyForm(true)
                          }}
                          className="p-2 rounded-lg transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(property.id)}
                          className="p-2 rounded-lg transition-colors bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
                          title="Eliminar"
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

      {/* 🏷️ PROMOTIONS (Offers) */}
      <div className="p-6 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Promociones
              </h3>
              <p className="text-sm text-gray-600">
                Crea ofertas especiales (Ej: Mes gratis, Descuentos)
              </p>
            </div>
          </div>
          <button
            onClick={handleCreateOffer}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm bg-teal-500 text-white hover:bg-teal-600"
          >
            <Plus className="h-4 w-4" />
            Crear Promoción
          </button>
        </div>

        {/* Offers List */}
        {offersLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2" 
                 style={{ borderColor: 'var(--accent-secondary)' }}></div>
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-6">
            <Tag className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              Aún no hay promociones activas.
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

      {/* Property Form Modal */}
      {showPropertyForm && (
        <PropertyForm
          organizationId={organizationId}
          property={editingProperty}
          onSave={() => {
            loadProperties()
            setShowPropertyForm(false)
            setEditingProperty(null)
          }}
          onCancel={() => {
            setShowPropertyForm(false)
            setEditingProperty(null)
          }}
        />
      )}

      {/* Create Offer Form */}
      {showCreateOffer && (
        <CreateOfferForm
          organizationId={organizationId}
          products={properties.map(p => ({ 
            ...p, 
            has_active_offer: p.has_active_offer ?? false 
          }))}
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

export default PropertiesManager

