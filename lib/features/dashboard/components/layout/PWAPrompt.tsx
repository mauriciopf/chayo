'use client'

import { useState, useEffect } from 'react'

interface PWAPromptProps {
  onDismiss?: () => void
}

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
}

export default function PWAPrompt({ onDismiss }: PWAPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (isMobileDevice() && !isInStandaloneMode()) {
      setShowPrompt(true)
    }
  }, [])

  const handleDismiss = () => {
    setShowPrompt(false)
    onDismiss?.()
  }

  if (!showPrompt) return null

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = /Android/.test(navigator.userAgent)

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Install Chayo AI
            </h3>
            <p className="text-xs text-gray-600 mb-2">
              {isIOS ? (
                <>Tap <strong>Share</strong> → <strong>Add to Home Screen</strong></>
              ) : isAndroid ? (
                <>Tap <strong>Menu (⋮)</strong> → <strong>Install app</strong></>
              ) : (
                <>Add to your home screen for quick access</>
              )}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export { isMobileDevice, isInStandaloneMode } 