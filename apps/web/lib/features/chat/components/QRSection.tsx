import ClientQRCode from './ClientQRCode'
import React from 'react'
import { useOnboardingProgress } from '../../onboarding/hooks/useOnboardingProgress'

export default function QRSection({ show, dashboardInit }: { show: boolean, dashboardInit: any }) {
  const { progress: onboardingProgress } = useOnboardingProgress(dashboardInit?.initData?.business?.id)
  
  if (!show || !dashboardInit?.initData?.business) return null
  return (
    <div className="w-full max-w-4xl mx-auto my-8">
      <ClientQRCode 
        organizationSlug={dashboardInit.initData.business.slug || ''} 
        isOnboardingCompleted={onboardingProgress.isCompleted}
        onboardingProgress={onboardingProgress}
      />
    </div>
  )
} 