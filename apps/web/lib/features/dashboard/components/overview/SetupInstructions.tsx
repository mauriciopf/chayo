'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

interface SetupInstructionsProps {
  onRetry: () => void
}

export default function SetupInstructions({ onRetry }: SetupInstructionsProps) {
  const [showInstructions, setShowInstructions] = useState(false)
  const t = useTranslations('setupInstructions')

  return (
    <div 
      className="rounded-lg shadow p-8 text-center max-w-2xl mx-auto"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      >
        <svg 
          className="w-8 h-8" 
          style={{ color: 'var(--text-secondary)' }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h3 
        className="text-xl font-semibold mb-3"
        style={{ color: 'var(--text-primary)' }}
      >
        {t('title')}
      </h3>
      
      <p 
        className="mb-6"
        style={{ color: 'var(--text-secondary)' }}
      >
        {t('description')}
      </p>

      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="px-4 py-2 border rounded-md transition-colors"
          style={{
            borderColor: 'var(--border-primary)',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {showInstructions ? t('hideInstructions') : t('showInstructions')}
        </button>
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-md transition-colors"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--text-primary)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
        >
          {t('retry')}
        </button>
      </div>

      {showInstructions && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="text-left rounded-lg p-6 border"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderColor: 'var(--border-primary)'
          }}
        >
          <h4 
            className="font-semibold mb-3"
            style={{ color: 'var(--text-primary)' }}
          >{t('showInstructions')}:</h4>
          <ol 
            className="list-decimal list-inside space-y-2 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            <li>{t('step1')}</li>
            <li>{t('step2')}</li>
            <li>{t('step3')}</li>
            <li>{t('step4')}</li>
          </ol>
          
          <div 
            className="mt-4 p-3 border rounded"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-primary)'
            }}
          >
            <p 
              className="text-sm"
              style={{ color: 'var(--text-primary)' }}
            >
              <strong>What this does:</strong> Creates the database tables needed for automatic organization setup. 
              After this one-time setup, every user will automatically get their own organization when they log in.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
