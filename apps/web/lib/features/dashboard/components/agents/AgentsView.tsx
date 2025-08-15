'use client'

import { useTranslations } from 'next-intl'

interface AgentsViewProps {
  className?: string
}

export default function AgentsView({ className = '' }: AgentsViewProps) {
  const t = useTranslations('dashboard')

  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768
  }

  const isInStandaloneMode = () => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
  }

  const showPWAPrompt = isMobileDevice() && !isInStandaloneMode()

  return (
    <div className={`w-full h-full bg-white rounded-lg md:shadow-sm md:border md:border-gray-200 p-6 ${className}`}>
      <div className="text-center">
        {showPWAPrompt ? (
          // Mobile PWA Installation Prompt
          <>
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Install Chayo App
            </h3>
            <p className="text-gray-600 mb-6">
              Get the full experience with our mobile app. Install it for faster access and better performance.
            </p>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-purple-900 mb-3">How to Install:</h4>
              <div className="text-left space-y-2 text-sm text-purple-800">
                <div className="flex items-start space-x-2">
                  <span className="inline-block w-6 h-6 bg-purple-500 text-white rounded-full text-xs flex items-center justify-center mt-0.5 flex-shrink-0">1</span>
                  <span>Tap the share button in your browser</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="inline-block w-6 h-6 bg-purple-500 text-white rounded-full text-xs flex items-center justify-center mt-0.5 flex-shrink-0">2</span>
                  <span>Select "Add to Home Screen"</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="inline-block w-6 h-6 bg-purple-500 text-white rounded-full text-xs flex items-center justify-center mt-0.5 flex-shrink-0">3</span>
                  <span>Tap "Add" to install</span>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-800 text-sm">
                <strong>💡 Tip:</strong> Once installed, access your business management tools here and use the app icon for quick chat access.
              </p>
            </div>
          </>
        ) : (
          // Desktop Agents View
          <>
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a3 3 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('navigation.agents')}
            </h3>
            <p className="text-gray-600 mb-4">
              Manage your AI agents and their configurations.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                🚧 This section is under development. Agent management features will be available soon.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 