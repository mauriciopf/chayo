import React from 'react'
import { useTranslations } from 'next-intl'

const ChatEmptyState: React.FC = () => {
  const t = useTranslations('chat')
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('emptyTitle')}</h3>
        <p className="text-gray-600 mb-4">{t('emptySubtitle')}</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <p className="text-sm text-blue-800 mb-2"><strong>{t('emptyGettingStarted')}</strong></p>
          <ul className="text-sm text-blue-700 space-y-1">
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