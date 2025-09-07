import React from 'react'
import { useTranslations } from 'next-intl'

const ChatEmptyState: React.FC = () => {
  const t = useTranslations('chat')
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          <svg className="w-8 h-8" style={{ color: 'var(--text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('emptyTitle')}</h3>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>{t('emptySubtitle')}</p>
        <div 
          className="rounded-lg p-4 text-left border"
          style={{ 
            backgroundColor: 'var(--bg-tertiary)',
            borderColor: 'var(--border-secondary)'
          }}
        >
          <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}><strong>{t('emptyGettingStarted')}</strong></p>
          <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
            <li>• {t('emptyStepBusiness')}</li>
            <li>• {t('emptyStepChallenges')}</li>
            <li>• {t('emptyStepUpload')}</li>
            <li>• {t('emptyStepAsk')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ChatEmptyState 