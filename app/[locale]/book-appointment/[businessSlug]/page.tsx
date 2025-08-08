"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import AppointmentCalendar from '@/lib/features/tools/appointments/components/AppointmentCalendar'
import { Agent, Organization } from '@/lib/shared/types'
import { supabase } from '@/lib/shared/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function BookAppointmentPage() {
  const params = useParams<{ businessSlug: string; locale: string }>()
  const businessSlug = (params as any)?.businessSlug as string
  const locale = (params as any)?.locale as string
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        if (!businessSlug) {
          setError('No business slug provided')
          setLoading(false)
          return
        }

        // Fetch organization by slug
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', businessSlug)
          .single()

        if (orgError || !orgData) {
          setError('Business not found')
          setLoading(false)
          return
        }

        setOrganization(orgData)
        setLoading(false)
      } catch (err) {
        setError('Failed to load booking page')
        setLoading(false)
      }
    }

    fetchOrganization()
  }, [businessSlug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando calendario...</p>
        </div>
      </div>
    )
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Página No Disponible</h1>
          <p className="text-gray-600 mb-4">{error || 'Esta página de citas no está disponible'}</p>
          <p className="text-sm text-gray-500">Por favor contacta al negocio directamente</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Mobile-First Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link 
            href={`/${locale}/client-chat/${businessSlug}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {organization.name}
            </h1>
            <p className="text-sm text-gray-500">Agendar cita</p>
          </div>
        </div>
      </div>

      {/* Calendar Container - Mobile Optimized */}
      <div className="max-w-md mx-auto px-4 py-6">
        <AppointmentCalendar 
          organizationId={organization.id}
          businessName={organization.name}
          className="w-full"
        />
      </div>

      {/* Footer */}
      <div className="text-center py-6 px-4 bg-white/80 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Powered by Chayo AI • Tu Comadre Digital
        </p>
      </div>
    </div>
  )
}