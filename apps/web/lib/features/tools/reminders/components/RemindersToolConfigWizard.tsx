'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, Clock, User, Mail, Loader2, RefreshCw, Repeat } from 'lucide-react'
import MultiStepWizard, { WizardStep } from '@/lib/shared/components/MultiStepWizard'

interface Customer {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

interface RemindersToolConfigWizardProps {
  organizationId: string
  businessName: string
}

export default function RemindersToolConfigWizard({ organizationId, businessName }: RemindersToolConfigWizardProps) {
  // State
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [manualEmail, setManualEmail] = useState('')
  const [manualName, setManualName] = useState('')
  const [useManualEmail, setUseManualEmail] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [recurrence, setRecurrence] = useState<'once' | 'daily' | 'weekly' | 'monthly'>('once')
  const [aiGeneratedHtml, setAiGeneratedHtml] = useState<string | null>(null)
  
  // Multi-step wizard
  const [currentStep, setCurrentStep] = useState(1)
  
  // Loading states
  const [generatingTemplate, setGeneratingTemplate] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)
  const [customersLoading, setCustomersLoading] = useState(true)

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await fetch(`/api/organizations/${organizationId}/customers`)
        if (response.ok) {
          const data = await response.json()
          setCustomers(data.customers || [])
        } else if (response.status === 401) {
          console.error('Not authenticated. Please log in to access customers.')
        }
      } catch (error) {
        console.error('Error loading customers:', error)
      } finally {
        setCustomersLoading(false)
      }
    }

    if (organizationId) {
      loadCustomers()
    }
  }, [organizationId])

  // Removed reminders loading - now handled by RemindersManagementView

  // Generate AI template
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
    // Validate: either customer selected or manual email provided
    const hasRecipient = useManualEmail ? manualEmail : selectedCustomer
    
    if (!hasRecipient || !subject || !message || !scheduledDate || !scheduledTime) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    // Validate email format if using manual email
    if (useManualEmail && !manualEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      alert('Por favor ingresa un email válido')
      return
    }

    setSendingReminder(true)
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()

      const response = await fetch(`/api/organizations/${organizationId}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer?.id,
          manual_email: useManualEmail ? manualEmail : undefined,
          manual_name: useManualEmail ? manualName : undefined,
          original_message: message,
          ai_generated_html: aiGeneratedHtml,
          subject,
          scheduled_at: scheduledAt,
          recurrence
        })
      })

      if (response.ok) {
        // Reset form
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
    setSelectedCustomer(null)
    setManualEmail('')
    setManualName('')
    setUseManualEmail(false)
    setSubject('')
    setMessage('')
    setScheduledDate('')
    setScheduledTime('')
    setRecurrence('once')
    setAiGeneratedHtml(null)
    setCurrentStep(1)
    setSearchQuery('')
  }

  // Reminder management now handled by RemindersManagementView

  // Filter customers
  const filteredCustomers = customers.filter(c =>
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  // Define wizard steps
  const wizardSteps: WizardStep[] = useMemo(() => [
    // Step 1: Select Customer
    {
      id: 'customer',
      title: 'Cliente',
      description: 'Selecciona un cliente o ingresa un email manualmente',
      isValid: useManualEmail ? !!manualEmail : !!selectedCustomer,
      content: (
        <div className="space-y-4">
          {/* Explanation */}
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-secondary)'
            }}
          >
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Sigue los pasos para crear un recordatorio personalizado con plantilla generada por IA
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              💡 Una vez creado, podrás administrarlo desde la sección de Recordatorios en el menú lateral
            </p>
          </div>

          {/* Toggle between customer list and manual email */}
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

          {/* Manual Email Input */}
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
      )
    },

    // Step 2: Message & Subject
    {
      id: 'message',
      title: 'Mensaje',
      description: 'Escribe el asunto y mensaje del recordatorio',
      isValid: !!subject && !!message,
      content: (
        <div className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
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
    },

    // Step 3: AI Template
    {
      id: 'template',
      title: 'Plantilla',
      description: 'Genera una plantilla profesional con IA',
      isValid: !!aiGeneratedHtml,
      onEnter: async () => {
        // Auto-generate template when entering this step if not already generated
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
              {/* Regenerate Button */}
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

              {/* Always show preview */}
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
    },

    // Step 4: Frequency
    {
      id: 'frequency',
      title: 'Frecuencia',
      description: '¿Con qué frecuencia se debe enviar este recordatorio?',
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
    },

    // Step 5: Schedule
    {
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
                borderLeftColor: 'var(--accent-secondary)'
              }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Resumen:
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Se enviará el {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleDateString('es', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })} a las {scheduledTime}
              </p>
              {recurrence !== 'once' && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Frecuencia: {
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
    }
  ], [selectedCustomer, useManualEmail, manualEmail, manualName, subject, message, aiGeneratedHtml, recurrence, scheduledDate, scheduledTime, searchQuery, customersLoading, filteredCustomers, generatingTemplate, today])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          📧 Sistema de Recordatorios
        </h3>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Envía recordatorios personalizados a tus clientes por email
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

