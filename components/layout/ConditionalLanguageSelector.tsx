'use client'

import { usePathname } from 'next/navigation'
import LanguageSelector from './LanguageSelector'

export default function ConditionalLanguageSelector() {
  const pathname = usePathname()
  
  // Don't show language selector on dashboard pages
  const isDashboardPage = pathname.includes('/dashboard')
  
  if (isDashboardPage) {
    return null
  }
  
  return <LanguageSelector />
}