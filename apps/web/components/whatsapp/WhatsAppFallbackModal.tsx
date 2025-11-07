'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface WhatsAppFallbackModalProps {
  isOpen: boolean
  onClose: () => void
  linkToSend: string
  toolName: string
  templateStatus: 'pending' | 'not_approved'
  organizationId?: string
  onSwitchAccount?: () => void
}

export default function WhatsAppFallbackModal({
  isOpen,
  onClose,
  linkToSend,
  toolName,
  templateStatus,
  organizationId,
  onSwitchAccount
}: WhatsAppFallbackModalProps) {
  if (!isOpen) return null
  
  const [disconnecting, setDisconnecting] = useState(false)
  
  const handleSwitchAccount = async () => {
    if (!organizationId) return
    
    const confirmed = window.confirm(
      '¿Estás seguro de que quieres desconectar la cuenta actual de WhatsApp Business? Podrás conectar una cuenta diferente después.'
    )
    
    if (!confirmed) return
    
    setDisconnecting(true)
    try {
      const response = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId })
      })
      
      if (response.ok) {
        // Success - trigger account switch flow
        onSwitchAccount?.()
      } else {
        const error = await response.json()
        alert(`Error al desconectar: ${error.error}`)
      }
    } catch (error) {
      console.error('Error disconnecting WABA:', error)
      alert('Error al desconectar la cuenta de WhatsApp Business')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleSendViaWhatsApp = () => {
    // Use WhatsApp's direct link API (doesn't require templates or approval)
    // Opens WhatsApp with pre-filled message
    const message = `Hola! 👋\n\nAquí está el enlace de ${toolName} que solicitaste:\n\n${linkToSend}\n\n¿Necesitas ayuda? Responde a este mensaje y te atenderemos.\n\nGracias,\nEquipo Chayo`
    const encodedMessage = encodeURIComponent(message)
    
    // Open WhatsApp with pre-filled text
    window.open(`https://api.whatsapp.com/send/?text=${encodedMessage}`, '_blank')
    
    // Close modal after opening WhatsApp
    setTimeout(() => {
      onClose()
    }, 500)
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
                Compartir por WhatsApp
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
        <div className="p-6 space-y-4">
          {/* Tool info */}
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

          {/* Template status notice */}
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)'
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <h4 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {templateStatus === 'pending' ? 'Plantilla en revisión' : 'Plantilla no disponible'}
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {templateStatus === 'pending' 
                    ? 'Tu plantilla de WhatsApp Business está siendo revisada por Meta. Este proceso puede tomar hasta 24 horas.'
                    : 'La plantilla de WhatsApp Business no está aprobada aún.'
                  }
                </p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  <strong>Mientras tanto:</strong> Puedes compartir el enlace usando WhatsApp directamente.
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <strong>Cómo funciona:</strong>
            </p>
            <ol className="text-sm mt-2 space-y-1 list-decimal list-inside" style={{ color: 'var(--text-secondary)' }}>
              <li>Se abrirá WhatsApp con el mensaje pre-escrito</li>
              <li>Selecciona el contacto o grupo</li>
              <li>Envía el mensaje</li>
            </ol>
          </div>

          {/* Action button */}
          <button
            onClick={handleSendViaWhatsApp}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-lg transition-all"
            style={{
              backgroundColor: '#25D366', // WhatsApp green
              color: 'white'
            }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            <span className="font-semibold">Abrir WhatsApp</span>
          </button>

          {/* Cancel button */}
          <button
            onClick={onClose}
            className="w-full p-3 rounded-lg border transition-all"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)'
            }}
          >
            Cancelar
          </button>
          
          {/* Switch account button */}
          {organizationId && onSwitchAccount && (
            <button
              onClick={handleSwitchAccount}
              disabled={disconnecting}
              className="w-full p-2 text-sm rounded-lg transition-all hover:opacity-80"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                textDecoration: 'underline'
              }}
            >
              {disconnecting ? 'Desconectando...' : '🔄 Conectar a otro negocio'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

