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
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Citas Agendadas</h3>
        <p className="text-sm text-gray-600">
          Gestiona las citas que los clientes han agendado a través de tu sistema de reservas.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-900">{counts.total}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-800">{counts.pending}</div>
          <div className="text-xs text-yellow-600">Pendientes</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-800">{counts.confirmed}</div>
          <div className="text-xs text-blue-600">Confirmadas</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-800">{counts.completed}</div>
          <div className="text-xs text-green-600">Completadas</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-800">{counts.cancelled}</div>
          <div className="text-xs text-red-600">Canceladas</div>
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
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedStatus === filter.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay citas</h3>
          <p className="text-gray-600">
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
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900">{appointment.client_name}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {getStatusIcon(appointment.status)}
                      {appointment.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
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
                    <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
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
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Confirmar"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                      disabled={updatingId === appointment.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Marcar como completada"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                      disabled={updatingId === appointment.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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