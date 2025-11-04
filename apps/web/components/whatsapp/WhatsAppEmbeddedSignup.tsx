'use client'

import { useEffect, useState, useRef } from 'react'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface WhatsAppEmbeddedSignupProps {
  organizationId: string
  onSuccess?: (data: { wabaId: string; phoneNumberId: string }) => void
  onError?: (error: string) => void
  buttonText?: string
  buttonClassName?: string
}

interface WhatsAppSessionData {
  phone_number_id: string
  waba_id: string
}

interface FBAuthResponse {
  authResponse?: {
    code: string
  }
}

// Extend Window interface to include FB
declare global {
  interface Window {
    FB?: {
      init: (config: any) => void
      login: (callback: (response: FBAuthResponse) => void, options: any) => void
    }
    fbAsyncInit?: () => void
  }
}

export default function WhatsAppEmbeddedSignup({
  organizationId,
  onSuccess,
  onError,
  buttonText = 'Conectar WhatsApp Business',
  buttonClassName
}: WhatsAppEmbeddedSignupProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sessionData, setSessionData] = useState<WhatsAppSessionData | null>(null)
  const sdkLoadedRef = useRef(false)

  // Facebook App Configuration
  const FB_APP_ID = '1401599064442227'
  const FB_CONFIG_ID = '3069014413284321'

  useEffect(() => {
    // Load Facebook SDK only once
    if (sdkLoadedRef.current) return
    sdkLoadedRef.current = true

    // Set up message event listener for WhatsApp Embedded Signup events
    const handleMessage = (event: MessageEvent) => {
      // Validate origin for security
      if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com') {
        return
      }

      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          console.log('📱 WhatsApp Embedded Signup event:', data)

          if (data.event === 'FINISH') {
            const { phone_number_id, waba_id } = data.data
            console.log('✅ WhatsApp signup finished:', { phone_number_id, waba_id })
            setSessionData({ phone_number_id, waba_id })
          } else if (data.event === 'CANCEL') {
            const { current_step } = data.data
            console.warn('⚠️ WhatsApp signup cancelled at step:', current_step)
            setError(`Registro cancelado en el paso: ${current_step}`)
            setLoading(false)
          } else if (data.event === 'ERROR') {
            const { error_message } = data.data
            console.error('❌ WhatsApp signup error:', error_message)
            setError(error_message || 'Error desconocido durante el registro')
            setLoading(false)
            onError?.(error_message)
          }
        }
      } catch (err) {
        console.log('Non-JSON message received:', event.data)
      }
    }

    window.addEventListener('message', handleMessage)

    // Initialize Facebook SDK
    window.fbAsyncInit = function() {
      if (window.FB) {
        window.FB.init({
          appId: FB_APP_ID,
          autoLogAppEvents: true,
          xfbml: true,
          version: 'v21.0'
        })
        console.log('✅ Facebook SDK initialized')
      }
    }

    // Load Facebook SDK script
    const script = document.createElement('script')
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.async = true
    script.defer = true
    script.crossOrigin = 'anonymous'
    document.body.appendChild(script)

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage)
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [onError])

  // Handle Facebook login callback
  const handleFBLoginCallback = async (response: FBAuthResponse) => {
    console.log('📝 Facebook login response:', response)

    if (response.authResponse) {
      const code = response.authResponse.code
      console.log('🔑 Authorization code received:', code)

      // Send code to backend along with session data
      if (sessionData) {
        try {
          console.log('📤 Sending to backend:', { code, ...sessionData, organizationId })
          
          const backendResponse = await fetch('/api/whatsapp/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code,
              wabaId: sessionData.waba_id,
              phoneNumberId: sessionData.phone_number_id,
              organizationId
            })
          })

          const result = await backendResponse.json()

          if (backendResponse.ok) {
            console.log('✅ WhatsApp Business setup completed:', result)
            setSuccess(true)
            setLoading(false)
            onSuccess?.({ 
              wabaId: sessionData.waba_id, 
              phoneNumberId: sessionData.phone_number_id 
            })
          } else {
            throw new Error(result.error || 'Error al configurar WhatsApp Business')
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
          console.error('❌ Backend error:', errorMsg)
          setError(errorMsg)
          setLoading(false)
          onError?.(errorMsg)
        }
      } else {
        setError('No se recibió información de la sesión de WhatsApp')
        setLoading(false)
      }
    } else {
      setError('No se recibió autorización de Facebook')
      setLoading(false)
    }
  }

  // Launch WhatsApp signup flow
  const launchWhatsAppSignup = () => {
    if (!window.FB) {
      setError('SDK de Facebook no está cargado. Por favor recarga la página.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)
    setSessionData(null)

    console.log('🚀 Launching WhatsApp Embedded Signup...')

    window.FB.login(handleFBLoginCallback, {
      config_id: FB_CONFIG_ID,
      response_type: 'code',
      override_default_response_type: true,
      extras: { version: 'v3' }
    })
  }

  return (
    <div className="space-y-4">
      {/* Status Messages */}
      {error && (
        <div 
          className="p-4 rounded-lg border-l-4 flex gap-3"
          style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: '#ef4444'
          }}
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
          <div className="flex-1">
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Error de Conexión
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {error}
            </p>
          </div>
        </div>
      )}

      {success && (
        <div 
          className="p-4 rounded-lg border-l-4 flex gap-3"
          style={{ 
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderColor: '#22c55e'
          }}
        >
          <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
          <div className="flex-1">
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              ¡Conectado Exitosamente!
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Tu cuenta de WhatsApp Business está conectada y lista para usar.
            </p>
          </div>
        </div>
      )}

      {/* Signup Button */}
      <button
        onClick={launchWhatsAppSignup}
        disabled={loading || success}
        className={buttonClassName || "w-full px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"}
        style={{
          backgroundColor: success ? '#22c55e' : '#25D366',
          color: 'white',
        }}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Conectando...</span>
          </>
        ) : success ? (
          <>
            <CheckCircle className="h-5 w-5" />
            <span>Conectado</span>
          </>
        ) : (
          <>
            <span>💬</span>
            <span>{buttonText}</span>
          </>
        )}
      </button>

      {/* Info Box */}
      {!success && (
        <div 
          className="p-4 rounded-lg border text-sm"
          style={{ 
            backgroundColor: 'var(--bg-tertiary)', 
            borderColor: 'var(--border-primary)',
            color: 'var(--text-secondary)'
          }}
        >
          <p className="mb-2">
            <strong>¿Qué sucederá al conectar?</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Se abrirá una ventana para autenticarte con Facebook</li>
            <li>Seleccionarás o crearás tu cuenta de WhatsApp Business</li>
            <li>Configurarás tu número de teléfono de negocio</li>
            <li>Podrás enviar mensajes automáticamente desde Chayo</li>
          </ul>
        </div>
      )}
    </div>
  )
}


