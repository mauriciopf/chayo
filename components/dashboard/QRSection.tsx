import ClientQRCode from './ClientQRCode'
import React from 'react'

export default function QRSection({ show, dashboardInit }: { show: boolean, dashboardInit: any }) {
  if (!show || !dashboardInit?.initData?.business) return null
  return (
    <div className="w-full max-w-4xl mx-auto my-8">
      <ClientQRCode 
        organizationSlug={dashboardInit.initData.business.slug || ''} 
        filledFields={dashboardInit.initData.businessInfoFields?.business_info_gathered || 0}
        threshold={dashboardInit.initData.threshold || 10}
      />
    </div>
  )
} 