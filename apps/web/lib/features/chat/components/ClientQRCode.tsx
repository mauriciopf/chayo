'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { motion } from 'framer-motion'

interface ClientQRCodeProps {
  organizationSlug: string
  isOnboardingCompleted?: boolean
}

export default function ClientQRCode({ organizationSlug, isOnboardingCompleted = false }: ClientQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [clientChatUrl, setClientChatUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (organizationSlug) {
      // Generate mobile app deep link for business
      const chatUrl = `chayo://business/${organizationSlug}`
      setClientChatUrl(chatUrl)
      // Generate QR code with better error handling
      QRCode.toDataURL(chatUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1f2937', // gray-800
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      }).then(url => {
        setQrCodeUrl(url)
      }).catch(err => {
        // Fallback: create a simple placeholder
        setQrCodeUrl('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSJ3aGl0ZSIvPgo8dGV4dCB4PSIxMjgiIHk9IjEyOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iYmxhY2siPk5vIFFSPC90ZXh0Pgo8L3N2Zz4K')
      })
    }
  }, [organizationSlug])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(clientChatUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Chatea con tu negocio` ,
          text: `Chatea directamente con nuestro asistente IA` ,
          url: clientChatUrl
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      // Fallback to copy
      copyToClipboard()
    }
  }

  const downloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a')
      link.download = `business-qr-code.png`
      link.href = qrCodeUrl
      link.click()
    }
  }

  if (!organizationSlug) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-xl shadow-lg border p-6"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-primary)'
      }}
    >
      <div className="text-center">
        <h3 
          className="text-xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          🎯 Código QR para Clientes
        </h3>
        <p 
          className="mb-4 text-base"
          style={{ color: 'var(--text-secondary)' }}
        >
          Este código abre tu negocio directamente en la app móvil de Chayo. Tus clientes pueden:
        </p>
        <ul 
          className="mb-6 space-y-2 text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          <li className="flex items-start">
            <span className="mr-2">📱</span>
            <span>Escanear el QR y acceder instantáneamente a tu negocio en la app</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">💬</span>
            <span>Chatear con tu asistente IA personalizada, hacer citas, ver productos y más</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">🔄</span>
            <span>La app recordará tu negocio - cada vez que la abran, verán tu información</span>
          </li>
        </ul>

        {/* Setup Status Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span 
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              Estado de Configuración del Negocio
            </span>
            <span 
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              {isOnboardingCompleted ? 'Completo' : 'En Progreso'}
            </span>
          </div>
          <div 
            className="mt-2 text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            {isOnboardingCompleted ? (
              <span className="font-medium" style={{ color: '#22c55e' }}>✅ ¡El código QR está listo para compartir!</span>
            ) : (
              <span style={{ color: '#f59e0b' }}>⚙️ Configuración en progreso</span>
            )}
          </div>
        </div>

        {qrCodeUrl && isOnboardingCompleted ? (
          <div className="flex flex-col items-center space-y-4">
            {/* QR Code */}
            <div 
              className="p-4 rounded-lg border-2"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <img 
                src={qrCodeUrl} 
                alt="Client Chat QR Code"
                className="w-48 h-48"
              />
            </div>

            {/* URL Display */}
            <div className="w-full max-w-md">
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Enlace Directo de Chat:
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={clientChatUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-l-md text-sm"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-secondary)'
                  }}
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 rounded-r-md transition-colors text-sm font-medium"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
                >
                  {copied ? '✓ ¡Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={shareQR}
                className="flex items-center px-4 py-2 rounded-lg transition-colors font-medium"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--text-primary)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
              >
                📱 Compartir Código QR
              </button>
              <button
                onClick={downloadQR}
                className="flex items-center px-4 py-2 rounded-lg transition-colors font-medium"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--text-primary)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
              >
                💾 Descargar QR
              </button>
            </div>

            {/* Instructions */}
            <div 
              className="border rounded-lg p-4 max-w-md"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <h4 
                className="font-medium mb-3"
                style={{ color: 'var(--text-primary)' }}
              >📋 Cómo usar:</h4>
              <ul 
                className="text-sm space-y-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                <li className="flex items-start">
                  <span className="mr-2 font-bold">1.</span>
                  <span>Imprime el QR y colócalo en tu negocio (mostrador, entrada, mesas)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 font-bold">2.</span>
                  <span>Comparte el enlace por WhatsApp, Instagram o redes sociales</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 font-bold">3.</span>
                  <span>Los clientes escanean con su cámara y se abre la app de Chayo</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 font-bold">4.</span>
                  <span>Acceso instantáneo a tu negocio - sin necesidad de buscar o registrarse</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-yellow-600 mb-3">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h4 className="font-medium text-yellow-900 mb-2">Código QR Aún No Disponible</h4>
              <p className="text-sm text-yellow-800">
                Completa la configuración de tu negocio para desbloquear el código QR. Finaliza el proceso de incorporación para continuar.
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
} 