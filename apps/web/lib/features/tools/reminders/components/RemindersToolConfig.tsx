'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Send, User, Mail, Loader2, Sparkles, RefreshCw, Trash2, Eye } from 'lucide-react'

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

interface RemindersToolConfigProps {
  organizationId: string
  businessName: string
}

export default function RemindersToolConfig({ organizationId, businessName }: RemindersToolConfigProps) {
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
  
  // Loading states
  const [loading, setLoading] = useState(false)
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
    if (!message || !subject) return

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
      } else {
        alert('Error al generar plantilla. Por favor intenta de nuevo.')
      }
    } catch (error) {
      console.error('Error generating template:', error)
      alert('Error al generar plantilla.')
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
        setSelectedCustomer(null)
        setSubject('')
        setMessage('')
        setScheduledDate('')
        setScheduledTime('')
        setRecurrence('once')
        setAiGeneratedHtml(null)
        setShowPreview(false)
        
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

  // Filter customers by search
  const filteredCustomers = customers.filter(c =>
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

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
        {/* Left: Create Reminder */}
        <div className="space-y-4">
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)'
            }}
          >
            <h4 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              Crear Recordatorio
            </h4>

            {/* Customer Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                <User className="inline h-4 w-4 mr-1" />
                Seleccionar Cliente
              </label>
              
              {/* Search */}
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-md border mb-2"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-secondary)',
                  color: 'var(--text-primary)'
                }}
              />

              {/* Customer List */}
              <div 
                className="max-h-48 overflow-y-auto space-y-2 p-2 rounded-md border"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-secondary)'
                }}
              >
                {customersLoading ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" style={{ color: 'var(--text-muted)' }} />
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                    No hay clientes disponibles
                  </p>
                ) : (
                  filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className={`w-full text-left p-2 rounded-md transition-colors ${
                        selectedCustomer?.id === customer.id ? 'ring-2' : ''
                      }`}
                      style={{
                        backgroundColor: selectedCustomer?.id === customer.id 
                          ? 'var(--accent-secondary)' 
                          : 'var(--bg-secondary)',
                        color: selectedCustomer?.id === customer.id 
                          ? 'white' 
                          : 'var(--text-primary)',
                        ringColor: 'var(--accent-secondary)'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
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
                          <p className="text-sm font-medium truncate">
                            {customer.full_name || customer.email}
                          </p>
                          {customer.full_name && (
                            <p className="text-xs truncate opacity-80">{customer.email}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Subject */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                <Mail className="inline h-4 w-4 mr-1" />
                Asunto del Email
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej: Recordatorio de tu cita"
                className="w-full px-3 py-2 rounded-md border"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-secondary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Mensaje
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                rows={4}
                className="w-full px-3 py-2 rounded-md border resize-none"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-secondary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            {/* AI Generate Button */}
            <button
              onClick={() => handleGenerateTemplate(false)}
              disabled={!message || !subject || generatingTemplate}
              className="w-full mb-4 py-2 px-4 rounded-md font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--accent-secondary)',
                color: 'white'
              }}
            >
              {generatingTemplate ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generar Plantilla con IA
                </>
              )}
            </button>

            {/* Preview & Regenerate */}
            {aiGeneratedHtml && (
              <div className="mb-4 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex-1 py-2 px-4 rounded-md border font-medium flex items-center justify-center gap-2"
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
                    className="flex-1 py-2 px-4 rounded-md border font-medium flex items-center justify-center gap-2"
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
                    className="p-4 rounded-md border max-h-96 overflow-y-auto"
                    style={{
                      backgroundColor: 'white',
                      borderColor: 'var(--border-secondary)'
                    }}
                    dangerouslySetInnerHTML={{ __html: aiGeneratedHtml }}
                  />
                )}
              </div>
            )}

            {/* Schedule */}
            <div className="mb-4 grid grid-cols-2 gap-3">
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
                  className="w-full px-3 py-2 rounded-md border"
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
                  className="w-full px-3 py-2 rounded-md border"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Recurrence */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Frecuencia
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['once', 'daily', 'weekly', 'monthly'] as const).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setRecurrence(freq)}
                    className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      recurrence === freq ? 'ring-2' : ''
                    }`}
                    style={{
                      backgroundColor: recurrence === freq 
                        ? 'var(--accent-secondary)' 
                        : 'var(--bg-tertiary)',
                      color: recurrence === freq ? 'white' : 'var(--text-primary)',
                      borderColor: 'var(--border-secondary)',
                      ringColor: 'var(--accent-secondary)'
                    }}
                  >
                    {freq === 'once' && 'Una vez'}
                    {freq === 'daily' && 'Diario'}
                    {freq === 'weekly' && 'Semanal'}
                    {freq === 'monthly' && 'Mensual'}
                  </button>
                ))}
              </div>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendReminder}
              disabled={sendingReminder || !selectedCustomer || !subject || !message || !scheduledDate || !scheduledTime}
              className="w-full py-3 px-4 rounded-md font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'white'
              }}
            >
              {sendingReminder ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Programando...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Programar Recordatorio
                </>
              )}
            </button>
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

