'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import type { User } from '@supabase/supabase-js'
import { organizationService } from '../../../organizations/services/organizationService'

interface UserSubscription {
  user_id: string
  plan_name: string
  status: string
  stripe_customer_id: string
  stripe_subscription_id: string
  current_period_end: string
}

interface UserProfileProps {
  user: User
  subscription: UserSubscription | null
  onLogout: () => void
  onManageBilling?: () => void
}

export default function UserProfile({ user, subscription, onLogout, onManageBilling }: UserProfileProps) {
  const t = useTranslations('dashboard')
  const [isOpen, setIsOpen] = useState(false)
  const [orgName, setOrgName] = useState<string>('')
  const [orgId, setOrgId] = useState<string>('')
  const [mobileAppCode, setMobileAppCode] = useState<string>('')
  const [orgLoading, setOrgLoading] = useState(false)
  const [orgError, setOrgError] = useState('')
  const [orgSuccess, setOrgSuccess] = useState('')

  useEffect(() => {
    async function fetchOrg() {
      setOrgLoading(true)
      setOrgError('')
      const orgs = await organizationService.getUserOrganizations(user.id)
      const org = orgs && orgs.length > 0 ? orgs[0] : null;
      if (org) {
        setOrgName(org.name)
        setOrgId(org.id)
        setMobileAppCode(org.mobile_app_code || '')
      }
      setOrgLoading(false)
    }
    fetchOrg()
  }, [user.id])

  const handleOrgNameUpdate = async () => {
    setOrgLoading(true)
    setOrgError('')
    setOrgSuccess('')
    try {
      const res = await fetch(`/api/organizations/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ organizationId: orgId, name: orgName })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('failedToUpdateOrg'))
      setOrgSuccess(t('orgNameUpdated'))
    } catch (e: any) {
      setOrgError(e.message)
    } finally {
      setOrgLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setIsOpen(false)
    
    if (onManageBilling) {
      onManageBilling()
      return
    }

    // Fallback to direct customer portal
    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      const { url, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      window.location.href = url
    } catch (error) {
      console.error('Error:', error)
      alert(t('billingPortalError'))
    }
  }

  const getInitials = (email: string) => {
    return email.split('@')[0].charAt(0).toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg transition-colors"
        style={{ backgroundColor: 'transparent' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          <span 
            className="font-semibold text-sm"
            style={{ color: 'var(--text-primary)' }}
          >
            {getInitials(user.email!)}
          </span>
        </div>
        <div className="hidden sm:block text-left">
          <p 
            className="text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {user.email}
          </p>
          <p 
            className="text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            {subscription?.plan_name || 'Free'} Plan
          </p>
        </div>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-secondary)' }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg border py-2 z-[100]"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)'
            }}
          >
            <div 
              className="px-4 py-3 border-b"
              style={{ borderColor: 'var(--border-primary)' }}
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <span 
                    className="font-semibold text-lg"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {getInitials(user.email!)}
                  </span>
                </div>
                <div>
                  <p 
                    className="font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >{user.email}</p>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Member since {formatDate(user.created_at)}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 py-3">
              <div className="mb-3">
                <p 
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >{t('organizationName')}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="text"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    className="border px-2 py-1 rounded text-sm flex-1"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                    disabled={orgLoading}
                  />
                  <button
                    onClick={handleOrgNameUpdate}
                    className="px-3 py-1 rounded text-xs font-medium disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--text-primary)'
                    }}
                    disabled={orgLoading || !orgName}
                  >
                    Save
                  </button>
                </div>
                {orgError && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{orgError}</p>}
                {orgSuccess && <p className="text-xs mt-1" style={{ color: '#22c55e' }}>{orgSuccess}</p>}
              </div>

              {/* Mobile App Code */}
              <div className="mb-3">
                <p 
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >Mobile App Code</p>
                <div 
                  className="flex items-center justify-between mt-1 rounded px-3 py-2 border"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-primary)'
                  }}
                >
                  <span 
                    className="text-lg font-mono font-bold tracking-wider"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {mobileAppCode || '000000'}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(mobileAppCode || '000000')}
                    className="ml-2 p-1 rounded transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--text-primary)'
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                    title="Copy mobile code"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Share this code with customers for mobile app access
                </p>
              </div>

              <div className="mb-3">
                <p 
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >{t('currentPlan')}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-gray-900 capitalize">
                    {subscription?.plan_name || 'Free'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    subscription?.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {subscription?.status || 'inactive'}
                  </span>
                </div>
              </div>

              {subscription?.current_period_end && (
                <div className="mb-3">
                  <p 
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >{t('nextBilling')}</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatDate(subscription.current_period_end)}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 py-2">
              <button
                onClick={() => {
                  setIsOpen(false)
                  // Navigate to profile settings
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{t('accountSettings')}</span>
              </button>
              
              <button
                onClick={handleManageSubscription}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Billing & Plans</span>
              </button>
              
              <button
                onClick={() => {
                  setIsOpen(false)
                  onLogout()
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>{t('signOut')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
