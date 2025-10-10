'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, User, Package, Filter, RefreshCw } from 'lucide-react'

interface Reservation {
  id: string
  product_id: string
  client_name: string
  client_email: string
  client_phone?: string
  reservation_date: string
  reservation_time: string
  notes?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  created_at: string
  products_list_tool?: {
    id: string
    name: string
    price?: number
  }
}

interface ReservationsManagementViewProps {
  organizationId: string
}

export default function ReservationsManagementView({
  organizationId,
}: ReservationsManagementViewProps) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  const loadReservations = async () => {
    setLoading(true)
    try {
      const statusParam = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      const response = await fetch(`/api/organizations/${organizationId}/reservations${statusParam}`)
      
      if (response.ok) {
        const data = await response.json()
        setReservations(data.reservations || [])
      }
    } catch (error) {
      console.error('Error loading reservations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (organizationId) {
      loadReservations()
    }
  }, [organizationId, statusFilter])

  const updateReservationStatus = async (reservationId: string, newStatus: string) => {
    setUpdating(reservationId)
    try {
      const response = await fetch(`/api/organizations/${organizationId}/reservations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId, status: newStatus }),
      })

      if (response.ok) {
        await loadReservations()
      }
    } catch (error) {
      console.error('Error updating reservation:', error)
    } finally {
      setUpdating(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'no_show': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Completada',
      no_show: 'No se presentó',
    }
    return labels[status] || status
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    return `${hours}:${minutes}`
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 
            className="text-3xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Gestión de Reservaciones
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Administra todas las reservaciones de tus clientes
          </p>
        </div>
        <button
          onClick={loadReservations}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <RefreshCw 
            className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
            style={{ color: 'var(--text-secondary)' }}
          />
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="all">Todas</option>
          <option value="pending">Pendientes</option>
          <option value="confirmed">Confirmadas</option>
          <option value="completed">Completadas</option>
          <option value="cancelled">Canceladas</option>
          <option value="no_show">No se presentó</option>
        </select>
      </div>

      {/* Reservations List */}
      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
          Cargando reservaciones...
        </div>
      ) : reservations.length === 0 ? (
        <div 
          className="text-center py-12 rounded-lg border"
          style={{ 
            backgroundColor: 'var(--bg-tertiary)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-secondary)'
          }}
        >
          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No hay reservaciones {statusFilter !== 'all' ? `con estado "${getStatusLabel(statusFilter)}"` : ''}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
              }}
            >
              {/* Product & Status Row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <Package className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                  <div>
                    <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                      {reservation.products_list_tool?.name || 'Producto'}
                    </p>
                    {reservation.products_list_tool?.price && (
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        ${reservation.products_list_tool.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(reservation.status)}`}
                >
                  {getStatusLabel(reservation.status)}
                </span>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ color: 'var(--text-primary)' }}>
                    {formatDate(reservation.reservation_date)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ color: 'var(--text-primary)' }}>
                    {formatTime(reservation.reservation_time)}
                  </span>
                </div>
              </div>

              {/* Client Info */}
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                <span style={{ color: 'var(--text-primary)' }}>
                  {reservation.client_name}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>•</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {reservation.client_email}
                </span>
                {reservation.client_phone && (
                  <>
                    <span style={{ color: 'var(--text-secondary)' }}>•</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {reservation.client_phone}
                    </span>
                  </>
                )}
              </div>

              {/* Notes */}
              {reservation.notes && (
                <div 
                  className="text-sm p-3 rounded mb-4"
                  style={{ 
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <strong>Notas:</strong> {reservation.notes}
                </div>
              )}

              {/* Status Actions */}
              {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
                <div className="flex gap-2">
                  {reservation.status === 'pending' && (
                    <button
                      onClick={() => updateReservationStatus(reservation.id, 'confirmed')}
                      disabled={updating === reservation.id}
                      className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        borderColor: 'var(--accent-primary)',
                        color: '#FFFFFF',
                      }}
                    >
                      ✓ Confirmar
                    </button>
                  )}
                  {reservation.status === 'confirmed' && (
                    <button
                      onClick={() => updateReservationStatus(reservation.id, 'completed')}
                      disabled={updating === reservation.id}
                      className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        borderColor: 'var(--accent-primary)',
                        color: '#FFFFFF',
                      }}
                    >
                      ✓ Completar
                    </button>
                  )}
                  <button
                    onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
                    disabled={updating === reservation.id}
                    className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    ✕ Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

