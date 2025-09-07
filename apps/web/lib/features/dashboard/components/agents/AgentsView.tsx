'use client'

import { useTranslations } from 'next-intl'

interface AgentsViewProps {
  className?: string
}

export default function AgentsView({ className = '' }: AgentsViewProps) {
  const t = useTranslations('dashboard')

  return (
    <div 
      className={`w-full h-full rounded-lg md:shadow-sm md:border p-6 ${className}`}
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-primary)'
      }}
    >
      <div className="text-center">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <svg className="w-8 h-8" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a3 3 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('navigation.agents')}
        </h3>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          Manage your AI agents and their configurations.
        </p>
        <div 
          className="border rounded-lg p-4"
          style={{ 
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-secondary)'
          }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            🚧 This section is under development. Agent management features will be available soon.
          </p>
        </div>
      </div>
    </div>
  )
}