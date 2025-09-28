import ClientQRCode from './ClientQRCode'
import React from 'react'
import { useOnboardingCompletion } from '../../onboarding/hooks/useOnboardingCompletion'

export default function QRSection({ show, dashboardInit }: { show: boolean, dashboardInit: any }) {
  const { isCompleted: isOnboardingCompleted, loading: onboardingLoading } = useOnboardingCompletion(dashboardInit?.initData?.business?.id)
  if (!show || !dashboardInit?.initData?.business) return null
  return (
    <div className="w-full max-w-4xl mx-auto my-8">
      <ClientQRCode 
        organizationSlug={dashboardInit.initData.business.slug || ''} 
        isOnboardingCompleted={isOnboardingCompleted}
      />
    </div>
  )
} 