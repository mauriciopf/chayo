'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, Clock, User, Mail, Loader2, Sparkles, RefreshCw, Trash2, Eye, Repeat } from 'lucide-react'
import MultiStepWizard, { WizardStep } from '@/lib/shared/components/MultiStepWizard'

interface Customer {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

interface Reminder {
  id: string
  customer_id: string
  customer: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
  original_message: string
  ai_generated_html: string | null
  subject: string
  scheduled_at: string
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly'
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  sent_count: number
  last_sent_at: string | null
  created_at: string
}

interface RemindersToolConfigWizardProps {
  organizationId: string
  businessName: string
}

export default function RemindersToolConfigWizard({ organizationId, businessName }: RemindersToolConfigWizardProps) {
  // State
  const [customers, setCustomers] = useState<Customer[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [recurrence, setRecurrence] = useState<'once' | 'daily' | 'weekly' | 'monthly'>('once')
  const [aiGeneratedHtml, setAiGeneratedHtml] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  
  // Multi-step wizard
  const [currentStep, setCurrentStep] = useState(1)
  const [showWizard, setShowWizard] = useState(false)
  
  // Loading states
  const [generatingTemplate, setGeneratingTemplate] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)
  const [customersLoading, setCustomersLoading] = useState(true)
  const [remindersLoading, setRemindersLoading] = useState(true)

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

  // Load reminders
  useEffect(() => {
    const loadReminders = async () => {
      try {
        const response = await fetch(`/api/organizations/${organizationId}/reminders`)
        if (response.ok) {
          const data = await response.json()
          setReminders(data.reminders || [])
        } else if (response.status === 401) {
          console.error('Not authenticated. Please log in to access reminders.')
        }
      } catch (error) {
        console.error('Error loading reminders:', error)
      } finally {
        setRemindersLoading(false)
      }
    }

    if (organizationId) {
      loadReminders()
    }
  }, [organizationId])

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
    if (!selectedCustomer || !subject || !message || !scheduledDate || !scheduledTime) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    setSendingReminder(true)
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()

      const response = await fetch(`/api/organizations/${organizationId}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          original_message: message,
          ai_generated_html: aiGeneratedHtml,
          subject,
          scheduled_at: scheduledAt,
          recurrence
        })
      })

      if (response.ok) {
        const data = await response.json()
        setReminders([data.reminder, ...reminders])
        
        // Reset form
        resetWizard()
        setShowWizard(false)
        
        alert('✅ Recordatorio programado exitosamente!')
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
    setSubject('')
    setMessage('')
    setScheduledDate('')
    setScheduledTime('')
    setRecurrence('once')
    setAiGeneratedHtml(null)
    setShowPreview(false)
    setCurrentStep(1)
    setSearchQuery('')
  }

  // Delete reminder
  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm('¿Estás seguro de eliminar este recordatorio?')) return

    try {
      const response = await fetch(`/api/organizations/${organizationId}/reminders/${reminderId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setReminders(reminders.filter(r => r.id !== reminderId))
      } else {
        alert('Error al eliminar recordatorio')
      }
    } catch (error) {
      console.error('Error deleting reminder:', error)
      alert('Error al eliminar recordatorio')
    }
  }

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
      description: 'Selecciona el cliente que recibirá el recordatorio',
      isValid: !!selectedCustomer,
      content: (
        <div className="space-y-4">
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
      onNext: async () => {
        if (!aiGeneratedHtml) {
          return await handleGenerateTemplate(false)
        }
        return true
      },
      content: (
        <div className="space-y-4">
          {!aiGeneratedHtml ? (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--accent-secondary)' }} />
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                Genera una plantilla HTML profesional con IA
              </p>
              <button
                onClick={() => handleGenerateTemplate(false)}
                disabled={generatingTemplate}
                className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 mx-auto disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--accent-secondary)',
                  color: 'white'
                }}
              >
                {generatingTemplate ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generar Plantilla
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex-1 py-2 px-4 rounded-lg border font-medium flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-secondary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <Eye className="h-4 w-4" />
                  {showPreview ? 'Ocultar' : 'Ver'} Vista Previa
                </button>
                <button
                  onClick={() => handleGenerateTemplate(true)}
                  disabled={generatingTemplate}
                  className="flex-1 py-2 px-4 rounded-lg border font-medium flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-secondary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerar
                </button>
              </div>

              {showPreview && (
                <div 
                  className="p-4 rounded-lg border max-h-96 overflow-y-auto"
                  style={{
                    backgroundColor: 'white',
                    borderColor: 'var(--border-secondary)'
                  }}
                  dangerouslySetInnerHTML={{ __html: aiGeneratedHtml }}
                />
              )}
            </div>
          )}
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
  ], [selectedCustomer, subject, message, aiGeneratedHtml, recurrence, scheduledDate, scheduledTime, searchQuery, customersLoading, filteredCustomers, generatingTemplate, showPreview, today])

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Create Reminder Wizard */}
        <div>
          <div 
            className="p-6 rounded-lg border min-h-[600px]"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)'
            }}
          >
            {!showWizard ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Sparkles className="h-16 w-16 mb-4" style={{ color: 'var(--accent-secondary)' }} />
                <h4 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Crear Nuevo Recordatorio
                </h4>
                <p className="text-sm mb-6 max-w-md" style={{ color: 'var(--text-secondary)' }}>
                  Sigue los pasos para crear un recordatorio personalizado con plantilla generada por IA
                </p>
                <button
                  onClick={() => setShowWizard(true)}
                  className="px-6 py-3 rounded-lg font-semibold"
                  style={{
                    backgroundColor: 'var(--accent-secondary)',
                    color: 'white'
                  }}
                >
                  Comenzar
                </button>
              </div>
            ) : (
              <MultiStepWizard
                steps={wizardSteps}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
                onComplete={handleSendReminder}
                onCancel={() => {
                  resetWizard()
                  setShowWizard(false)
                }}
                isSubmitting={sendingReminder}
                submitLabel="Programar Recordatorio"
                cancelLabel="Cancelar"
              />
            )}
          </div>
        </div>

        {/* Right: Reminders List */}
        <div>
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)'
            }}
          >
            <h4 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              Recordatorios Programados
            </h4>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {remindersLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" style={{ color: 'var(--text-muted)' }} />
                </div>
              ) : reminders.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    No hay recordatorios programados
                  </p>
                </div>
              ) : (
                reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="p-3 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-secondary)'
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                          {reminder.subject}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          Para: {reminder.customer.full_name || reminder.customer.email}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteReminder(reminder.id)}
                        className="ml-2 p-1 rounded-md hover:bg-red-500/10 transition-colors"
                        style={{ color: 'var(--text-danger)' }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Calendar className="h-3 w-3" />
                      {new Date(reminder.scheduled_at).toLocaleDateString('es', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span 
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          reminder.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                          reminder.status === 'sent' ? 'bg-green-500/20 text-green-600' :
                          reminder.status === 'failed' ? 'bg-red-500/20 text-red-600' :
                          'bg-gray-500/20 text-gray-600'
                        }`}
                      >
                        {reminder.status === 'pending' && '⏳ Pendiente'}
                        {reminder.status === 'sent' && '✅ Enviado'}
                        {reminder.status === 'failed' && '❌ Fallido'}
                        {reminder.status === 'cancelled' && '🚫 Cancelado'}
                      </span>
                      <span 
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ 
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-muted)'
                        }}
                      >
                        {reminder.recurrence === 'once' && '📅 Una vez'}
                        {reminder.recurrence === 'daily' && '🔄 Diario'}
                        {reminder.recurrence === 'weekly' && '📅 Semanal'}
                        {reminder.recurrence === 'monthly' && '📆 Mensual'}
                      </span>
                    </div>

                    {reminder.sent_count > 0 && (
                      <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                        Enviado {reminder.sent_count} {reminder.sent_count === 1 ? 'vez' : 'veces'}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

