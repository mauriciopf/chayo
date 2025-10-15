'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Send, User, Mail, Loader2, Trash2, Edit, Eye, RefreshCw, Plus, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Customer {
  id: string
  email: string
  full_name: string | null
  organization_id: string
  organization_ids: string[]
  created_at: string
  updated_at: string
}

interface Reminder {
  id: string
  organization_id: string
  customer_id: string | null
  manual_email?: string | null
  manual_name?: string | null
  original_message: string
  ai_generated_html: string | null
  subject: string
  scheduled_at: string
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly'
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  sent_at: string | null
  error_message: string | null
  created_at: string
  updated_at: string
  customer?: Customer
}

interface RemindersManagementViewProps {
  organizationId: string
  businessName: string
  onCreateNew: () => void
}

export default function RemindersManagementView({ 
  organizationId, 
  businessName,
  onCreateNew 
}: RemindersManagementViewProps) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)

  // Filter states
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'sent' | 'failed' | 'cancelled'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Load reminders and customers
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [remindersRes, customersRes] = await Promise.all([
          fetch(`/api/organizations/${organizationId}/reminders`),
          fetch(`/api/organizations/${organizationId}/customers`)
        ])

        if (remindersRes.ok && customersRes.ok) {
          const remindersData = await remindersRes.json()
          const customersData = await customersRes.json()
          
          const customersMap = new Map(customersData.customers.map((c: Customer) => [c.id, c]))
          
          const remindersWithCustomers = remindersData.reminders.map((r: Reminder) => ({
            ...r,
            customer: customersMap.get(r.customer_id)
          }))

          setReminders(remindersWithCustomers)
          setCustomers(customersData.customers)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (organizationId) {
      loadData()
    }
  }, [organizationId])

  // Delete reminder
  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm('¿Estás seguro de eliminar este recordatorio?')) return

    try {
      const response = await fetch(`/api/organizations/${organizationId}/reminders/${reminderId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setReminders(reminders.filter(r => r.id !== reminderId))
        if (selectedReminder?.id === reminderId) {
          setSelectedReminder(null)
        }
      } else {
        alert('Error al eliminar recordatorio')
      }
    } catch (error) {
      console.error('Error deleting reminder:', error)
      alert('Error al eliminar recordatorio')
    }
  }

  // Cancel reminder
  const handleCancelReminder = async (reminderId: string) => {
    if (!confirm('¿Estás seguro de cancelar este recordatorio?')) return

    try {
      const reminder = reminders.find(r => r.id === reminderId)
      if (!reminder) return

      const response = await fetch(`/api/organizations/${organizationId}/reminders/${reminderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reminder,
          status: 'cancelled'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setReminders(reminders.map(r => r.id === reminderId ? { ...data.reminder, customer: r.customer } : r))
        if (selectedReminder?.id === reminderId) {
          setSelectedReminder({ ...data.reminder, customer: reminder.customer })
        }
      } else {
        alert('Error al cancelar recordatorio')
      }
    } catch (error) {
      console.error('Error cancelling reminder:', error)
      alert('Error al cancelar recordatorio')
    }
  }

  // Filter reminders
  const filteredReminders = reminders.filter(reminder => {
    const matchesStatus = filterStatus === 'all' || reminder.status === filterStatus
    const matchesSearch = !searchQuery || 
      reminder.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.customer?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.manual_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.manual_email?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  // Get status badge
  const getStatusBadge = (status: Reminder['status']) => {
    const config = {
      pending: { label: 'Pendiente', icon: Clock, color: 'text-yellow-500 bg-yellow-500/10' },
      sent: { label: 'Enviado', icon: CheckCircle, color: 'text-green-500 bg-green-500/10' },
      failed: { label: 'Fallido', icon: XCircle, color: 'text-red-500 bg-red-500/10' },
      cancelled: { label: 'Cancelado', icon: AlertCircle, color: 'text-gray-500 bg-gray-500/10' }
    }

    const { label, icon: Icon, color } = config[status]

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="h-3 w-3" />
        {label}
      </span>
    )
  }

  // Get recurrence label
  const getRecurrenceLabel = (recurrence: Reminder['recurrence']) => {
    const labels = {
      once: 'Una vez',
      daily: 'Diario',
      weekly: 'Semanal',
      monthly: 'Mensual'
    }
    return labels[recurrence]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--accent-secondary)' }} />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              📧 Gestión de Recordatorios
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Administra tus recordatorios programados y su historial
            </p>
          </div>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: 'var(--accent-secondary)', color: 'white' }}
          >
            <Plus className="h-5 w-5" />
            Crear Recordatorio
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por asunto, cliente o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-secondary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-secondary)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="sent">Enviados</option>
            <option value="failed">Fallidos</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {filteredReminders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Mail className="h-16 w-16 mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {searchQuery || filterStatus !== 'all' ? 'No se encontraron recordatorios' : 'No hay recordatorios'}
          </h3>
          <p className="text-sm text-center mb-6" style={{ color: 'var(--text-secondary)' }}>
            {searchQuery || filterStatus !== 'all' 
              ? 'Intenta cambiar los filtros de búsqueda' 
              : 'Crea tu primer recordatorio para comenzar'}
          </p>
          {!searchQuery && filterStatus === 'all' && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: 'var(--accent-secondary)', color: 'white' }}
            >
              <Plus className="h-5 w-5" />
              Crear Recordatorio
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          {/* Left: Reminders List */}
          <div
            className="rounded-lg border p-4 flex flex-col overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)'
            }}
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Mail className="h-5 w-5" />
              Recordatorios ({filteredReminders.length})
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3">
              {filteredReminders.map((reminder) => (
                <button
                  key={reminder.id}
                  onClick={() => setSelectedReminder(reminder)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedReminder?.id === reminder.id ? 'ring-2 ring-purple-500' : ''
                  }`}
                  style={{
                    backgroundColor: selectedReminder?.id === reminder.id
                      ? 'var(--accent-secondary)'
                      : 'var(--bg-tertiary)',
                    borderColor: 'var(--border-secondary)',
                    color: selectedReminder?.id === reminder.id
                      ? 'white'
                      : 'var(--text-primary)'
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm truncate flex-1">{reminder.subject}</h4>
                    {getStatusBadge(reminder.status)}
                  </div>
                  <div className="space-y-1 text-xs opacity-90">
                    <p className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {reminder.customer?.full_name || reminder.customer?.email || reminder.manual_name || reminder.manual_email || 'Cliente desconocido'}
                    </p>
                    <p className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(reminder.scheduled_at), 'PPPp', { locale: es })}
                    </p>
                    <p className="flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      {getRecurrenceLabel(reminder.recurrence)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Reminder Details */}
          <div
            className="rounded-lg border p-4 flex flex-col overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)'
            }}
          >
            {selectedReminder ? (
              <>
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Info className="h-5 w-5" />
                    Detalles del Recordatorio
                  </h3>
                  <div className="flex gap-2">
                    {selectedReminder.status === 'pending' && (
                      <button
                        onClick={() => handleCancelReminder(selectedReminder.id)}
                        className="p-2 rounded-md transition-colors"
                        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-danger)' }}
                        title="Cancelar recordatorio"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteReminder(selectedReminder.id)}
                      className="p-2 rounded-md transition-colors"
                      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-danger)' }}
                      title="Eliminar recordatorio"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Estado
                    </label>
                    {getStatusBadge(selectedReminder.status)}
                  </div>

                  {/* Customer */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Cliente
                    </label>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                        style={{ backgroundColor: 'var(--accent-secondary)', color: 'white' }}
                      >
                        {selectedReminder.customer?.full_name?.[0]?.toUpperCase() || 
                         selectedReminder.customer?.email[0].toUpperCase() ||
                         selectedReminder.manual_name?.[0]?.toUpperCase() ||
                         selectedReminder.manual_email?.[0].toUpperCase() || 'C'}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {selectedReminder.customer?.full_name || selectedReminder.customer?.email || selectedReminder.manual_name || selectedReminder.manual_email || 'Cliente desconocido'}
                        </p>
                        {(selectedReminder.customer?.full_name || selectedReminder.manual_name) && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {selectedReminder.customer?.email || selectedReminder.manual_email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Asunto
                    </label>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {selectedReminder.subject}
                    </p>
                  </div>

                  {/* Schedule */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Programación
                    </label>
                    <div className="space-y-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(selectedReminder.scheduled_at), 'PPPp', { locale: es })}
                      </p>
                      <p className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        {getRecurrenceLabel(selectedReminder.recurrence)}
                      </p>
                    </div>
                  </div>

                  {/* Original Message */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Mensaje Original
                    </label>
                    <p
                      className="text-sm p-3 rounded-md whitespace-pre-wrap"
                      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    >
                      {selectedReminder.original_message}
                    </p>
                  </div>

                  {/* AI Generated HTML */}
                  {selectedReminder.ai_generated_html && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          Email Generado por IA
                        </label>
                        <button
                          onClick={() => setShowPreview(!showPreview)}
                          className="text-xs flex items-center gap-1 px-2 py-1 rounded-md"
                          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-secondary)' }}
                        >
                          <Eye className="h-3 w-3" />
                          {showPreview ? 'Ver HTML' : 'Ver Preview'}
                        </button>
                      </div>
                      <div
                        className="p-3 rounded-md border overflow-auto max-h-64"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          borderColor: 'var(--border-secondary)'
                        }}
                      >
                        {showPreview ? (
                          <iframe
                            srcDoc={selectedReminder.ai_generated_html}
                            title="Email Preview"
                            className="w-full h-full border-none"
                            style={{ minHeight: '200px', backgroundColor: 'white' }}
                          />
                        ) : (
                          <pre className="whitespace-pre-wrap text-xs" style={{ color: 'var(--text-primary)' }}>
                            {selectedReminder.ai_generated_html}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sent/Error Info */}
                  {selectedReminder.sent_at && (
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Enviado el
                      </label>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {format(new Date(selectedReminder.sent_at), 'PPPp', { locale: es })}
                      </p>
                    </div>
                  )}

                  {selectedReminder.error_message && (
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-danger)' }}>
                        Error
                      </label>
                      <p
                        className="text-sm p-3 rounded-md"
                        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-danger)' }}
                      >
                        {selectedReminder.error_message}
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Info className="h-12 w-12 mb-4" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Selecciona un recordatorio para ver sus detalles
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

