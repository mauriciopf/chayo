'use client'

import { useTranslations } from 'next-intl'
import { ActiveView } from '../../../../shared/types'

interface MobileHeaderProps {
  activeView: ActiveView
  onMenuToggle: () => void
  user: any
}

export default function MobileHeader({ activeView, onMenuToggle, user }: MobileHeaderProps) {
  const t = useTranslations('dashboard')

  const getViewTitle = (view: ActiveView) => {
    switch (view) {
      case 'chat':
        return t('navigation.chat')
      case 'agents':
        return t('navigation.agents')
      case 'performance':
        return t('navigation.performance')
      case 'users':
        return t('navigation.teamManagement')
      case 'profile':
        return t('navigation.accountSettings')
      default:
        return 'Dashboard'
    }
  }

  const getInitials = (email: string) => {
    return email.split('@')[0].charAt(0).toUpperCase()
  }

  return (
    <div className="md:hidden px-4 py-3 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
      {/* Left side - Hamburger + Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          aria-label="Open navigation menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {getViewTitle(activeView)}
        </h1>
      </div>

      {/* Right side - User Avatar */}
      {user && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-primary)' }}>
          <span className="text-white font-semibold text-sm">
            {getInitials(user.email!)}
          </span>
        </div>
      )}
    </div>
  )
} 