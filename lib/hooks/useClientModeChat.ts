'use client'

import { useState, useEffect } from 'react'
import { Message, Agent, Organization } from '@/components/dashboard/types'
import { supabase } from '@/lib/supabase/client'

interface UseClientModeChatProps {
  agent: Agent
  organization: Organization
  locale?: string
}

export function useClientModeChat({
  agent,
  organization,
  locale = 'en'
}: UseClientModeChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [anonymousUser, setAnonymousUser] = useState<any>(null)

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

  // Initial greeting message with service options
  useEffect(() => {
    const initializeMessages = async () => {
      // Setup anonymous session for client chat persistence only if we don't have one
      if (!anonymousUser) {
        await setupAnonymousSession()
      }
      
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
                let appointmentLink = `${window.location.origin}/${locale}/book-appointment/${organization.slug}` // default fallback
                let appointmentContent = `📅 **Agendar una cita**\n\n¿Necesitas agendar una cita? Haz clic en el botón de abajo para ver nuestro calendario disponible y reservar tu horario.`

                if (appointmentResponse.ok) {
                  const appointmentData = await appointmentResponse.json()
                  const settings = appointmentData.settings

                  if (settings) {
                    switch (settings.provider) {
                      case 'calendly':
                        appointmentLink = `${window.location.origin}/${locale}/appointment/calendly/${organization.slug}`
                        appointmentContent = `📅 **Agendar una cita**\n\n¿Necesitas agendar una cita? Usa nuestro sistema de reservas integrado con Calendly.`
                        break
                      case 'vagaro':
                      case 'square':
                        appointmentLink = settings.provider_url || appointmentLink
                        appointmentContent = `📅 **Agendar una cita**\n\n¿Necesitas agendar una cita? Haz clic en el botón de abajo para acceder a nuestro sistema de reservas.`
                        break
                      case 'custom':
                        appointmentLink = settings.provider_url || appointmentLink
                        appointmentContent = `📅 **Agendar una cita**\n\n¿Necesitas agendar una cita? Haz clic en el botón de abajo para acceder a nuestro sistema de reservas.`
                        break
                      default:
                        // Use default values
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
                // Fallback: Default appointment message
                const appointmentMessage: Message = {
                  id: 'appointment-option',
                  content: `📅 **Agendar una cita**\n\n¿Necesitas agendar una cita? Haz clic en el botón de abajo para ver nuestro calendario disponible y reservar tu horario.`,
                  role: 'ai',
                  timestamp: new Date(),
                  appointmentLink: `${window.location.origin}/${locale}/book-appointment/${organization.slug}`
                }
                initialMessages.push(appointmentMessage)
              }
            }

            // Add document signing message if documents tool is enabled
            if (agentTools.documents) {
              try {
                // Fetch agent documents to see if any need signing
                const docsResponse = await fetch(`/api/organizations/${organization.id}/agent-documents`)
                if (docsResponse.ok) {
                  const docsData = await docsResponse.json()
                  const documents = docsData.documents || []
                  
                  // Find documents that need signing
                  const signingDocs = documents.filter((doc: any) => doc.requires_signature)
                  
                  if (signingDocs.length > 0) {
                    const docMessage: Message = {
                      id: 'document-signing-option',
                      content: `📄 **Firma de documentos**\n\nTenemos documentos que requieren tu firma. Haz clic en el botón de abajo para revisarlos y firmarlos digitalmente.`,
                      role: 'ai',
                      timestamp: new Date(),
                      documentSigningLink: `${window.location.origin}/${locale}/sign-document/${signingDocs[0].id}`
                    }
                    initialMessages.push(docMessage)
                  }
                }
              } catch (error) {
                console.error('Error fetching documents:', error)
                // Don't show document option if there's an error
              }
            }

            // Add payment message if payments tool is enabled
            if (agentTools.payments) {
              try {
                // Fetch payment settings to determine provider and configuration
                const paymentResponse = await fetch(`/api/organizations/${organization.id}/payment-providers`)
                if (paymentResponse.ok) {
                  const paymentData = await paymentResponse.json()
                  const providers = paymentData.providers || []
                  
                  // Find default active provider
                  const defaultProvider = providers.find((p: any) => p.is_default && p.is_active)
                  
                  if (defaultProvider) {
                    let paymentContent = `💳 **Realizar pago**\n\nPuedes realizar pagos de forma segura a través de ${defaultProvider.provider_type.toUpperCase()}.`
                    
                    switch (defaultProvider.payment_type) {
                      case 'manual_price_id':
                        if (defaultProvider.service_name) {
                          paymentContent += ` Servicio: ${defaultProvider.service_name}.`
                        }
                        paymentContent += ` Haz clic en el botón de abajo para proceder con el pago.`
                        break
                      case 'custom_ui':
                        if (defaultProvider.service_name && defaultProvider.service_amount) {
                          const amount = (defaultProvider.service_amount / 100).toFixed(2)
                          paymentContent += ` Servicio: ${defaultProvider.service_name} - $${amount} ${defaultProvider.service_currency?.toUpperCase() || 'USD'}.`
                        }
                        paymentContent += ` Haz clic en el botón de abajo para proceder con el pago.`
                        break
                      case 'dynamic':
                        paymentContent += ` Puedes especificar el monto a pagar.`
                        paymentContent += ` Haz clic en el botón de abajo para proceder con el pago.`
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
                      paymentType: defaultProvider.payment_type
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
            appointmentLink: `${window.location.origin}/${locale}/book-appointment/${organization.slug}`
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

    const messageText = input.trim()
    setInput('')
    setLoading(true)
    setError(null)

    // Add user message to chat
    setMessages(prev => [...prev, userMessage])

    try {
      // Use functional update to get the current messages including the user message
      const response = await fetch('/api/client-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          organizationId: organization.id,
          locale: locale,
          messages: [...messages, userMessage].slice(-10) // Send last 10 messages for context
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
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1))
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

  return {
    // State
    messages,
    input,
    loading,
    error,
    anonymousUser,
    
    // Actions
    setMessages,
    setInput,
    setError,
    handleSend,
    handleKeyPress
  }
}