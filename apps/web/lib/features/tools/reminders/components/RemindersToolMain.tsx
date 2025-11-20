'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import RemindersManagementView from './RemindersManagementView'
import RemindersToolConfigWizard from './RemindersToolConfigWizard'

interface RemindersToolMainProps {
  organizationId: string
  businessName: string
  propertyId?: string
}

type View = 'loading' | 'create' | 'manage'

export default function RemindersToolMain({ organizationId, businessName, propertyId }: RemindersToolMainProps) {
  const [currentView, setCurrentView] = useState<View>('loading')
  const [hasReminders, setHasReminders] = useState(false)

  // Check if user has existing reminders
  useEffect(() => {
    const checkReminders = async () => {
      try {
        const response = await fetch(`/api/organizations/${organizationId}/reminders`)
        if (response.ok) {
          const data = await response.json()
          const remindersExist = data.reminders && data.reminders.length > 0
          setHasReminders(remindersExist)
          // If has reminders, show management view, otherwise show create view
          setCurrentView(remindersExist ? 'manage' : 'create')
        } else {
          // On error, default to create view
          setCurrentView('create')
        }
      } catch (error) {
        console.error('Error checking reminders:', error)
        // On error, default to create view
        setCurrentView('create')
      }
    }

    if (organizationId) {
      checkReminders()
    }
  }, [organizationId])

  // Loading state
  if (currentView === 'loading') {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--accent-secondary)' }} />
      </div>
    )
  }

  // Create view - show wizard
  if (currentView === 'create') {
    return (
      <div className="h-full overflow-auto p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <RemindersToolConfigWizard 
          organizationId={organizationId}
          businessName={businessName}
        />
      </div>
    )
  }

  // Manage view - show management view (has "Crear Recordatorio" button built-in)
  return (
    <RemindersManagementView
      organizationId={organizationId}
      businessName={businessName}
      onCreateNew={() => setCurrentView('create')}
      onNoReminders={() => setCurrentView('create')}
    />
  )
}

