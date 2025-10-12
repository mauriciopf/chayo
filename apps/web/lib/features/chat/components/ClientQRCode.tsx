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

            {/* Instructions and Mobile App Download - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
              {/* Instructions */}
              <div 
                className="border rounded-lg p-4"
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

              {/* Mobile App Download Section */}
              <div 
                className="border rounded-lg p-4"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-secondary)'
                }}
              >
                <div className="flex items-center space-x-2 mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--accent-primary)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <h4 
                    className="font-medium text-base"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    📲 ¿Tus clientes no tienen la app?
                  </h4>
                </div>
                <p 
                  className="text-sm mb-3"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Comparte estos enlaces para que descarguen la app móvil de Chayo:
                </p>
                <div className="space-y-2">
                  <a
                    href="https://apps.apple.com/app/chayo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 border"
                    style={{ 
                      backgroundColor: 'var(--bg-primary)', 
                      borderColor: 'var(--border-primary)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-primary)' }}>
                        <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5M13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                          Descargar para iOS
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          App Store
                        </p>
                      </div>
                    </div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.chayo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 border"
                    style={{ 
                      backgroundColor: 'var(--bg-primary)', 
                      borderColor: 'var(--border-primary)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-primary)' }}>
                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                          Descargar para Android
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Google Play
                        </p>
                      </div>
                    </div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                <p 
                  className="text-xs mt-3 text-center"
                  style={{ color: 'var(--text-muted)' }}
                >
                  💡 Compártelos con tu código QR
                </p>
              </div>
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