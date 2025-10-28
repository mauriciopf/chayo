'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, ArrowLeft, Receipt } from 'lucide-react'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

  // Get payment details from URL params (if providers send them)
  const orderId = searchParams.get('token') || searchParams.get('order_id')
  const paymentId = searchParams.get('paymentId')
  const payerId = searchParams.get('PayerID')

  useEffect(() => {
    // Countdown to auto-redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          window.close() // Close the payment window
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
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div 
            className="rounded-full p-4"
            style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
          >
            <CheckCircle 
              className="w-16 h-16" 
              style={{ color: '#22c55e' }}
            />
          </div>
        </div>

        {/* Success Message */}
        <h1 
          className="text-3xl font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          ¡Pago Exitoso!
        </h1>

        <p 
          className="text-lg mb-6"
          style={{ color: 'var(--text-secondary)' }}
        >
          Tu pago ha sido procesado correctamente. Gracias por tu compra.
        </p>

        {/* Payment Details */}
        {(orderId || paymentId) && (
          <div 
            className="mb-8 p-4 rounded-lg text-left"
            style={{ 
              backgroundColor: 'var(--bg-tertiary)',
              borderLeft: '4px solid #22c55e'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Receipt className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
              <span 
                className="font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Detalles del Pago
              </span>
            </div>
            
            {orderId && (
              <div className="mb-2">
                <span 
                  className="text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ID de Orden:
                </span>
                <p 
                  className="text-sm font-mono break-all"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {orderId}
                </p>
              </div>
            )}
            
            {paymentId && (
              <div>
                <span 
                  className="text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ID de Pago:
                </span>
                <p 
                  className="text-sm font-mono break-all"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {paymentId}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info Message */}
        <div 
          className="mb-6 p-4 rounded-lg"
          style={{ 
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }}
        >
          <p 
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Recibirás un correo de confirmación con los detalles de tu compra.
          </p>
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
          Cerrar
        </button>
      </div>
    </div>
  )
}

