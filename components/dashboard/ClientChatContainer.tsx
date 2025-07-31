'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatMessage from './ChatMessage'
import { Message, Agent, Organization } from './types'
import { supabase } from '@/lib/supabase/client'

interface ClientChatContainerProps {
  agent: Agent
  organization: Organization
  locale?: string
  className?: string
}

export default function ClientChatContainer({ agent, organization, locale = 'en', className = '' }: ClientChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [anonymousUser, setAnonymousUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatScrollContainerRef = useRef<HTMLDivElement>(null)

  // Setup anonymous session for document signing persistence
  const setupAnonymousSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // No session - create anonymous one that persists in localStorage
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) {
          console.error('Error creating anonymous session:', error)
        } else if (data.user) {
          setAnonymousUser(data.user)
          console.log('Created persistent anonymous session:', data.user.id)
        }
      } else {
        // Already have a session (persisted from localStorage)
        setAnonymousUser(user)
        console.log('Using existing anonymous session:', user.id)
      }
    } catch (error) {
      console.error('Error setting up anonymous session:', error)
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initial greeting message with service options
  useEffect(() => {
    const initializeMessages = async () => {
      // Setup anonymous session for client chat persistence
      await setupAnonymousSession()
      
      if (agent && organization) {
        const welcomeMessage: Message = {
          id: 'welcome',
          content: `¡Hola! Soy Chayo, tu asistente digital para ${organization.name}. ¿En qué puedo ayudarte hoy?`,
          role: 'ai',
          timestamp: new Date()
        }
        
        const initialMessages: Message[] = [welcomeMessage]

        // Check if agent tools are enabled
        try {
          const response = await fetch(`/api/organizations/${organization.id}/agent-tools`)
          if (response.ok) {
            const agentTools = await response.json()
            
            // Add appointment message if appointments tool is enabled
            if (agentTools.appointments) {
              try {
                // Fetch appointment settings to determine provider
                const appointmentResponse = await fetch(`/api/organizations/${organization.id}/appointment-settings`)
                let appointmentLink = `http://localhost:3000/${locale}/book-appointment/${organization.slug}` // default fallback
                let appointmentContent = `📅 **Agendar una cita**\n\n¿Necesitas agendar una cita? Haz clic en el botón de abajo para ver nuestro calendario disponible y reservar tu horario.`

                if (appointmentResponse.ok) {
                  const appointmentData = await appointmentResponse.json()
                  const settings = appointmentData.settings

                  if (settings) {
                    switch (settings.provider) {
                      case 'calendly':
                        appointmentLink = `http://localhost:3000/${locale}/appointment/calendly/${organization.slug}`
                        appointmentContent = `📅 **Agendar una cita**\n\n¿Necesitas agendar una cita? Usa nuestro sistema de reservas integrado con Calendly.`
                        break
                      case 'vagaro':
                      case 'square':
                        appointmentLink = settings.provider_url || appointmentLink
                        appointmentContent = `📅 **Agendar una cita**\n\n¿Necesitas agendar una cita? Haz clic en el botón de abajo para acceder a nuestro sistema de reservas.`
                        break
                      case 'custom':
                      default:
                        appointmentContent = `📅 **Agendar una cita**\n\n¿Necesitas agendar una cita? Usa nuestro sistema de reservas Chayo Appointments - fácil, rápido y sin complicaciones.`
                        break
                    }
                  }
                }

                const appointmentMessage: Message = {
                  id: 'appointment-option',
                  content: appointmentContent,
                  role: 'ai',
                  timestamp: new Date(),
                  appointmentLink: appointmentLink
                }
                initialMessages.push(appointmentMessage)
              } catch (error) {
                console.error('Error fetching appointment settings:', error)
                // Fallback to default appointment message
                const appointmentMessage: Message = {
                  id: 'appointment-option',
                  content: `📅 **Agendar una cita**\n\n¿Necesitas agendar una cita? Haz clic en el botón de abajo para ver nuestro calendario disponible y reservar tu horario.`,
                  role: 'ai',
                  timestamp: new Date(),
                  appointmentLink: `http://localhost:3000/${locale}/book-appointment/${organization.slug}`
                }
                initialMessages.push(appointmentMessage)
              }
            }

            // Add document signing message if documents tool is enabled and there are active documents
            if (agentTools.documents && anonymousUser) {
              try {
                // Fetch available documents
                const documentsResponse = await fetch(`/api/organizations/${organization.id}/agent-documents/upload`)
                if (documentsResponse.ok) {
                  const documentsData = await documentsResponse.json()
                  const documents = documentsData.documents || []
                  
                  // Show all active documents (documents are always available for signing now)
                  const activeDocuments = documents.filter((doc: any) => doc.status === 'active')
                  
                  if (activeDocuments.length > 0) {
                    // Check if current anonymous user has already signed this document
                    const activeDocument = activeDocuments[0]
                    
                    // Check for existing signature by this anonymous user
                    const { data: existingSignature } = await supabase
                      .from('document_signatures')
                      .select('id')
                      .eq('document_id', activeDocument.id)
                      .eq('anonymous_user_id', anonymousUser.id)
                      .single()
                    
                    // Only show document option if this anonymous user hasn't signed yet
                    if (!existingSignature) {
                      const documentMessage: Message = {
                        id: 'document-option',
                        content: `📝 **Firmar documento**\n\n¿Necesitas firmar el documento "${activeDocument.file_name}"? Haz clic en el botón de abajo para acceder al proceso de firma.`,
                        role: 'ai',
                        timestamp: new Date(),
                        documentSigningLink: activeDocument.signing_url
                      }
                      initialMessages.push(documentMessage)
                    } else {
                      console.log('Document already signed by this anonymous user - hiding option')
                    }
                  }
                  // Note: Documents are hidden if already signed by this anonymous session
                }
              } catch (error) {
                console.error('Error fetching documents:', error)
                // Don't show document option if there's an error
              }
            }

            // Add payment message if payments tool is enabled
            if (agentTools.payments) {
              try {
                // Fetch Stripe settings to check if payments are configured
                const stripeResponse = await fetch(`/api/organizations/${organization.id}/stripe-settings`)
                if (stripeResponse.ok) {
                  const stripeData = await stripeResponse.json()
                  
                  if (stripeData.settings && stripeData.settings.stripe_user_id) {
                    let paymentContent = `💳 **Realizar un pago**\n\n¿Necesitas realizar un pago?`
                    
                    // Customize message based on payment type
                    switch (stripeData.settings.payment_type) {
                      case 'dynamic':
                        paymentContent += ` Puedes ingresar el monto que desees pagar. Haz clic en el botón de abajo para proceder.`
                        break
                      case 'manual_price_id':
                        paymentContent += ` Haz clic en el botón de abajo para acceder al enlace de pago.`
                        break
                      case 'custom_ui':
                        if (stripeData.settings.service_name && stripeData.settings.service_amount) {
                          const amount = (stripeData.settings.service_amount / 100).toFixed(2)
                          paymentContent += ` Servicio: ${stripeData.settings.service_name} - $${amount} ${stripeData.settings.service_currency.toUpperCase()}. Haz clic en el botón de abajo para pagar.`
                        } else {
                          paymentContent += ` Haz clic en el botón de abajo para proceder con el pago.`
                        }
                        break
                      default:
                        paymentContent += ` Haz clic en el botón de abajo para proceder con el pago.`
                    }

                    const paymentMessage: Message = {
                      id: 'payment-option',
                      content: paymentContent,
                      role: 'ai',
                      timestamp: new Date(),
                      paymentAvailable: true,
                      paymentType: stripeData.settings.payment_type
                    }
                    initialMessages.push(paymentMessage)
                  }
                }
              } catch (error) {
                console.error('Error fetching payment settings:', error)
                // Don't show payment option if there's an error
              }
            }

            // Add intake form message if intake_forms tool is enabled
            if (agentTools.intake_forms) {
              try {
                // Fetch active intake forms
                const formsResponse = await fetch(`/api/organizations/${organization.id}/intake-forms`)
                if (formsResponse.ok) {
                  const formsData = await formsResponse.json()
                  const forms = formsData.forms || []
                  
                  // Find the first active form
                  const activeForm = forms.find((form: any) => form.is_active)
                  
                  if (activeForm && anonymousUser) {
                    // Check if current anonymous user has already submitted this form
                    const { data: existingResponse } = await supabase
                      .from('intake_form_responses')
                      .select('id')
                      .eq('form_id', activeForm.id)
                      .eq('anonymous_user_id', anonymousUser.id)
                      .single()
                    
                    // Only show form option if this anonymous user hasn't submitted yet
                    if (!existingResponse) {
                      const intakeFormMessage: Message = {
                        id: 'intake-form-option',
                        content: `📋 **Llenar formulario**\n\n¿Podrías llenar nuestro formulario "${activeForm.name}"? Esto nos ayudará a brindarte un mejor servicio. Haz clic en el botón de abajo para empezar.`,
                        role: 'ai',
                        timestamp: new Date(),
                        intakeFormAvailable: true,
                        intakeFormId: activeForm.id,
                        intakeFormName: activeForm.name
                      }
                      initialMessages.push(intakeFormMessage)
                    } else {
                      console.log('Intake form already submitted by this anonymous user - hiding option')
                    }
                  }
                }
              } catch (error) {
                console.error('Error fetching intake forms:', error)
                // Don't show intake form option if there's an error
              }
            }
          }
        } catch (error) {
          console.error('Error fetching agent tools:', error)
          // Fallback: Always show appointment option
          const appointmentMessage: Message = {
            id: 'appointment-option',
            content: `📅 **Agendar una cita**\n\n¿Necesitas agendar una cita? Haz clic en el botón de abajo para ver nuestro calendario disponible y reservar tu horario.`,
            role: 'ai',
            timestamp: new Date(),
            appointmentLink: `http://localhost:3000/${locale}/book-appointment/${organization.slug}`
          }
          initialMessages.push(appointmentMessage)
        }
        
        setMessages(initialMessages)
      }
    }

    initializeMessages()
  }, [agent, organization, locale])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      // Call the client chat API endpoint with locale support
      const response = await fetch('/api/client-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
          organizationId: organization.id,
          locale: locale, // Include locale for internationalization
          messages: messages.slice(-10) // Send last 10 messages for context
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: Date.now().toString() + '_assistant',
        content: data.response,
        role: 'ai',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={`flex flex-col h-full w-full ${className}`}>
      {/* Messages Area - Full Screen Mobile */}
      <div 
        ref={chatScrollContainerRef}
        className="flex-1 overflow-y-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ChatMessage 
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
                appointmentLink={message.appointmentLink}
                documentSigningLink={message.documentSigningLink}
                paymentAvailable={message.paymentAvailable}
                paymentType={message.paymentType}
                intakeFormAvailable={message.intakeFormAvailable}
                intakeFormId={message.intakeFormId}
                intakeFormName={message.intakeFormName}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start px-4 py-2"
          >
            <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-xs">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message - Mobile Full Width */}
      {error && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Input Area - Mobile Optimized Full Width */}
      <div className="border-t border-gray-200 bg-white">
        <div className="px-4 py-3 safe-area-inset-bottom">
          <div className="flex gap-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                disabled={loading}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium touch-manipulation min-h-[44px] flex items-center"
            >
              {loading ? '...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 