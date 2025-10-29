'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react'

export default function PaymentCancelledPage() {
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(10)

  const orderId = searchParams.get('token') || searchParams.get('order_id')

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

  const handleRetry = () => {
    // Go back to previous page (payment link)
    window.history.back()
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
        {/* Cancel Icon */}
        <div className="flex justify-center mb-6">
          <div 
            className="rounded-full p-4"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
          >
            <XCircle 
              className="w-16 h-16" 
              style={{ color: '#ef4444' }}
            />
          </div>
        </div>

        {/* Cancel Message */}
        <h1 
          className="text-3xl font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Pago Cancelado
        </h1>

        <p 
          className="text-lg mb-6"
          style={{ color: 'var(--text-secondary)' }}
        >
          Has cancelado el proceso de pago. No se ha realizado ningún cargo.
        </p>

        {/* Info Message */}
        <div 
          className="mb-8 p-4 rounded-lg text-left"
          style={{ 
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}
        >
          <div className="flex items-start gap-3">
            <HelpCircle 
              className="w-5 h-5 flex-shrink-0 mt-0.5" 
              style={{ color: '#f59e0b' }}
            />
            <div>
              <p 
                className="text-sm font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                ¿Necesitas ayuda?
              </p>
              <p 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Si tuviste algún problema con el pago, puedes intentar nuevamente o contactar con soporte.
              </p>
            </div>
          </div>
        </div>

        {/* Auto-close countdown */}
        <p 
          className="text-sm mb-6"
          style={{ color: 'var(--text-muted)' }}
        >
          Esta ventana se cerrará automáticamente en {countdown} segundo{countdown !== 1 ? 's' : ''}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
            style={{ 
              backgroundColor: 'var(--accent-secondary)',
              color: 'white'
            }}
          >
            Intentar Nuevamente
          </button>

          <button
            onClick={handleClose}
            className="w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200"
            style={{ 
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

