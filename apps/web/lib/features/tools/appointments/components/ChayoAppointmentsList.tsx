'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, User, Mail, Phone, MessageCircle, Check, X, RotateCcw } from 'lucide-react'

interface Appointment {
  id: string
  client_name: string
  client_email: string
  client_phone?: string
  appointment_date: string
  appointment_time: string
  service_type?: string
  notes?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  created_at: string
  updated_at: string
}

interface AppointmentCounts {
  total: number
  pending: number
  confirmed: number
  completed: number
  cancelled: number
}

interface ChayoAppointmentsListProps {
  organizationId: string
}

export default function ChayoAppointmentsList({ organizationId }: ChayoAppointmentsListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [counts, setCounts] = useState<AppointmentCounts>({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const statusFilter = selectedStatus !== 'all' ? `?status=${selectedStatus}` : ''
      const response = await fetch(`/api/organizations/${organizationId}/appointments${statusFilter}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch appointments')
      }

      const data = await response.json()
      setAppointments(data.appointments || [])
      setCounts(data.counts || counts)
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      setUpdatingId(appointmentId)
      
      const response = await fetch(`/api/organizations/${organizationId}/appointments`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          status: newStatus
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update appointment')
      }

      // Reload appointments to get updated data
      await loadAppointments()
    } catch (error) {
      console.error('Error updating appointment:', error)
      alert('Error updating appointment status')
    } finally {
      setUpdatingId(null)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [organizationId, selectedStatus])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { backgroundColor: 'var(--bg-tertiary)', color: '#f59e0b' }
      case 'confirmed': return { backgroundColor: 'var(--bg-tertiary)', color: '#3b82f6' }
      case 'completed': return { backgroundColor: 'var(--bg-tertiary)', color: '#22c55e' }
      case 'cancelled': return { backgroundColor: 'var(--bg-tertiary)', color: '#ef4444' }
      default: return { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <Check className="w-3 h-3" />
      case 'completed': return <Check className="w-3 h-3" />
      case 'cancelled': return <X className="w-3 h-3" />
      default: return <Clock className="w-3 h-3" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: 'var(--accent-primary)' }}
          ></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 
          className="text-lg font-medium mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Citas Agendadas
        </h3>
        <p 
          className="text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Gestiona las citas que los clientes han agendado a través de tu sistema de reservas.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div 
          className="p-3 rounded-lg text-center"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <div 
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {counts.total}
          </div>
          <div 
            className="text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            Total
          </div>
        </div>
        <div 
          className="p-3 rounded-lg text-center"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <div 
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {counts.pending}
          </div>
          <div 
            className="text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            Pendientes
          </div>
        </div>
        <div 
          className="p-3 rounded-lg text-center"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <div 
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {counts.confirmed}
          </div>
          <div 
            className="text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            Confirmadas
          </div>
        </div>
        <div 
          className="p-3 rounded-lg text-center"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <div 
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {counts.completed}
          </div>
          <div 
            className="text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            Completadas
          </div>
        </div>
        <div 
          className="p-3 rounded-lg text-center"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <div 
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {counts.cancelled}
          </div>
          <div 
            className="text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            Canceladas
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'Todas' },
          { value: 'pending', label: 'Pendientes' },
          { value: 'confirmed', label: 'Confirmadas' },
          { value: 'completed', label: 'Completadas' },
          { value: 'cancelled', label: 'Canceladas' }
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setSelectedStatus(filter.value)}
            className="px-3 py-1 rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor: selectedStatus === filter.value ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
              color: selectedStatus === filter.value ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
            onMouseEnter={(e) => {
              if (selectedStatus !== filter.value) {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedStatus !== filter.value) {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
              }
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
          <h3 
            className="text-lg font-medium mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            No hay citas
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {selectedStatus === 'all' 
              ? 'Aún no se han agendado citas a través de tu sistema.'
              : `No hay citas con estado "${selectedStatus}".`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              style={{ 
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                      <span 
                        className="font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {appointment.client_name}
                      </span>
                    </div>
                    <span 
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                      style={getStatusColor(appointment.status)}
                    >
                      {getStatusIcon(appointment.status)}
                      {appointment.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div 
                    className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(appointment.appointment_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(appointment.appointment_time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{appointment.client_email}</span>
                    </div>
                    {appointment.client_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{appointment.client_phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {appointment.notes && (
                    <div 
                      className="mt-3 flex items-start gap-2 text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{appointment.notes}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {appointment.status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                      disabled={updatingId === appointment.id}
                      className="p-2 rounded-lg transition-colors disabled:opacity-50"
                      style={{ color: '#22c55e' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="Confirmar"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                      disabled={updatingId === appointment.id}
                      className="p-2 rounded-lg transition-colors disabled:opacity-50"
                      style={{ color: '#ef4444' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {appointment.status === 'confirmed' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                      disabled={updatingId === appointment.id}
                      className="p-2 rounded-lg transition-colors disabled:opacity-50"
                      style={{ color: '#3b82f6' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="Marcar como completada"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                      disabled={updatingId === appointment.id}
                      className="p-2 rounded-lg transition-colors disabled:opacity-50"
                      style={{ color: '#ef4444' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}