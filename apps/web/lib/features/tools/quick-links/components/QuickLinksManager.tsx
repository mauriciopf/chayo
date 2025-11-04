'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import QRCode from 'qrcode'
import WhatsAppSetupModal from '@/components/whatsapp/WhatsAppSetupModal'

interface QuickLink {
  id: string
  organization_id: string
  content_type: 'product' | 'form' | 'reservation' | 'document' | 'payment'
  content_id: string
  content_name?: string
  content_description?: string
  slug: string
  full_url: string
  clicks: number
  last_clicked_at?: string
  created_at: string
}

interface QuickLinksManagerProps {
  organizationSlug: string
  organizationId: string
}

export default function QuickLinksManager({ organizationSlug, organizationId }: QuickLinksManagerProps) {
  const [links, setLinks] = useState<QuickLink[]>([])
  const [selectedLink, setSelectedLink] = useState<QuickLink | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [whatsAppConnected, setWhatsAppConnected] = useState(false)

  useEffect(() => {
    loadLinks()
    checkWhatsAppConnection()
  }, [organizationId])

  const checkWhatsAppConnection = async () => {
    try {
      const response = await fetch(`/api/whatsapp/status?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setWhatsAppConnected(data.connected)
      }
    } catch (error) {
      console.error('Error checking WhatsApp connection:', error)
    }
  }

  const loadLinks = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/shareable-links?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setLinks(data.links || [])
      }
    } catch (error) {
      console.error('Error loading links:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      type: 'product',
      icon: '🛍️',
      title: 'Productos',
      description: 'Links auto-generados de productos',
    },
    {
      type: 'form',
      icon: '📋',
      title: 'Formularios',
      description: 'Links auto-generados de formularios',
    },
    {
      type: 'reservation',
      icon: '📅',
      title: 'Reservaciones',
      description: 'Links auto-generados de reservaciones',
    },
    {
      type: 'document',
      icon: '📄',
      title: 'Documentos',
      description: 'Links auto-generados de documentos',
    },
    {
      type: 'payment',
      icon: '💳',
      title: 'Pagos',
      description: 'Links auto-generados de pagos',
    },
  ]

  const handleViewLink = async (link: QuickLink) => {
    setSelectedLink(link)
    // Generate QR code
    try {
      const qr = await QRCode.toDataURL(link.full_url, {
        width: 300,
        margin: 2,
        color: { dark: '#1f2937', light: '#ffffff' },
      })
      setQrCodeUrl(qr)
    } catch (error) {
      console.error('Error generating QR:', error)
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying:', error)
    }
  }

  const handleWhatsApp = (link: string) => {
    if (!whatsAppConnected) {
      setShowWhatsAppModal(true)
      return
    }
    const message = encodeURIComponent(`Hola! 👋 Aquí está el link: ${link}`)
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  const handleDeleteLink = async (id: string) => {
    try {
      const response = await fetch(`/api/shareable-links?linkId=${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setLinks(links.filter(l => l.id !== id))
        setSelectedLink(null)
      }
    } catch (error) {
      console.error('Error deleting link:', error)
    }
  }

  // Get type emoji
  const getTypeEmoji = (type: string) => {
    const action = quickActions.find(a => a.type === type)
    return action?.icon || '🔗'
  }

  // Group links by type
  const groupedLinks = links.reduce((acc, link) => {
    if (!acc[link.content_type]) {
      acc[link.content_type] = []
    }
    acc[link.content_type].push(link)
    return acc
  }, {} as Record<string, QuickLink[]>)

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          🔗 Hub de Enlaces
        </h1>
        <p className="text-lg mb-4" style={{ color: 'var(--text-secondary)' }}>
          Todos tus links auto-generados en un solo lugar
        </p>
        <div className="p-4 rounded-lg border" style={{ 
          backgroundColor: 'var(--bg-tertiary)', 
          borderColor: 'var(--border-primary)' 
        }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            💡 <strong>Los links se generan automáticamente</strong> cuando creas productos, formularios o documentos. 
            No necesitas crearlos manualmente.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="text-3xl font-bold mb-1" style={{ color: 'var(--accent-primary)' }}>
            {links.length}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Links Activos
          </div>
        </div>
        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="text-3xl font-bold mb-1" style={{ color: 'var(--accent-primary)' }}>
            {links.reduce((sum, link) => sum + (link.clicks || 0), 0)}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Clicks Totales
          </div>
        </div>
        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="text-3xl font-bold mb-1" style={{ color: 'var(--accent-primary)' }}>
            {Object.keys(groupedLinks).length}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Tipos de Contenido
          </div>
        </div>
      </div>

      {/* Links List - Grouped by Type */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p style={{ color: 'var(--text-secondary)' }}>Cargando links...</p>
        </div>
      ) : links.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedLinks).map(([type, typeLinks]) => {
            const action = quickActions.find(a => a.type === type)
            return (
              <div key={type}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <span className="text-2xl">{getTypeEmoji(type)}</span>
                  {action?.title || type} ({typeLinks.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {typeLinks.map((link) => (
                    <motion.div
                      key={link.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-lg border transition-all hover:shadow-lg cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-primary)',
                      }}
                      onClick={() => handleViewLink(link)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {link.content_name || 'Sin nombre'}
                          </h3>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                            {link.clicks || 0} clicks • {new Date(link.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Quick Share Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopy(link.full_url)
                          }}
                          className="flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm transition-all hover:scale-105"
                          style={{
                            backgroundColor: copied ? '#10b981' : 'var(--accent-primary)',
                            color: 'white',
                          }}
                          title="Copiar"
                        >
                          <span>{copied ? '✓' : '📋'}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleWhatsApp(link.full_url)
                          }}
                          className="flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm transition-all hover:scale-105"
                          style={{
                            backgroundColor: '#25D366',
                            color: 'white',
                          }}
                          title="WhatsApp"
                        >
                          <span>💬</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 rounded-lg border-2 border-dashed"
          style={{
            borderColor: 'var(--border-primary)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div className="text-6xl mb-4">🔗</div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            No hay links todavía
          </h3>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            Los links se generan automáticamente cuando creas:
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {quickActions.map((action) => (
              <div
                key={action.type}
                className="flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <span className="text-xl">{action.icon}</span>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {action.title}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Removed: Quick Action Modal - links are auto-generated, not manually created */}

      {/* WhatsApp Setup Modal */}
      <WhatsAppSetupModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        organizationId={organizationId}
        onSuccess={() => {
          setWhatsAppConnected(true)
          setShowWhatsAppModal(false)
        }}
      />

      {/* View Link Modal */}
      {selectedLink && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLink(null)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full rounded-2xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getTypeEmoji(selectedLink.content_type)}</span>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {selectedLink.content_name || 'Link'}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedLink(null)}
                  className="text-2xl hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* QR Code */}
              {qrCodeUrl && (
                <div className="flex justify-center">
                  <div className="p-4 rounded-lg border-2" style={{ borderColor: 'var(--border-primary)' }}>
                    <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                  </div>
                </div>
              )}

              {/* URL */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Link:
                </label>
                <div className="p-3 rounded-lg border text-sm break-all"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {selectedLink.full_url}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                    {selectedLink.clicks || 0}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Clicks</div>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="text-sm font-bold" style={{ color: 'var(--accent-primary)' }}>
                    {new Date(selectedLink.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Creado</div>
                </div>
              </div>

              {/* Share Options */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCopy(selectedLink.full_url)}
                  className="px-4 py-3 rounded-lg font-medium transition-all hover:scale-105"
                  style={{
                    backgroundColor: copied ? '#10b981' : 'var(--accent-primary)',
                    color: 'white',
                  }}
                >
                  {copied ? '✓ Copiado' : '📋 Copiar'}
                </button>
                <button
                  onClick={() => handleWhatsApp(selectedLink.full_url)}
                  className="px-4 py-3 rounded-lg font-medium transition-all hover:scale-105"
                  style={{
                    backgroundColor: '#25D366',
                    color: 'white',
                  }}
                >
                  💬 WhatsApp
                </button>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDeleteLink(selectedLink.id)}
                className="w-full px-4 py-2 rounded-lg font-medium border transition-all hover:bg-red-50"
                style={{
                  borderColor: '#ef4444',
                  color: '#ef4444',
                }}
              >
                🗑️ Desactivar Link
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
