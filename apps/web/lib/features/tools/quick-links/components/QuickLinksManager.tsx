'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import QRCode from 'qrcode'
import { supabase } from '@/lib/shared/supabase/client'
import QuickActionModal from '@/lib/features/quick-share/components/QuickActionModal'

interface QuickLink {
  id: string
  name: string
  type: 'product' | 'form' | 'reservation' | 'document' | 'payment'
  url: string
  destinationId?: string
  destinationName?: string
  destinationSlug?: string
  createdAt: string
  clicks?: number
}

interface QuickLinksManagerProps {
  organizationSlug: string
  organizationId: string
}

export default function QuickLinksManager({ organizationSlug, organizationId }: QuickLinksManagerProps) {
  const [links, setLinks] = useState<QuickLink[]>([])
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedLink, setSelectedLink] = useState<QuickLink | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const quickActions = [
    {
      type: 'product',
      icon: '🛍️',
      title: 'Producto',
      description: 'Link a un producto específico',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      type: 'form',
      icon: '📋',
      title: 'Formulario',
      description: 'Formulario de admisión',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      type: 'reservation',
      icon: '📅',
      title: 'Reservación',
      description: 'Calendario de reservaciones',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      type: 'document',
      icon: '📄',
      title: 'Documento',
      description: 'Compartir documento',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      type: 'payment',
      icon: '💳',
      title: 'Pago',
      description: 'Link de pago directo',
      gradient: 'from-orange-500 to-red-500'
    },
  ]

  const handleLinkCreated = (type: string, url: string, destinationName?: string) => {
    const newLink: QuickLink = {
      id: Date.now().toString(),
      name: destinationName || `Link a ${type}`,
      type: type as any,
      url,
      createdAt: new Date().toISOString(),
      clicks: 0,
    }
    setLinks([newLink, ...links])
    setSelectedType(null)
  }

  const handleViewLink = async (link: QuickLink) => {
    setSelectedLink(link)
    // Generate QR code
    try {
      const qr = await QRCode.toDataURL(link.url, {
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

  const handleSMS = (link: string) => {
    const message = encodeURIComponent(`Hola! 👋 Aquí está el link: ${link}`)
    window.open(`sms:?body=${message}`, '_blank')
  }

  const handleEmail = (link: string, name: string) => {
    const subject = encodeURIComponent(`Link: ${name}`)
    const body = encodeURIComponent(`Hola! 👋\n\nAquí está el link que te prometí:\n\n${link}\n\n¡Saludos!`)
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
  }

  const handleWhatsApp = (link: string) => {
    const message = encodeURIComponent(`Hola! 👋 Aquí está el link: ${link}`)
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  const handleDeleteLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id))
    setSelectedLink(null)
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          🔗 Links Rápidos
        </h1>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          Crea links personalizados y compártelos por SMS, Email o WhatsApp
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Crear Nuevo Link
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedType(action.type)}
              className="group relative overflow-hidden rounded-xl p-6 transition-all hover:scale-105 hover:shadow-xl"
              style={{
                background: `linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)`,
                border: '1px solid var(--border-primary)',
              }}
            >
              {/* Gradient Overlay on Hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
              />
              
              <div className="relative z-10 text-center">
                <div className="text-3xl mb-2">{action.icon}</div>
                <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
                  {action.title}
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {action.description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Links List */}
      {links.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Mis Links ({links.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {links.map((link) => {
              const action = quickActions.find(a => a.type === link.type)
              return (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-lg border transition-all hover:shadow-lg"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-primary)',
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{action?.icon}</span>
                      <div>
                        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {link.name}
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                          {link.clicks || 0} clicks
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Share Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleCopy(link.url)}
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
                      onClick={() => handleSMS(link.url)}
                      className="flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm border transition-all hover:scale-105"
                      style={{
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)',
                      }}
                      title="SMS"
                    >
                      <span>📱</span>
                    </button>
                    <button
                      onClick={() => handleEmail(link.url, link.name)}
                      className="flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm border transition-all hover:scale-105"
                      style={{
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)',
                      }}
                      title="Email"
                    >
                      <span>📧</span>
                    </button>
                    <button
                      onClick={() => handleViewLink(link)}
                      className="flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm border transition-all hover:scale-105"
                      style={{
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)',
                      }}
                      title="Ver más"
                    >
                      <span>👁️</span>
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {links.length === 0 && (
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
            No has creado links todavía
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Selecciona un tipo arriba para crear tu primer link
          </p>
        </motion.div>
      )}

      {/* Quick Action Modal */}
      {selectedType && (
        <QuickActionModal
          type={selectedType as any}
          organizationSlug={organizationSlug}
          organizationId={organizationId}
          onClose={() => setSelectedType(null)}
          onLinkCreated={(url) => {
            const action = quickActions.find(a => a.type === selectedType)
            handleLinkCreated(selectedType, url, action?.title)
          }}
        />
      )}

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
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {selectedLink.name}
                </h3>
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
                  {selectedLink.url}
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
                  <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                    {new Date(selectedLink.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Creado</div>
                </div>
              </div>

              {/* Share Options */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCopy(selectedLink.url)}
                  className="px-4 py-3 rounded-lg font-medium transition-all hover:scale-105"
                  style={{
                    backgroundColor: copied ? '#10b981' : 'var(--accent-primary)',
                    color: 'white',
                  }}
                >
                  {copied ? '✓ Copiado' : '📋 Copiar'}
                </button>
                <button
                  onClick={() => handleWhatsApp(selectedLink.url)}
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
                🗑️ Eliminar Link
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
