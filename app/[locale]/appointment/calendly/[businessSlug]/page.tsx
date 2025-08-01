'use client'

import React, { useEffect, useState } from 'react'
import { ArrowLeft, Calendar, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import CalendlyEmbed from '@/lib/features/dashboard/components/providers/CalendlyEmbed'

interface CalendlyAppointmentPageProps {
  params: {
    businessSlug: string
    locale: string
  }
}

interface OrganizationData {
  id: string
  name: string
  slug: string
}

interface AppointmentSettings {
  provider: string
  provider_url: string
  settings: any
}

export default function CalendlyAppointmentPage({ params }: CalendlyAppointmentPageProps) {
  const { businessSlug, locale } = params
  const router = useRouter()
  const [organization, setOrganization] = useState<OrganizationData | null>(null)
  const [appointmentSettings, setAppointmentSettings] = useState<AppointmentSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrganizationAndSettings()
  }, [businessSlug])

  const fetchOrganizationAndSettings = async () => {
    try {
      setLoading(true)
      
      // First fetch organization data
      const orgResponse = await fetch(`/api/organizations?slug=${businessSlug}`)
      if (!orgResponse.ok) {
        throw new Error('Organization not found')
      }
      
      const orgData = await orgResponse.json()
      if (!orgData.organizations || orgData.organizations.length === 0) {
        throw new Error('Organization not found')
      }
      
      const org = orgData.organizations[0]
      setOrganization(org)

      // Then fetch appointment settings
      const settingsResponse = await fetch(`/api/organizations/${org.id}/appointment-settings`)
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        if (settingsData.settings && settingsData.settings.provider === 'calendly') {
          setAppointmentSettings(settingsData.settings)
        } else {
          throw new Error('Calendly not configured for this organization')
        }
      } else {
        throw new Error('Appointment settings not found')
      }
    } catch (error: any) {
      console.error('Error fetching data:', error)
      setError(error.message || 'Failed to load appointment booking')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToChat = () => {
    router.push(`/${locale}/client-chat/${businessSlug}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointment booking...</p>
        </div>
      </div>
    )
  }

  if (error || !organization || !appointmentSettings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Not Available</h2>
          <p className="text-gray-600 mb-6">
            {error || 'Appointment booking is not configured for this business.'}
          </p>
          <button
            onClick={handleBackToChat}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Chat
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={handleBackToChat}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Chat</span>
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">Book Appointment</span>
          </div>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Business Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Schedule an Appointment
            </h1>
            <p className="text-gray-600 mb-4">
              Book your appointment with <span className="font-medium">{organization.name}</span>
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <ExternalLink className="w-4 h-4" />
              <span>Powered by Calendly</span>
            </div>
          </div>
        </div>

        {/* Calendly Embed */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <CalendlyEmbed 
            url={appointmentSettings.provider_url}
            height={700}
            className="w-full"
          />
        </div>

        {/* Footer Info */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>
            Having trouble? You can also{' '}
            <button
              onClick={handleBackToChat}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              return to chat
            </button>
            {' '}for assistance.
          </p>
        </div>
      </div>
    </div>
  )
}