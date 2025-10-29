'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Clock, AlertCircle, RefreshCw } from 'lucide-react'

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <PaymentPendingContent />
    </Suspense>
  )
}

function PaymentPendingContent() {
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(15)

  const orderId = searchParams.get('preference_id') || searchParams.get('external_reference')
  const paymentId = searchParams.get('payment_id')
  const collectionId = searchParams.get('collection_id')

  useEffect(() => {
    // Countdown to auto-close
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          window.close()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleClose = () => {
    window.close()
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div 
        className="max-w-md w-full rounded-2xl shadow-2xl p-8 text-center"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        {/* Pending Icon */}
        <div className="flex justify-center mb-6">
          <div 
            className="rounded-full p-4"
            style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
          >
            <Clock 
              className="w-16 h-16" 
              style={{ color: '#f59e0b' }}
            />
          </div>
        </div>

        {/* Pending Message */}
        <h1 
          className="text-3xl font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Pago Pendiente
        </h1>

        <p 
          className="text-lg mb-6"
          style={{ color: 'var(--text-secondary)' }}
        >
          Tu pago está siendo procesado. Te notificaremos cuando se complete.
        </p>

        {/* Payment Details */}
        {(orderId || paymentId || collectionId) && (
          <div 
            className="mb-6 p-4 rounded-lg text-left"
            style={{ 
              backgroundColor: 'var(--bg-tertiary)',
              borderLeft: '4px solid #f59e0b'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
              <span 
                className="font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Referencia del Pago
              </span>
            </div>
            
            {(orderId || paymentId) && (
              <div className="mb-2">
                <span 
                  className="text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ID de Referencia:
                </span>
                <p 
                  className="text-sm font-mono break-all"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {orderId || paymentId}
                </p>
              </div>
            )}

            {collectionId && (
              <div>
                <span 
                  className="text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ID de Colección:
                </span>
                <p 
                  className="text-sm font-mono break-all"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {collectionId}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info Messages */}
        <div className="space-y-4 mb-8">
          <div 
            className="p-4 rounded-lg text-left"
            style={{ 
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle 
                className="w-5 h-5 flex-shrink-0 mt-0.5" 
                style={{ color: '#3b82f6' }}
              />
              <div>
                <p 
                  className="text-sm font-semibold mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  ¿Qué significa esto?
                </p>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Algunos métodos de pago requieren tiempo adicional para procesar. Esto es normal y no afecta tu compra.
                </p>
              </div>
            </div>
          </div>

          <div 
            className="p-4 rounded-lg text-left"
            style={{ 
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}
          >
            <p 
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              📧 <strong>Te enviaremos un correo</strong> cuando el pago sea confirmado. Puedes cerrar esta ventana de forma segura.
            </p>
          </div>
        </div>

        {/* Auto-close countdown */}
        <p 
          className="text-sm mb-6"
          style={{ color: 'var(--text-muted)' }}
        >
          Esta ventana se cerrará automáticamente en {countdown} segundo{countdown !== 1 ? 's' : ''}
        </p>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
          style={{ 
            backgroundColor: 'var(--accent-secondary)',
            color: 'white'
          }}
        >
          Entendido, Cerrar
        </button>

        {/* Additional Info */}
        <p 
          className="text-xs mt-4"
          style={{ color: 'var(--text-muted)' }}
        >
          Tiempo de procesamiento estimado: 1-3 días hábiles
        </p>
      </div>
    </div>
  )
}

