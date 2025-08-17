'use client'

import { useTranslations } from 'next-intl'

interface AgentsViewProps {
  className?: string
}

export default function AgentsView({ className = '' }: AgentsViewProps) {
  const t = useTranslations('dashboard')

  return (
    <div className={`w-full h-full bg-white rounded-lg md:shadow-sm md:border md:border-gray-200 p-6 ${className}`}>
      <div className="text-center">
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
      </div>
    </div>
  )
}