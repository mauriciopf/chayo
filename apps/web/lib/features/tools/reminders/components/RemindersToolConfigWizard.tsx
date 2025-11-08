'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, Clock, User, Mail, Loader2, RefreshCw, MessageSquare, Phone } from 'lucide-react'
import MultiStepWizard, { WizardStep } from '@/lib/shared/components/MultiStepWizard'
import { WhatsAppTemplate } from '@/lib/features/whatsapp/types/template.types'
import { WhatsAppTemplateManager } from '@/lib/features/whatsapp/services/WhatsAppTemplateManager'

interface Customer {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

interface WhatsAppContact {
  id: string
  name: string
  phone_number: string
  created_at: string
}

interface RemindersToolConfigWizardProps {
  organizationId: string
  businessName: string
}

export default function RemindersToolConfigWizard({ organizationId, businessName }: RemindersToolConfigWizardProps) {
  // Step 1: Channel Selection
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email')
  
  // Step 2a: Email Recipients
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [manualEmail, setManualEmail] = useState('')
  const [manualName, setManualName] = useState('')
  const [useManualEmail, setUseManualEmail] = useState(false)
  
  // Step 2b: WhatsApp Recipients
  const [whatsappContacts, setWhatsappContacts] = useState<WhatsAppContact[]>([])
  const [selectedWhatsAppContact, setSelectedWhatsAppContact] = useState<WhatsAppContact | null>(null)
  const [manualPhone, setManualPhone] = useState('')
  const [manualPhoneName, setManualPhoneName] = useState('')
  const [useManualPhone, setUseManualPhone] = useState(false)
  
  // Step 3: Message
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  
  // Step 4a: Email Template (AI-generated)
  const [aiGeneratedHtml, setAiGeneratedHtml] = useState<string | null>(null)
  
  // Step 4b: WhatsApp Template
  const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsAppTemplate[]>([])
  const [selectedWhatsAppTemplate, setSelectedWhatsAppTemplate] = useState<WhatsAppTemplate | null>(null)
  const [useFallback, setUseFallback] = useState(false)
  const [templatesLoading, setTemplatesLoading] = useState(false)
  
  // Step 5 & 6: Schedule
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [recurrence, setRecurrence] = useState<'once' | 'daily' | 'weekly' | 'monthly'>('once')
  
  // Multi-step wizard
  const [currentStep, setCurrentStep] = useState(1)
  
  // Loading states
  const [generatingTemplate, setGeneratingTemplate] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)
  const [customersLoading, setCustomersLoading] = useState(true)
  const [whatsappContactsLoading, setWhatsappContactsLoading] = useState(true)

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  // Load customers (for email)
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await fetch(`/api/organizations/${organizationId}/customers`)
        if (response.ok) {
          const data = await response.json()
          setCustomers(data.customers || [])
        }
      } catch (error) {
        console.error('Error loading customers:', error)
      } finally {
        setCustomersLoading(false)
      }
    }

    if (organizationId && channel === 'email') {
      loadCustomers()
    }
  }, [organizationId, channel])

  // Load WhatsApp contacts
  useEffect(() => {
    const loadWhatsAppContacts = async () => {
      try {
        const response = await fetch(`/api/organizations/${organizationId}/whatsapp-contacts`)
        if (response.ok) {
          const data = await response.json()
          setWhatsappContacts(data.contacts || [])
        }
      } catch (error) {
        console.error('Error loading WhatsApp contacts:', error)
      } finally {
        setWhatsappContactsLoading(false)
      }
    }

    if (organizationId && channel === 'whatsapp') {
      loadWhatsAppContacts()
    }
  }, [organizationId, channel])

  // Load WhatsApp templates for reminders
  useEffect(() => {
    const loadTemplates = async () => {
      setTemplatesLoading(true)
      try {
        const templates = await WhatsAppTemplateManager.getTemplates(organizationId, 'reminders')
        setWhatsappTemplates(templates)
        
        // Auto-select first APPROVED template
        const approvedTemplate = templates.find(t => t.status === 'APPROVED')
        if (approvedTemplate) {
          setSelectedWhatsAppTemplate(approvedTemplate)
          setUseFallback(false)
        } else {
          setUseFallback(true)
        }
      } catch (error) {
        console.error('Error loading WhatsApp templates:', error)
        setUseFallback(true)
      } finally {
        setTemplatesLoading(false)
      }
    }

    if (organizationId && channel === 'whatsapp') {
      loadTemplates()
    }
  }, [organizationId, channel])

  // Generate AI email template
  const handleGenerateTemplate = async (regenerate = false) => {
    if (!message || !subject) return false

    setGeneratingTemplate(true)
    try {
      const response = await fetch('/api/ai/generate-email-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          subject,
          businessName,
          regenerate
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiGeneratedHtml(data.html)
        return true
      } else {
        alert('Error al generar plantilla. Por favor intenta de nuevo.')
        return false
      }
    } catch (error) {
      console.error('Error generating template:', error)
      alert('Error al generar plantilla.')
      return false
    } finally {
      setGeneratingTemplate(false)
    }
  }

  // Send reminder
  const handleSendReminder = async () => {
    // Validate based on channel
    if (channel === 'email') {
      const hasRecipient = useManualEmail ? manualEmail : selectedCustomer
      if (!hasRecipient || !subject || !message || !scheduledDate || !scheduledTime) {
        alert('Por favor completa todos los campos requeridos')
        return
      }
      if (useManualEmail && !manualEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        alert('Por favor ingresa un email válido')
        return
      }
    } else {
      const hasRecipient = useManualPhone ? manualPhone : selectedWhatsAppContact
      if (!hasRecipient || !message || !scheduledDate || !scheduledTime) {
        alert('Por favor completa todos los campos requeridos')
        return
      }
      if (useManualPhone && !manualPhone.startsWith('+')) {
        alert('El número de teléfono debe estar en formato E.164 (ejemplo: +52XXXXXXXXXX)')
        return
      }
    }

    setSendingReminder(true)
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()

      const payload: any = {
        channel,
        original_message: message,
        scheduled_at: scheduledAt,
        recurrence
      }

      if (channel === 'email') {
        payload.customer_id = selectedCustomer?.id
        payload.manual_email = useManualEmail ? manualEmail : undefined
        payload.manual_name = useManualEmail ? manualName : undefined
        payload.subject = subject
        payload.ai_generated_html = aiGeneratedHtml
      } else {
        payload.customer_id = selectedWhatsAppContact?.id
        payload.whatsapp_phone = useManualPhone ? manualPhone : selectedWhatsAppContact?.phone_number
        payload.whatsapp_template_name = useFallback ? null : selectedWhatsAppTemplate?.name
      }

      const response = await fetch(`/api/organizations/${organizationId}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        resetWizard()
        alert('✅ Recordatorio programado exitosamente! Ve a la sección de Recordatorios en el menú lateral para administrarlo.')
      } else {
        alert('Error al programar recordatorio')
      }
    } catch (error) {
      console.error('Error sending reminder:', error)
      alert('Error al programar recordatorio')
    } finally {
      setSendingReminder(false)
    }
  }

  // Reset wizard
  const resetWizard = () => {
    setChannel('email')
    setSelectedCustomer(null)
    setManualEmail('')
    setManualName('')
    setUseManualEmail(false)
    setSelectedWhatsAppContact(null)
    setManualPhone('')
    setManualPhoneName('')
    setUseManualPhone(false)
    setSubject('')
    setMessage('')
    setScheduledDate('')
    setScheduledTime('')
    setRecurrence('once')
    setAiGeneratedHtml(null)
    setSelectedWhatsAppTemplate(null)
    setUseFallback(false)
    setCurrentStep(1)
    setSearchQuery('')
  }

  // Filter customers or WhatsApp contacts
  const filteredCustomers = customers.filter(c =>
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredWhatsAppContacts = whatsappContacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  // Define wizard steps
  const wizardSteps: WizardStep[] = useMemo(() => {
    const steps: WizardStep[] = [
      // Step 1: Channel Selection
      {
        id: 'channel',
        title: 'Canal',
        description: '¿Cómo quieres enviar el recordatorio?',
        isValid: true,
        content: (
          <div className="space-y-4">
            <div 
              className="p-4 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-secondary)'
              }}
            >
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                Elige el canal de comunicación para enviar tu recordatorio
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                💡 Puedes enviar por email o WhatsApp
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setChannel('email')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  channel === 'email' ? 'ring-2 ring-purple-500' : ''
                }`}
                style={{
                  backgroundColor: channel === 'email' 
                    ? 'var(--accent-secondary)' 
                    : 'var(--bg-tertiary)',
                  borderColor: channel === 'email'
                    ? 'var(--accent-secondary)'
                    : 'var(--border-secondary)',
                  color: channel === 'email' ? 'white' : 'var(--text-primary)'
                }}
              >
                <Mail className="h-12 w-12 mx-auto mb-3" />
                <div className="font-semibold text-lg mb-1">Email</div>
                <div className={`text-sm ${channel === 'email' ? 'opacity-90' : 'opacity-60'}`}>
                  Enviar por correo electrónico
                </div>
              </button>

              <button
                onClick={() => setChannel('whatsapp')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  channel === 'whatsapp' ? 'ring-2 ring-green-500' : ''
                }`}
                style={{
                  backgroundColor: channel === 'whatsapp' 
                    ? '#25D366' 
                    : 'var(--bg-tertiary)',
                  borderColor: channel === 'whatsapp'
                    ? '#25D366'
                    : 'var(--border-secondary)',
                  color: channel === 'whatsapp' ? 'white' : 'var(--text-primary)'
                }}
              >
                <MessageSquare className="h-12 w-12 mx-auto mb-3" />
                <div className="font-semibold text-lg mb-1">WhatsApp</div>
                <div className={`text-sm ${channel === 'whatsapp' ? 'opacity-90' : 'opacity-60'}`}>
                  Enviar por WhatsApp
                </div>
              </button>
            </div>
          </div>
        )
      },

      // Step 2: Customer/Recipient Selection (conditional based on channel)
      {
        id: 'recipient',
        title: channel === 'email' ? 'Cliente' : 'Contacto',
        description: channel === 'email' 
          ? 'Selecciona un cliente o ingresa un email'
          : 'Selecciona un contacto o ingresa un teléfono',
        isValid: channel === 'email'
          ? (useManualEmail ? !!manualEmail : !!selectedCustomer)
          : (useManualPhone ? !!manualPhone : !!selectedWhatsAppContact),
        content: channel === 'email' ? (
          // EMAIL RECIPIENT
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setUseManualEmail(false)
                  setManualEmail('')
                  setManualName('')
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  !useManualEmail ? 'ring-2 ring-purple-500' : ''
                }`}
                style={{
                  backgroundColor: !useManualEmail ? 'var(--accent-secondary)' : 'var(--bg-tertiary)',
                  color: !useManualEmail ? 'white' : 'var(--text-primary)'
                }}
              >
                Seleccionar Cliente
              </button>
              <button
                onClick={() => {
                  setUseManualEmail(true)
                  setSelectedCustomer(null)
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  useManualEmail ? 'ring-2 ring-purple-500' : ''
                }`}
                style={{
                  backgroundColor: useManualEmail ? 'var(--accent-secondary)' : 'var(--bg-tertiary)',
                  color: useManualEmail ? 'white' : 'var(--text-primary)'
                }}
              >
                Ingresar Email
              </button>
            </div>

            {useManualEmail ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email del Cliente *
                  </label>
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="ejemplo@email.com"
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    <User className="inline h-4 w-4 mr-1" />
                    Nombre del Cliente (opcional)
                  </label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Juan Pérez"
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />

                <div 
                  className="max-h-96 overflow-y-auto space-y-2 p-2 rounded-lg border"
                  style={{ 
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-secondary)'
                  }}
                >
                  {customersLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                      No hay clientes disponibles
                    </p>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          selectedCustomer?.id === customer.id ? 'ring-2 ring-purple-500' : ''
                        }`}
                        style={{
                          backgroundColor: selectedCustomer?.id === customer.id 
                            ? 'var(--accent-secondary)' 
                            : 'var(--bg-secondary)',
                          color: selectedCustomer?.id === customer.id 
                            ? 'white' 
                            : 'var(--text-primary)'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                            style={{ 
                              backgroundColor: selectedCustomer?.id === customer.id 
                                ? 'rgba(255,255,255,0.2)' 
                                : 'var(--accent-secondary)',
                              color: 'white'
                            }}
                          >
                            {customer.full_name?.[0]?.toUpperCase() || customer.email[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {customer.full_name || customer.email}
                            </p>
                            {customer.full_name && (
                              <p className="text-sm truncate opacity-80">{customer.email}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          // WHATSAPP RECIPIENT
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setUseManualPhone(false)
                  setManualPhone('')
                  setManualPhoneName('')
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  !useManualPhone ? 'ring-2 ring-green-500' : ''
                }`}
                style={{
                  backgroundColor: !useManualPhone ? '#25D366' : 'var(--bg-tertiary)',
                  color: !useManualPhone ? 'white' : 'var(--text-primary)'
                }}
              >
                Seleccionar Contacto
              </button>
              <button
                onClick={() => {
                  setUseManualPhone(true)
                  setSelectedWhatsAppContact(null)
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  useManualPhone ? 'ring-2 ring-green-500' : ''
                }`}
                style={{
                  backgroundColor: useManualPhone ? '#25D366' : 'var(--bg-tertiary)',
                  color: useManualPhone ? 'white' : 'var(--text-primary)'
                }}
              >
                Ingresar Teléfono
              </button>
            </div>

            {useManualPhone ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    <Phone className="inline h-4 w-4 mr-1" />
                    Número de WhatsApp *
                  </label>
                  <input
                    type="tel"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="+52XXXXXXXXXX"
                    className="w-full px-4 py-2 rounded-lg border font-mono"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Formato E.164: +[código país][número] (ejemplo: +52XXXXXXXXXX)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    <User className="inline h-4 w-4 mr-1" />
                    Nombre del Contacto (opcional)
                  </label>
                  <input
                    type="text"
                    value={manualPhoneName}
                    onChange={(e) => setManualPhoneName(e.target.value)}
                    placeholder="Juan Pérez"
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Buscar contacto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />

                <div 
                  className="max-h-96 overflow-y-auto space-y-2 p-2 rounded-lg border"
                  style={{ 
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-secondary)'
                  }}
                >
                  {whatsappContactsLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  ) : filteredWhatsAppContacts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="mb-2" style={{ color: 'var(--text-muted)' }}>
                        No hay contactos de WhatsApp disponibles
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        💡 Usa "Ingresar Teléfono" para agregar uno manualmente
                      </p>
                    </div>
                  ) : (
                    filteredWhatsAppContacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => setSelectedWhatsAppContact(contact)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          selectedWhatsAppContact?.id === contact.id ? 'ring-2 ring-green-500' : ''
                        }`}
                        style={{
                          backgroundColor: selectedWhatsAppContact?.id === contact.id 
                            ? '#25D366' 
                            : 'var(--bg-secondary)',
                          color: selectedWhatsAppContact?.id === contact.id 
                            ? 'white' 
                            : 'var(--text-primary)'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                            style={{ 
                              backgroundColor: selectedWhatsAppContact?.id === contact.id 
                                ? 'rgba(255,255,255,0.2)' 
                                : '#25D366',
                              color: 'white'
                            }}
                          >
                            {contact.name[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{contact.name}</p>
                            <p className="text-sm truncate opacity-80 font-mono">{contact.phone_number}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )
      },

      // Step 3: Message (conditional fields based on channel)
      {
        id: 'message',
        title: 'Mensaje',
        description: channel === 'email' ? 'Escribe el asunto y mensaje' : 'Escribe tu mensaje',
        isValid: channel === 'email' ? (!!subject && !!message) : !!message,
        content: (
          <div className="space-y-4">
            {channel === 'email' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  <Mail className="inline h-4 w-4 mr-1" />
                  Asunto del Email
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ej: Recordatorio de tu cita"
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                <MessageSquare className="inline h-4 w-4 mr-1" />
                Mensaje
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                rows={6}
                className="w-full px-4 py-2 rounded-lg border resize-none"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-secondary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>
        )
      }
    ]

    // Step 4: Template (conditional based on channel)
    if (channel === 'email') {
      steps.push({
        id: 'template',
        title: 'Plantilla',
        description: 'Genera una plantilla profesional con IA',
        isValid: !!aiGeneratedHtml,
        onEnter: async () => {
          if (!aiGeneratedHtml && !generatingTemplate) {
            await handleGenerateTemplate(false)
          }
        },
        content: (
          <div className="space-y-4">
            {generatingTemplate && !aiGeneratedHtml ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" style={{ color: 'var(--accent-secondary)' }} />
                <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Generando plantilla...
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  La IA está creando un email profesional para ti
                </p>
              </div>
            ) : aiGeneratedHtml ? (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    onClick={() => handleGenerateTemplate(true)}
                    disabled={generatingTemplate}
                    className="py-2 px-4 rounded-lg border font-medium flex items-center gap-2 disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    {generatingTemplate ? 'Regenerando...' : 'Regenerar'}
                  </button>
                </div>

                <div 
                  className="p-4 rounded-lg border max-h-96 overflow-y-auto"
                  style={{
                    backgroundColor: 'white',
                    borderColor: 'var(--border-secondary)'
                  }}
                  dangerouslySetInnerHTML={{ __html: aiGeneratedHtml }}
                />
              </div>
            ) : null}
          </div>
        )
      })
    } else {
      steps.push({
        id: 'whatsapp-template',
        title: 'Plantilla de WhatsApp',
        description: 'Selecciona una plantilla o usa enlace directo',
        isValid: true,
        content: (
          <div className="space-y-4">
            {templatesLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" style={{ color: '#25D366' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Cargando plantillas...
                </p>
              </div>
            ) : (
              <>
                <div 
                  className="p-4 rounded-lg border"
                  style={{ 
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-secondary)'
                  }}
                >
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {whatsappTemplates.filter(t => t.status === 'APPROVED').length > 0
                      ? 'Plantillas aprobadas disponibles'
                      : 'No hay plantillas aprobadas. Se usará enlace directo de WhatsApp.'}
                  </p>
                </div>

                {/* Show approved templates */}
                {whatsappTemplates.filter(t => t.status === 'APPROVED').length > 0 && (
                  <div className="space-y-2">
                    {whatsappTemplates
                      .filter(t => t.status === 'APPROVED')
                      .map(template => (
                        <button
                          key={template.id}
                          onClick={() => {
                            setSelectedWhatsAppTemplate(template)
                            setUseFallback(false)
                          }}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            selectedWhatsAppTemplate?.id === template.id ? 'ring-2 ring-green-500' : ''
                          }`}
                          style={{
                            backgroundColor: selectedWhatsAppTemplate?.id === template.id
                              ? '#25D366'
                              : 'var(--bg-secondary)',
                            borderColor: selectedWhatsAppTemplate?.id === template.id
                              ? '#25D366'
                              : 'var(--border-secondary)',
                            color: selectedWhatsAppTemplate?.id === template.id
                              ? 'white'
                              : 'var(--text-primary)'
                          }}
                        >
                          <div className="font-medium mb-1">{template.name}</div>
                          <div className={`text-sm ${selectedWhatsAppTemplate?.id === template.id ? 'opacity-90' : 'opacity-60'}`}>
                            {template.language} • {template.category}
                          </div>
                        </button>
                      ))}
                  </div>
                )}

                {/* Fallback option (always available) */}
                <button
                  onClick={() => {
                    setUseFallback(true)
                    setSelectedWhatsAppTemplate(null)
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    useFallback ? 'ring-2 ring-blue-500' : ''
                  }`}
                  style={{
                    backgroundColor: useFallback
                      ? 'var(--accent-secondary)'
                      : 'var(--bg-secondary)',
                    borderColor: useFallback
                      ? 'var(--accent-secondary)'
                      : 'var(--border-secondary)',
                    color: useFallback
                      ? 'white'
                      : 'var(--text-primary)'
                  }}
                >
                  <div className="font-medium mb-1">📱 Usar Enlace Directo (wa.me)</div>
                  <div className={`text-sm ${useFallback ? 'opacity-90' : 'opacity-60'}`}>
                    Abre WhatsApp directamente con el mensaje (sin usar plantilla de Meta)
                  </div>
                </button>
              </>
            )}
          </div>
        )
      })
    }

    // Step 5: Frequency
    steps.push({
      id: 'frequency',
      title: 'Frecuencia',
      description: '¿Con qué frecuencia se debe enviar?',
      isValid: true,
      content: (
        <div className="grid grid-cols-2 gap-4">
          {([
            { value: 'once', label: 'Una vez', icon: '📅', description: 'Enviar solo una vez' },
            { value: 'daily', label: 'Diario', icon: '🔄', description: 'Todos los días' },
            { value: 'weekly', label: 'Semanal', icon: '📆', description: 'Cada semana' },
            { value: 'monthly', label: 'Mensual', icon: '🗓️', description: 'Cada mes' }
          ] as const).map((freq) => (
            <button
              key={freq.value}
              onClick={() => setRecurrence(freq.value)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                recurrence === freq.value ? 'ring-2 ring-orange-500' : ''
              }`}
              style={{
                backgroundColor: recurrence === freq.value 
                  ? 'var(--accent-secondary)' 
                  : 'var(--bg-tertiary)',
                borderColor: recurrence === freq.value
                  ? 'var(--accent-secondary)'
                  : 'var(--border-secondary)',
                color: recurrence === freq.value ? 'white' : 'var(--text-primary)'
              }}
            >
              <div className="text-3xl mb-2">{freq.icon}</div>
              <div className="font-semibold mb-1">{freq.label}</div>
              <div className={`text-sm ${recurrence === freq.value ? 'opacity-90' : 'opacity-60'}`}>
                {freq.description}
              </div>
            </button>
          ))}
        </div>
      )
    })

    // Step 6: Schedule
    steps.push({
      id: 'schedule',
      title: 'Fecha y Hora',
      description: '¿Cuándo se debe enviar el recordatorio?',
      isValid: !!scheduledDate && !!scheduledTime,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              <Calendar className="inline h-4 w-4 mr-1" />
              Fecha
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={today}
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-secondary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              <Clock className="inline h-4 w-4 mr-1" />
              Hora
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-secondary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {scheduledDate && scheduledTime && (
            <div 
              className="p-4 rounded-lg border-l-4"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderLeftColor: channel === 'email' ? 'var(--accent-secondary)' : '#25D366'
              }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Resumen:
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                📲 Canal: {channel === 'email' ? 'Email' : 'WhatsApp'}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                📅 Se enviará el {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleDateString('es', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })} a las {scheduledTime}
              </p>
              {recurrence !== 'once' && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  🔄 Frecuencia: {
                    recurrence === 'daily' ? 'Diario' :
                    recurrence === 'weekly' ? 'Semanal' :
                    'Mensual'
                  }
                </p>
              )}
            </div>
          )}
        </div>
      )
    })

    return steps
  }, [
    channel,
    selectedCustomer,
    useManualEmail,
    manualEmail,
    manualName,
    selectedWhatsAppContact,
    useManualPhone,
    manualPhone,
    manualPhoneName,
    subject,
    message,
    aiGeneratedHtml,
    selectedWhatsAppTemplate,
    useFallback,
    whatsappTemplates,
    templatesLoading,
    recurrence,
    scheduledDate,
    scheduledTime,
    searchQuery,
    customersLoading,
    whatsappContactsLoading,
    filteredCustomers,
    filteredWhatsAppContacts,
    generatingTemplate,
    today
  ])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          ⏰ Sistema de Recordatorios
        </h3>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Envía recordatorios personalizados por email o WhatsApp
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div 
          className="p-6 rounded-lg border min-h-[600px]"
          style={{ 
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)'
          }}
        >
          <MultiStepWizard
            steps={wizardSteps}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onComplete={handleSendReminder}
            onCancel={() => {
              resetWizard()
            }}
            isSubmitting={sendingReminder}
            submitLabel="Programar Recordatorio"
            cancelLabel="Cancelar"
          />
        </div>
      </div>
    </div>
  )
}
