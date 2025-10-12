'use client'

import { Suspense, useState, useEffect } from 'react'
import ChayoAIHome from '@/components/marketing/ChayoAIHome'
import MobileLandingPage from '@/components/marketing/MobileLandingPage'
import { isMobileDevice } from '@/lib/utils/deviceDetection'

export default function HomePage() {
  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user wants to force desktop view
    const params = new URLSearchParams(window.location.search)
    const forceDesktop = params.get('forceDesktop') === 'true'
    
    // Detect device on client side (but respect forceDesktop override)
    setIsMobile(!forceDesktop && isMobileDevice())
    setIsLoading(false)
  }, [])

  // Show loading state while detecting device
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="flex items-center gap-3 justify-center mb-4">
            <span className="text-white text-5xl font-bold tracking-tight">Chayo</span>
            <span className="w-4 h-4 bg-purple-500 rounded-full animate-pulse"></span>
          </div>
          <p className="text-gray-400 text-lg">Cargando...</p>
        </div>
      </div>
    )
  }

  // Show mobile experience for mobile devices (unless forceDesktop is set)
  if (isMobile) {
    return (
      <Suspense fallback={<div>Cargando...</div>}>
        <MobileLandingPage videoUrl="/demo-video.mp4" />
      </Suspense>
    )
  }

  // Show desktop experience for desktop/tablet
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ChayoAIHome />
    </Suspense>
  )
}
