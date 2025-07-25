import ClientQRCode from './ClientQRCode'
import React from 'react'

export default function QRSection({ show, dashboardInit }: { show: boolean, dashboardInit: any }) {
  if (!show || !dashboardInit?.initData?.business || !dashboardInit?.initData?.agentChatLink) return null
  return (
    <div className="w-full max-w-4xl mx-auto my-8">
      <ClientQRCode organizationSlug={dashboardInit.initData.business.slug || ''} />
    </div>
  )
} 