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
    <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Left side - Hamburger + Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          {getViewTitle(activeView)}
        </h1>
      </div>

      {/* Right side - User Avatar */}
      {user && (
        <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-sm">
            {getInitials(user.email!)}
          </span>
        </div>
      )}
    </div>
  )
} 