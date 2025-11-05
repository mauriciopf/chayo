'use client'

import { motion } from 'framer-motion'
import WhatsAppEmbeddedSignup from './WhatsAppEmbeddedSignup'

interface WhatsAppSetupModalProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  onSuccess?: (data: { wabaId: string; phoneNumberId: string }) => void
}

export default function WhatsAppSetupModal({
  isOpen,
  onClose,
  organizationId,
  onSuccess
}: WhatsAppSetupModalProps) {
  if (!isOpen) return null

  const handleSuccess = async (data: { wabaId: string; phoneNumberId: string }) => {
    console.log('WhatsApp connected successfully:', data)
    
    // Template will be created by webhook (PARTNER_APP_INSTALLED)
    // Status will be PENDING for ~24 hours
    // User will be redirected to fallback modal (wa.me link)
    
    onSuccess?.(data)
  }

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
                Conectar WhatsApp Business
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
        <div className="p-6">
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Conecta tu cuenta de WhatsApp Business para enviar links directamente a tus clientes.
          </p>

          <WhatsAppEmbeddedSignup
            organizationId={organizationId}
            onSuccess={handleSuccess}
            onError={(error) => {
              console.error('WhatsApp connection error:', error)
            }}
          />
        </div>
      </motion.div>
    </div>
  )
}
