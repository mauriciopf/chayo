'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { supabase } from '@/lib/shared/supabase/client'

interface QuickLink {
  id: string
  name: string
  type: 'chat' | 'product' | 'form' | 'reservation' | 'document' | 'payment'
  url: string
  destinationId?: string
  destinationName?: string
  createdAt: string
}

interface QuickLinksManagerProps {
  organizationSlug: string
  organizationId: string
}

interface Product {
  id: string
  name: string
  description?: string
  slug?: string
}

interface Form {
  id: string
  form_name: string
  slug?: string
}

interface Document {
  id: string
  name: string
  slug?: string
}

export default function QuickLinksManager({ organizationSlug, organizationId }: QuickLinksManagerProps) {
  const [links, setLinks] = useState<QuickLink[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedLink, setSelectedLink] = useState<QuickLink | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)

  // Data for selectors
  const [products, setProducts] = useState<Product[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch data on mount
  useEffect(() => {
    fetchData()
  }, [organizationId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch products
      const { data: productsData } = await supabase
        .from('products_list_tool')
        .select('id, name, description')
        .eq('organization_id', organizationId)
        .order('name')

      // Add slug based on name for products
      if (productsData) {
        const productsWithSlugs = productsData.map(p => ({
          ...p,
          slug: generateSlug(p.name)
        }))
        setProducts(productsWithSlugs)
      }

      // Fetch forms
      const { data: formsData } = await supabase
        .from('intake_forms')
        .select('id, form_name')
        .eq('organization_id', organizationId)
        .order('form_name')

      // Add slug based on form name
      if (formsData) {
        const formsWithSlugs = formsData.map(f => ({
          ...f,
          slug: generateSlug(f.form_name)
        }))
        setForms(formsWithSlugs)
      }

      // Fetch documents
      const { data: documentsData } = await supabase
        .from('documents')
        .select('id, name')
        .eq('organization_id', organizationId)
        .order('name')

      // Add slug based on document name
      if (documentsData) {
        const documentsWithSlugs = documentsData.map(d => ({
          ...d,
          slug: generateSlug(d.name)
        }))
        setDocuments(documentsWithSlugs)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generate URL-friendly slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD') // Normalize to decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
  }

  // Link types configuration
  const linkTypes = [
    { value: 'product', label: '🛍️ Producto', description: 'Ir directo a un producto específico' },
    { value: 'form', label: '📋 Formulario', description: 'Abrir formulario de admisión' },
    { value: 'reservation', label: '📅 Reservaciones', description: 'Abrir calendario de reservaciones' },
    { value: 'document', label: '📄 Documento', description: 'Compartir documento específico' },
    { value: 'payment', label: '💳 Pago', description: 'Enlace de pago directo' },
  ]

  const generateLink = (type: string, destinationId?: string, destinationSlug?: string): string => {
    const baseUrl = 'https://chayo.onelink.me/SB63'
    const params = new URLSearchParams({
      deep_link_value: organizationSlug,
    })

    if (type !== 'chat') {
      params.append('deep_link_sub1', type)
    }

    // Use slug instead of ID for cleaner URLs
    if (destinationSlug) {
      if (type === 'product') params.append('deep_link_sub2', destinationSlug)
      if (type === 'form') params.append('deep_link_sub3', destinationSlug)
      if (type === 'document') params.append('deep_link_sub4', destinationSlug)
      if (type === 'payment') params.append('deep_link_sub5', destinationSlug)
    }

    return `${baseUrl}?${params.toString()}`
  }

  const handleCreateLink = (type: string, name: string, destinationId?: string, destinationName?: string, destinationSlug?: string) => {
    const newLink: QuickLink = {
      id: Date.now().toString(),
      name,
      type: type as any,
      url: generateLink(type, destinationId, destinationSlug),
      destinationId,
      destinationName,
      createdAt: new Date().toISOString(),
    }

    setLinks([...links, newLink])
    setShowCreateModal(false)
  }

  const handleViewLink = async (link: QuickLink) => {
    setSelectedLink(link)
    
    // Generate QR code
    try {
      const qr = await QRCode.toDataURL(link.url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff',
        },
      })
      setQrCodeUrl(qr)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying link:', error)
    }
  }

  const downloadQR = (link: QuickLink) => {
    if (qrCodeUrl) {
      const a = document.createElement('a')
      a.href = qrCodeUrl
      a.download = `${link.name.replace(/\s+/g, '_')}_qr.png`
      a.click()
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Links Rápidos
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Crea enlaces directos para compartir con tus clientes
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--text-primary)',
          }}
        >
          + Crear Link
        </button>
      </div>

      {/* Links Grid */}
      {links.length === 0 ? (
        <div
          className="text-center py-12 rounded-lg border-2 border-dashed"
          style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <p className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>
            No tienes links creados aún
          </p>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Haz clic en "Crear Link" para empezar
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link) => (
            <div
              key={link.id}
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    {link.name}
                  </p>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                    {linkTypes.find((t) => t.value === link.type)?.label}
                  </p>
                  {link.destinationName && (
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      → {link.destinationName}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleViewLink(link)}
                  className="flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Ver QR
                </button>
                <button
                  onClick={() => handleCopyLink(link.url)}
                  className="flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors border"
                  style={{
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Link Modal */}
      {showCreateModal && (
        <CreateLinkModal
          linkTypes={linkTypes}
          organizationId={organizationId}
          products={products}
          forms={forms}
          documents={documents}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateLink}
        />
      )}

      {/* View Link Modal */}
      {selectedLink && (
        <ViewLinkModal
          link={selectedLink}
          qrCodeUrl={qrCodeUrl}
          onClose={() => {
            setSelectedLink(null)
            setQrCodeUrl('')
          }}
          onCopy={() => handleCopyLink(selectedLink.url)}
          onDownload={() => downloadQR(selectedLink)}
          copied={copied}
        />
      )}
    </div>
  )
}

// Create Link Modal Component
function CreateLinkModal({
  linkTypes,
  organizationId,
  products,
  forms,
  documents,
  onClose,
  onCreate,
}: {
  linkTypes: any[]
  organizationId: string
  products: Product[]
  forms: Form[]
  documents: Document[]
  onClose: () => void
  onCreate: (type: string, name: string, destinationId?: string, destinationName?: string, destinationSlug?: string) => void
}) {
  const [selectedType, setSelectedType] = useState('')
  const [linkName, setLinkName] = useState('')
  const [selectedDestinationId, setSelectedDestinationId] = useState('')

  // Get available destinations based on selected type
  const getDestinations = () => {
    switch (selectedType) {
      case 'product':
        return products.map(p => ({ id: p.id, name: p.name, slug: p.slug }))
      case 'form':
        return forms.map(f => ({ id: f.id, name: f.form_name, slug: f.slug }))
      case 'document':
        return documents.map(d => ({ id: d.id, name: d.name, slug: d.slug }))
      default:
        return []
    }
  }

  const destinations = getDestinations()
  const selectedDestination = destinations.find(d => d.id === selectedDestinationId)

  const handleCreate = () => {
    if (!selectedType) return
    
    // Auto-generate name if not provided
    const finalName = linkName || 
      (selectedDestination?.name ? `Link a ${selectedDestination.name}` : 
       linkTypes.find(t => t.value === selectedType)?.label || 'Nuevo Link')
    
    onCreate(
      selectedType, 
      finalName, 
      selectedDestination?.id, 
      selectedDestination?.name,
      selectedDestination?.slug
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="max-w-md w-full rounded-lg p-6"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Crear Nuevo Link
        </h3>

        {/* Link Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Nombre del Link <span className="text-xs">(Opcional)</span>
          </label>
          <input
            type="text"
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            placeholder="Ej: Promoción Verano"
            className="w-full px-3 py-2 rounded-md border"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
            }}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Si no ingresas un nombre, se generará automáticamente
          </p>
        </div>

        {/* Link Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Tipo de Link
          </label>
          <div className="space-y-2">
            {linkTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className="w-full text-left px-3 py-2 rounded-md border transition-colors"
                style={{
                  backgroundColor: selectedType === type.value ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  borderColor: selectedType === type.value ? 'var(--accent-primary)' : 'var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
              >
                <div className="font-medium">{type.label}</div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {type.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Destination ID (for product, form, etc.) */}
        {selectedType && selectedType !== 'reservation' && destinations.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Seleccionar {selectedType === 'product' ? 'Producto' : selectedType === 'form' ? 'Formulario' : selectedType === 'document' ? 'Documento' : 'Destino'}
              <span className="text-xs ml-1">(Opcional)</span>
            </label>
            <select
              value={selectedDestinationId}
              onChange={(e) => setSelectedDestinationId(e.target.value)}
              className="w-full px-3 py-2 rounded-md border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">-- Seleccionar --</option>
              {destinations.map((dest) => (
                <option key={dest.id} value={dest.id}>
                  {dest.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Show message if no destinations available */}
        {selectedType && selectedType !== 'reservation' && destinations.length === 0 && (
          <div className="mb-4 p-3 rounded-md" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No hay {selectedType === 'product' ? 'productos' : selectedType === 'form' ? 'formularios' : 'documentos'} disponibles.
              Crea uno primero para poder enlazarlo.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-md border"
            style={{
              borderColor: 'var(--border-primary)',
              color: 'var(--text-secondary)',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedType}
            className="flex-1 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text-primary)',
            }}
          >
            Crear Link
          </button>
        </div>
      </div>
    </div>
  )
}

// View Link Modal Component
function ViewLinkModal({
  link,
  qrCodeUrl,
  onClose,
  onCopy,
  onDownload,
  copied,
}: {
  link: QuickLink
  qrCodeUrl: string
  onClose: () => void
  onCopy: () => void
  onDownload: () => void
  copied: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="max-w-md w-full rounded-lg p-6"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {link.name}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {link.type}
            </p>
          </div>
          <button onClick={onClose} className="text-2xl" style={{ color: 'var(--text-secondary)' }}>
            ×
          </button>
        </div>

        {/* QR Code */}
        {qrCodeUrl && (
          <div className="flex justify-center mb-4">
            <div
              className="p-4 rounded-lg border-2"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
              }}
            >
              <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
            </div>
          </div>
        )}

        {/* URL */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Enlace:
          </label>
          <div className="flex">
            <input
              type="text"
              value={link.url}
              readOnly
              className="flex-1 px-3 py-2 border rounded-l-md text-sm"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-secondary)',
              }}
            />
            <button
              onClick={onCopy}
              className="px-4 py-2 rounded-r-md transition-colors text-sm font-medium"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--text-primary)',
              }}
            >
              {copied ? '✓ Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onDownload}
            className="flex-1 px-4 py-2 rounded-md border font-medium"
            style={{
              borderColor: 'var(--border-primary)',
              color: 'var(--text-secondary)',
            }}
          >
            Descargar QR
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-md font-medium"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text-primary)',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

