import React, { useState } from "react"
import { useTranslations } from 'next-intl'
import { formatTime } from '@/lib/shared/utils/time'
import { Calendar, FileText, CreditCard, ClipboardList } from 'lucide-react'

interface ChatMessageProps {
  role: "user" | "ai" | "system"
  content: string
  timestamp?: Date
  appointmentLink?: string
  documentSigningLink?: string
  paymentAvailable?: boolean
  paymentType?: 'dynamic' | 'manual_price_id' | 'custom_ui'
  intakeFormAvailable?: boolean
  intakeFormId?: string
  intakeFormName?: string
  isToolSuggestion?: boolean
  toolName?: string
}

// PaymentButton component for handling different payment types
function PaymentButton({ paymentType }: { paymentType: 'dynamic' | 'manual_price_id' | 'custom_ui' }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAmountInput, setShowAmountInput] = useState(false)

  const handlePayment = async () => {
    if (paymentType === 'dynamic' && !amount) {
      setShowAmountInput(true)
      return
    }

    setLoading(true)
    try {
      // Get organization ID from URL path
      const pathParts = window.location.pathname.split('/')
      const businessSlug = pathParts[pathParts.length - 1]
      
      // Get organization by slug - we'll need to create this endpoint or modify existing one
      const orgResponse = await fetch(`/api/organizations?slug=${businessSlug}`)
      if (!orgResponse.ok) {
        throw new Error('Organization not found')
      }
      
      const orgData = await orgResponse.json()
      const organizationId = orgData.organization?.id

      if (!organizationId) {
        throw new Error('Organization ID not found')
      }

      // Create payment link
      const paymentData: any = {
        organizationId
      }

      if (paymentType === 'dynamic') {
        paymentData.amount = parseFloat(amount)
      }

      const response = await fetch('/api/payments/create-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create payment link')
      }

      const result = await response.json()
      
      // Redirect to payment URL
      window.location.href = result.paymentUrl

    } catch (error) {
      console.error('Payment error:', error)
      alert(error instanceof Error ? error.message : 'Error processing payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3">
      {paymentType === 'dynamic' && showAmountInput && !loading && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-zinc-200 mb-2">
            Ingresa el monto a pagar:
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="flex">
                <span className="inline-flex items-center px-3 py-2 border border-r-0 border-zinc-600/40 bg-zinc-700/70 text-zinc-300 text-sm rounded-l-md backdrop-blur-sm">
                  $
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="flex-1 px-3 py-2 border border-zinc-600/40 bg-zinc-700/70 text-zinc-100 rounded-r-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] placeholder-zinc-400 backdrop-blur-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      <button
        onClick={handlePayment}
        disabled={loading || (paymentType === 'dynamic' && showAmountInput && !amount)}
        className="inline-flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-base font-medium rounded-lg transition-colors touch-manipulation min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Procesando...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            {paymentType === 'dynamic' && showAmountInput ? 
              (amount ? `💳 Pagar $${amount}` : 'Ingresa monto') : 
              '💳 Realizar Pago'
            }
          </>
        )}
      </button>
    </div>
  )
}

export default function ChatMessage({ role, content, timestamp, appointmentLink, documentSigningLink, paymentAvailable, paymentType, intakeFormAvailable, intakeFormId, intakeFormName, isToolSuggestion, toolName }: ChatMessageProps) {
  const t = useTranslations('chat')

  // Safeguard: Check if the content contains raw multiple choice data and clean it
  const cleanContent = (() => {
    if (role === 'ai' && content.includes('OPTIONS:') && content.includes('MULTIPLE:')) {
      // Remove the raw formatting if it somehow got through
      return content
        .replace(/OPTIONS:\s*.+?(?=\n|MULTIPLE:|OTHER:|$)/gi, '')
        .replace(/MULTIPLE:\s*(true|false)/gi, '')
        .replace(/OTHER:\s*(true|false)/gi, '')
        .replace(/\n\s*\n/g, '\n')
        .trim() || "Please select an option:"
    }
    return content
  })()

  if (role === "system") {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-zinc-700/60 text-zinc-300 text-xs px-3 py-1 rounded-full backdrop-blur-sm">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="w-full px-4">
        <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`flex ${role === "user" ? "flex-row-reverse" : "flex-row"} items-start gap-3 max-w-[75%]`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              role === "user" 
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" 
                : "bg-gradient-to-r from-green-500 to-blue-500 text-white"
            }`}>
              {role === "user" ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              )}
            </div>

            {/* Message Content - Mobile Optimized */}
            <div className="flex-1 min-w-0">
              <div 
                className={`${role === "user" ? "rounded-2xl" : ""} px-4 py-3`}
                style={{
                  backgroundColor: role === "user" ? '#374151' : 'transparent', // Dark gray similar to screenshot
                  color: role === "user" ? 'white' : 'var(--text-primary)'
                }}>
                {isToolSuggestion && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💡</span>
                    <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Tool Suggestion</span>
                  </div>
                )}
                <div className={`text-lg whitespace-pre-wrap break-words ${
                  role === "user" ? "" : "border-l-2 pl-3"
                }`} 
                     style={{ 
                       borderColor: role === "user" ? 'transparent' : 'rgba(156, 163, 175, 0.3)'
                     }}>
                  {cleanContent}
                </div>
                
                {/* Reservation Button - Mobile Optimized */}
                {appointmentLink && (
                  <div className="mt-3">
                    <a
                      href={appointmentLink}
                      className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-base font-medium rounded-lg transition-colors touch-manipulation min-h-[44px]"
                    >
                      <Calendar className="w-5 h-5" />
                      📱 Reservar
                    </a>
                  </div>
                )}

                {/* Document Signing Button - Mobile Optimized */}
                {documentSigningLink && (
                  <div className="mt-3">
                    <a
                      href={documentSigningLink}
                      className="inline-flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-base font-medium rounded-lg transition-colors touch-manipulation min-h-[44px]"
                    >
                      <FileText className="w-5 h-5" />
                      📝 Firmar Documento
                    </a>
                  </div>
                )}

                {/* Payment Button - Mobile Optimized */}
                {paymentAvailable && (
                  <PaymentButton paymentType={paymentType || 'custom_ui'} />
                )}

                {/* Intake Form Button - Mobile Optimized */}
                {intakeFormAvailable && intakeFormId && (
                  <div className="mt-3">
                    <a
                      href={`/fill-form/${intakeFormId}`}
                      className="inline-flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-base font-medium rounded-lg transition-colors touch-manipulation min-h-[44px]"
                    >
                      <ClipboardList className="w-5 h-5" />
                      📋 Llenar Formulario
                    </a>
                  </div>
                )}
              </div>
              {timestamp && (
                <div className={`text-xs mt-2 px-1 ${
                  role === "user" ? "text-right" : "text-left"
                }`} style={{ color: 'var(--text-muted)' }}>
                  {formatTime(timestamp)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 