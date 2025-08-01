'use client'

import { useState, useEffect } from 'react'
import { Message, Agent, Organization } from '@/lib/shared/types'
import { supabase } from '@/lib/shared/supabase/client'

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

  // Helper functions to generate tool messages based on intents
  const generateAppointmentMessage = async (): Promise<Message | null> => {
    try {
      const appointmentResponse = await fetch(`/api/organizations/${organization.id}/appointment-settings`)
      let appointmentLink = `${window.location.origin}/${locale}/book-appointment/${organization.slug}`
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
          }
        }
      }

      return {
        id: `appointment-${Date.now()}`,
        content: appointmentContent,
        role: 'ai',
        timestamp: new Date(),
        appointmentLink: appointmentLink
      }
    } catch (error) {
      console.error('Error generating appointment message:', error)
      return null
    }
  }

  const generatePaymentMessage = async (): Promise<Message | null> => {
    try {
      const paymentResponse = await fetch(`/api/organizations/${organization.id}/payment-providers`)
      if (!paymentResponse.ok) return null

      const paymentData = await paymentResponse.json()
      const providers = paymentData.providers || []
      const defaultProvider = providers.find((p: any) => p.is_default && p.is_active)
      
      if (!defaultProvider) return null

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

      return {
        id: `payment-${Date.now()}`,
        content: paymentContent,
        role: 'ai',
        timestamp: new Date(),
        paymentAvailable: true,
        paymentType: defaultProvider.payment_type
      }
    } catch (error) {
      console.error('Error generating payment message:', error)
      return null
    }
  }

  const generateDocumentMessage = async (): Promise<Message | null> => {
    try {
      const docsResponse = await fetch(`/api/organizations/${organization.id}/agent-documents`)
      if (!docsResponse.ok) return null

      const docsData = await docsResponse.json()
      const documents = docsData.documents || []
      const signingDocs = documents.filter((doc: any) => doc.requires_signature)
      
      if (signingDocs.length === 0) return null

      return {
        id: `document-${Date.now()}`,
        content: `📄 **Firma de documentos**\n\nTenemos documentos que requieren tu firma. Haz clic en el botón de abajo para revisarlos y firmarlos digitalmente.`,
        role: 'ai',
        timestamp: new Date(),
        documentSigningLink: `${window.location.origin}/${locale}/sign-document/${signingDocs[0].id}`
      }
    } catch (error) {
      console.error('Error generating document message:', error)
      return null
    }
  }

  const generateIntakeFormMessage = async (): Promise<Message | null> => {
    try {
      const formsResponse = await fetch(`/api/organizations/${organization.id}/intake-forms`)
      if (!formsResponse.ok) return null

      const formsData = await formsResponse.json()
      const forms = formsData.forms || []
      const activeForm = forms.find((form: any) => form.is_active)
      
      if (!activeForm || !anonymousUser) return null

      // Check if current anonymous user has already submitted this form
      const { data: existingResponse } = await supabase
        .from('intake_form_responses')
        .select('id')
        .eq('form_id', activeForm.id)
        .eq('anonymous_user_id', anonymousUser.id)
        .single()
      
      if (existingResponse) return null // Already submitted

      return {
        id: `intake-form-${Date.now()}`,
        content: `📋 **Llenar formulario**\n\n¿Podrías llenar nuestro formulario "${activeForm.name}"? Esto nos ayudará a brindarte un mejor servicio. Haz clic en el botón de abajo para empezar.`,
        role: 'ai',
        timestamp: new Date(),
        intakeFormAvailable: true,
        intakeFormId: activeForm.id,
        intakeFormName: activeForm.name
      }
    } catch (error) {
      console.error('Error generating intake form message:', error)
      return null
    }
  }

  const generateFAQMessage = async (): Promise<Message | null> => {
    const faqLanguage = locale === 'es' ? 'es' : 'en'
    return {
      id: `faq-${Date.now()}`,
      content: `❓ **Preguntas Frecuentes**\n\nPuedes consultar nuestras preguntas frecuentes para obtener respuestas rápidas a consultas comunes.`,
      role: 'ai', 
      timestamp: new Date(),
      faqLink: `/${faqLanguage}/faqs/${organization.slug}`
    }
  }

  // Function to handle detected intents and generate appropriate tool messages
  const handleDetectedIntents = async (intents: string[]): Promise<Message[]> => {
    const toolMessages: Message[] = []

    for (const intent of intents) {
      let message: Message | null = null

      switch (intent) {
        case 'appointments':
          message = await generateAppointmentMessage()
          break
        case 'payments':
          message = await generatePaymentMessage()
          break
        case 'documents':
          message = await generateDocumentMessage()
          break
        case 'intake_forms':
          message = await generateIntakeFormMessage()
          break
        case 'faqs':
          message = await generateFAQMessage()
          break
      }

      if (message) {
        toolMessages.push(message)
      }
    }

    return toolMessages
  }

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

  // Initial greeting message (no upfront tool display)
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
        
        setMessages([welcomeMessage])
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

      // Add assistant message first
      setMessages(prev => [...prev, assistantMessage])

      // Handle detected intents by generating and adding tool messages
      if (data.intents && data.intents.length > 0) {
        console.log('🎯 Detected intents:', data.intents)
        const toolMessages = await handleDetectedIntents(data.intents)
        
        if (toolMessages.length > 0) {
          // Add tool messages after a small delay for better UX
          setTimeout(() => {
            setMessages(prev => [...prev, ...toolMessages])
          }, 500)
        }
      }
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