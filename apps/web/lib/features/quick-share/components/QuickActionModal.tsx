'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'qrcode'
import { supabase } from '@/lib/shared/supabase/client'

interface QuickActionModalProps {
  type: 'product' | 'form' | 'reservation' | 'document' | 'payment'
  organizationSlug: string
  organizationId: string
  onClose: () => void
  onLinkCreated?: (link: string) => void
}

export default function QuickActionModal({
  type,
  organizationSlug,
  organizationId,
  onClose,
  onLinkCreated,
}: QuickActionModalProps) {
  const [items, setItems] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [generatedLink, setGeneratedLink] = useState<string>('')
  const [qrCode, setQrCode] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  const typeConfig = {
    product: { icon: '🛍️', title: 'Producto', table: 'products_list_tool', field: 'name' },
    form: { icon: '📋', title: 'Formulario', table: 'intake_forms', field: 'form_name' },
    reservation: { icon: '📅', title: 'Reservación', table: null, field: null },
    document: { icon: '📄', title: 'Documento', table: 'documents', field: 'name' },
    payment: { icon: '💳', title: 'Pago', table: null, field: null },
  }

  const config = typeConfig[type]

  useEffect(() => {
    if (config.table) {
      fetchItems()
    } else {
      // For reservation and payment, generate link immediately
      generateLink(null)
      setLoading(false)
    }
  }, [])

  const fetchItems = async () => {
    try {
      const { data } = await supabase
        .from(config.table!)
        .select('id, ' + config.field)
        .eq('organization_id', organizationId)
        .order(config.field!)

      setItems(data || [])
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const generateLink = async (item: any | null) => {
    const baseUrl = 'https://chayo.onelink.me/SB63'
    const params = new URLSearchParams({
      deep_link_value: organizationSlug,
      deep_link_sub1: type,
    })

    if (item) {
      const slug = generateSlug(item[config.field!])
      if (type === 'product') params.append('deep_link_sub2', slug)
      if (type === 'form') params.append('deep_link_sub3', slug)
      if (type === 'document') params.append('deep_link_sub4', slug)
    }

    const link = `${baseUrl}?${params.toString()}`
    setGeneratedLink(link)

    // Generate QR Code
    try {
      const qr = await QRCode.toDataURL(link, {
        width: 300,
        margin: 2,
        color: { dark: '#1f2937', light: '#ffffff' },
      })
      setQrCode(qr)
    } catch (error) {
      console.error('Error generating QR:', error)
    }

    if (onLinkCreated) {
      onLinkCreated(link)
    }
  }

  const handleItemSelect = (item: any) => {
    setSelectedItem(item)
    generateLink(item)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying:', error)
    }
  }

  const handleSMS = () => {
    const message = encodeURIComponent(`Hola! 👋 Aquí está el link: ${generatedLink}`)
    window.open(`sms:?body=${message}`, '_blank')
  }

  const handleEmail = () => {
    const subject = encodeURIComponent(`Link a ${config.title}`)
    const body = encodeURIComponent(`Hola! 👋\n\nAquí está el link que te prometí:\n\n${generatedLink}\n\n¡Saludos!`)
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
  }

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hola! 👋 Aquí está el link: ${generatedLink}`)
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          {/* Header */}
          <div className="p-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{config.icon}</div>
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Compartir {config.title}
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Crea tu link en segundos
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-2xl hover:opacity-70 transition-opacity"
                style={{ color: 'var(--text-secondary)' }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
              </div>
            ) : !generatedLink ? (
              <div>
                <p className="mb-4 font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Selecciona {config.title.toLowerCase()}:
                </p>
                <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>
                        No hay {config.title.toLowerCase()}s disponibles
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        Crea uno primero en la sección de configuración
                      </p>
                    </div>
                  ) : (
                    items.map((item) => (
                      <motion.button
                        key={item.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleItemSelect(item)}
                        className="p-4 rounded-lg border text-left transition-all hover:shadow-lg"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderColor: 'var(--border-primary)',
                        }}
                      >
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {item[config.field!]}
                        </p>
                      </motion.button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Success Message */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center"
                >
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    ¡Link Creado!
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {selectedItem ? selectedItem[config.field!] : `Link a ${config.title}`}
                  </p>
                </motion.div>

                {/* QR Code */}
                {qrCode && (
                  <div className="flex justify-center">
                    <div className="p-4 rounded-lg border-2" style={{ borderColor: 'var(--border-primary)' }}>
                      <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                    </div>
                  </div>
                )}

                {/* Link */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Tu Link:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={generatedLink}
                      readOnly
                      className="flex-1 px-4 py-3 rounded-lg border text-sm"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>

                {/* Share Buttons */}
                <div>
                  <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Compartir por:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopy}
                      className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium transition-all"
                      style={{
                        backgroundColor: copied ? '#10b981' : 'var(--accent-primary)',
                        color: 'white',
                      }}
                    >
                      <span className="text-xl">{copied ? '✓' : '📋'}</span>
                      {copied ? '¡Copiado!' : 'Copiar Link'}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSMS}
                      className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium border-2 transition-all"
                      style={{
                        borderColor: 'var(--accent-primary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <span className="text-xl">📱</span>
                      SMS
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleEmail}
                      className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium border-2 transition-all"
                      style={{
                        borderColor: 'var(--accent-primary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <span className="text-xl">📧</span>
                      Email
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleWhatsApp}
                      className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium transition-all"
                      style={{
                        backgroundColor: '#25D366',
                        color: 'white',
                      }}
                    >
                      <span className="text-xl">💬</span>
                      WhatsApp
                    </motion.button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {generatedLink && (
            <div className="p-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 rounded-lg font-medium"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                }}
              >
                Cerrar
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

