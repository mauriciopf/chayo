'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock, User, Phone, Mail, Calendar as CalendarIcon } from 'lucide-react'

interface AppointmentCalendarProps {
  organizationId: string
  businessName?: string
  className?: string
}

interface AppointmentDetails {
  date: string
  time: string
  name: string
  email: string
  phone: string
  notes: string
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({ 
  organizationId,
  businessName = 'Nuestro negocio',
  className = '' 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [showTimeSlots, setShowTimeSlots] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [appointmentDetails, setAppointmentDetails] = useState<AppointmentDetails>({
    date: '',
    time: '',
    name: '',
    email: '',
    phone: '',
    notes: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  // Generate available time slots (9 AM to 5 PM)
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00'
  ]

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  }

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isPastDate = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const handleDateSelect = (date: Date) => {
    if (isPastDate(date)) return
    setSelectedDate(date)
    setShowTimeSlots(true)
    setShowBookingForm(false)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setAppointmentDetails(prev => ({
      ...prev,
      date: selectedDate?.toLocaleDateString('es-ES') || '',
      time: time
    }))
    setShowBookingForm(true)
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Format date for API (YYYY-MM-DD)
      const formattedDate = selectedDate ? selectedDate.toISOString().split('T')[0] : ''
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          clientName: appointmentDetails.name,
          clientEmail: appointmentDetails.email,
          clientPhone: appointmentDetails.phone || null,
          appointmentDate: formattedDate,
          appointmentTime: selectedTime,
          serviceType: null, // Can be added later if needed
          notes: appointmentDetails.notes || null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to book appointment')
      }
      
      // Reset form
      setSelectedDate(null)
      setSelectedTime(null)
      setShowTimeSlots(false)
      setShowBookingForm(false)
      setAppointmentDetails({
        date: '',
        time: '',
        name: '',
        email: '',
        phone: '',
        notes: ''
      })
      
      alert('¡Cita agendada exitosamente! Te contactaremos pronto para confirmar.')
    } catch (error) {
      console.error('Error booking appointment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al agendar la cita. Por favor, inténtalo de nuevo.'
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const days = getDaysInMonth(currentDate)
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  return (
    <div className={`rounded-xl shadow-lg border overflow-hidden ${className}`} style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}>
      {/* Mobile-Optimized Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
        <div className="flex items-center gap-2 mb-1">
          <CalendarIcon className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Agendar Cita</h2>
        </div>
        <p className="text-blue-100 text-sm">con {businessName}</p>
        <p className="text-blue-200 text-xs mt-1">Selecciona fecha y hora</p>
      </div>

      <div className="p-4">
        {/* Mobile Calendar Navigation */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 capitalize flex-1">
            {formatMonth(currentDate)}
          </h3>
          <div className="flex space-x-1">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Mobile Calendar Grid */}
        <div className="mb-4">
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days - Optimized for mobile touch */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => (
              <button
                key={index}
                onClick={() => date && handleDateSelect(date)}
                disabled={!date || isPastDate(date)}
                className={`
                  aspect-square flex items-center justify-center text-sm rounded-lg transition-all touch-manipulation min-h-[44px]
                  ${!date ? 'invisible' : ''}
                  ${isPastDate(date) ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-50 cursor-pointer active:bg-blue-100'}
                  ${isToday(date) ? 'bg-blue-100 text-blue-600 font-semibold' : ''}
                  ${selectedDate?.toDateString() === date?.toDateString() ? 'bg-blue-600 text-white font-semibold' : ''}
                `}
              >
                {date?.getDate()}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Time Slots */}
        <AnimatePresence>
          {showTimeSlots && selectedDate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-gray-600" />
                <h4 className="font-medium text-gray-900 text-sm">
                  {selectedDate.toLocaleDateString('es-ES')}
                </h4>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className={`
                      p-3 text-sm rounded-lg border transition-all touch-manipulation min-h-[44px]
                      ${selectedTime === time 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'border-gray-200'
                      } transition-colors`}
                    style={{
                      backgroundColor: selectedTime === time ? undefined : 'var(--bg-tertiary)',
                      color: selectedTime === time ? undefined : 'var(--text-primary)',
                      borderColor: selectedTime === time ? undefined : 'var(--border-primary)'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedTime !== time) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTime !== time) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                      }
                    }}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Booking Form */}
        <AnimatePresence>
          {showBookingForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2 text-sm">
                  <User className="w-4 h-4" />
                  Datos para la cita
                </h4>
                
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  {/* Selected date and time display */}
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <p className="text-blue-800 font-medium text-sm">
                      📅 {appointmentDetails.date} a las {appointmentDetails.time}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={appointmentDetails.name}
                        onChange={(e) => setAppointmentDetails(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        placeholder="Tu nombre completo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        required
                        value={appointmentDetails.phone}
                        onChange={(e) => setAppointmentDetails(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        placeholder="Tu número de teléfono"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email (opcional)
                      </label>
                      <input
                        type="email"
                        value={appointmentDetails.email}
                        onChange={(e) => setAppointmentDetails(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        placeholder="tu@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notas adicionales
                      </label>
                      <textarea
                        value={appointmentDetails.notes}
                        onChange={(e) => setAppointmentDetails(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        rows={3}
                        placeholder="¿Algo específico que debamos saber?"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBookingForm(false)
                        setSelectedTime(null)
                      }}
                      className="flex-1 px-4 py-3 border rounded-lg transition-colors touch-manipulation min-h-[44px]"
                      style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !appointmentDetails.name || !appointmentDetails.phone}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation min-h-[44px]"
                    >
                      {isLoading ? 'Agendando...' : 'Confirmar Cita'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AppointmentCalendar