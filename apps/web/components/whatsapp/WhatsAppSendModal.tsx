'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface WhatsAppContact {
  id: string
  phone_number: string
  name: string | null
  last_message_at: string
}

interface WhatsAppSendModalProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  linkToSend: string
  toolName: string
}

export default function WhatsAppSendModal({
  isOpen,
  onClose,
  organizationId,
  linkToSend,
  toolName
}: WhatsAppSendModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [contacts, setContacts] = useState<WhatsAppContact[]>([])
  const [customPhone, setCustomPhone] = useState('')
  const [selectedNumberType, setSelectedNumberType] = useState<'saved' | 'custom'>('saved')

  // Fetch customer contacts when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchContacts()
    }
  }, [isOpen, organizationId])

  const fetchContacts = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/whatsapp/contacts?organizationId=${organizationId}`)
      const data = await response.json()

      if (response.ok) {
        setContacts(data.contacts || [])
        // Default to custom if no contacts yet
        if (data.contacts?.length === 0) {
          setSelectedNumberType('custom')
        }
      } else {
        setError(data.error || 'Error al obtener contactos')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // Send WhatsApp message
  const handleSendMessage = async (recipientPhone: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          recipientPhone,
          templateName: 'chayo_tool_link',
          parameters: [linkToSend]
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          onClose()
          setSuccess(false)
        }, 2000)
      } else {
        setError(data.error || 'Error al enviar mensaje')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedNumberType === 'custom') {
      if (!customPhone.trim()) {
        setError('Por favor ingresa un número de teléfono')
        return
      }
      handleSendMessage(customPhone)
    } else {
      setError('Por favor selecciona un número')
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
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
              <span className="text-3xl">💬</span>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Enviar por WhatsApp
              </h3>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Enviar enlace de: <strong>{toolName}</strong>
            </p>
            <div 
              className="text-xs p-2 rounded border overflow-x-auto"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-secondary)'
              }}
            >
              {linkToSend}
            </div>
          </div>

          {/* Number selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Enviar a
            </label>

            {/* Saved contacts option */}
            {contacts.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setSelectedNumberType('saved')}
                  className="w-full text-left p-3 rounded-lg border transition-all"
                  style={{
                    backgroundColor: selectedNumberType === 'saved' ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                    borderColor: selectedNumberType === 'saved' ? 'var(--accent-primary)' : 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👥</span>
                    <div>
                      <div className="font-medium">Contactos guardados</div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {contacts.length} cliente(s) que te han escrito
                      </div>
                    </div>
                  </div>
                </button>

                {selectedNumberType === 'saved' && (
                  <div className="mt-2 space-y-2 pl-4 max-h-60 overflow-y-auto">
                    {contacts.map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => handleSendMessage(contact.phone_number)}
                        disabled={loading}
                        className="w-full text-left p-3 rounded-lg border hover:border-opacity-70 transition-all"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{contact.phone_number}</div>
                            {contact.name && (
                              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {contact.name}
                              </div>
                            )}
                          </div>
                          <span className="text-sm">→</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Custom number option */}
            <button
              type="button"
              onClick={() => setSelectedNumberType('custom')}
              className="w-full text-left p-3 rounded-lg border transition-all"
              style={{
                backgroundColor: selectedNumberType === 'custom' ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                borderColor: selectedNumberType === 'custom' ? 'var(--accent-primary)' : 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">✏️</span>
                <div>
                  <div className="font-medium">Número personalizado</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Ingresa cualquier número
                  </div>
                </div>
              </div>
            </button>

            {selectedNumberType === 'custom' && (
              <div className="pl-4">
                <input
                  type="tel"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder="+57 300 123 4567"
                  className="w-full p-3 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#fee', color: '#c33' }}>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#efe', color: '#3c3' }}>
              <p className="text-sm">✅ Mensaje enviado correctamente</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-3 rounded-lg border transition-all"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            >
              Cancelar
            </button>
            {selectedNumberType === 'custom' && (
              <button
                type="submit"
                disabled={loading || !customPhone.trim()}
                className="flex-1 p-3 rounded-lg transition-all disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white'
                }}
              >
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  )
}

