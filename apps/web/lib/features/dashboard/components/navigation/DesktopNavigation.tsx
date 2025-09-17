'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { ActiveView } from '../../../../shared/types'

interface DesktopNavigationProps {
  activeView: ActiveView
  onViewChange: (view: ActiveView) => void
  onLogout: () => void
  onManageBilling: () => void
  user: any
  subscription: any
  businessName: string
}

export default function DesktopNavigation({
  activeView,
  onViewChange,
  onLogout,
  onManageBilling,
  user,
  subscription,
  businessName,
}: DesktopNavigationProps) {
  const t = useTranslations('dashboard')
  const [copied, setCopied] = useState(false)


  const menuItems = [
    {
      id: 'chat' as ActiveView,
      label: t('navigation.chat'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      id: 'business-summary' as ActiveView,
      label: t('navigation.businessSummary'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17h6l3 3V4a1 1 0 00-1-1H3a1 1 0 00-1 1v13a1 1 0 001 1h2zm0 0V9a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H9z" />
        </svg>
      )
    },
    {
      id: 'agents' as ActiveView,
      label: t('navigation.agents'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'customer-support' as ActiveView,
      label: t('navigation.customerSupport'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      id: 'performance' as ActiveView,
      label: t('navigation.performance'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'users' as ActiveView,
      label: t('navigation.teamManagement'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    {
      id: 'qrcode' as ActiveView,
      label: 'Client QR Code',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 16a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zM15 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zM13 13h1.5v1.5H13V13zM15.5 13H17v1.5h-1.5V13zM13 15.5h1.5V17H13v-1.5zM15.5 15.5H17V17h-1.5v-1.5z" />
        </svg>
      )
    },
    {
      id: 'profile' as ActiveView,
      label: t('navigation.accountSettings'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ]

  return (
    <div className="hidden md:block md:w-64 md:flex-shrink-0" style={{ backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-primary)' }}>
      <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-primary)' }}>
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Chayo</span>
            <span className="text-white text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-primary)' }}>
              BETA
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* User Profile */}
        <div className="p-6" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-primary)' }}>
            <span className="text-white font-semibold text-sm">
              {user?.user_metadata?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.user_metadata?.name || 'User'}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {subscription?.plan_name || 'Free Plan'}
            </p>
          </div>
        </div>
        {/* Business Name Label */}
        {businessName && (
          <div className="mt-4 mb-2">
            <span
              className="block max-w-full font-bold text-base tracking-wide truncate"
              style={{ letterSpacing: '0.02em', color: 'var(--text-primary)' }}
              title={businessName}
            >
              {businessName}
            </span>
          </div>
        )}
      </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className="w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-all duration-200"
            style={{
              backgroundColor: activeView === item.id ? 'var(--bg-active)' : 'transparent',
              border: activeView === item.id ? '1px solid var(--border-focus)' : '1px solid transparent',
              color: activeView === item.id ? 'var(--accent-primary)' : 'var(--text-secondary)'
            }}
            onMouseEnter={(e) => {
              if (activeView !== item.id) {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeView !== item.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            <span style={{ color: activeView === item.id ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
              {item.icon}
            </span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 space-y-2" style={{ borderTop: '1px solid var(--border-primary)' }}>
        <button
          onClick={onManageBilling}
          className="w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-all duration-200"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span className="font-medium">{t('navigation.billingPlans')}</span>
        </button>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-all duration-200"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--accent-danger)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
      </div>
    </div>
  )
} 