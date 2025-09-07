'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/shared/supabase/client'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import type { User } from '@supabase/supabase-js'
import { organizationService } from '../../../organizations/services/organizationService'

interface ProfileSettingsProps {
  user: User
  onUserUpdate?: (user: User) => void
}

export default function ProfileSettings({ user, onUserUpdate }: ProfileSettingsProps) {
  const t = useTranslations('profileSettings')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [orgName, setOrgName] = useState('')
  const [orgId, setOrgId] = useState('')
  const [orgLoading, setOrgLoading] = useState(false)
  const [orgError, setOrgError] = useState('')
  const [orgSuccess, setOrgSuccess] = useState('')

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || user.user_metadata?.full_name || '')
      setEmail(user.email || '')
    }
  }, [user])

  useEffect(() => {
    async function fetchOrg() {
      setOrgLoading(true)
      setOrgError('')
      const orgs = await organizationService.getUserOrganizations(user.id)
      const org = orgs && orgs.length > 0 ? orgs[0] : null;
      if (org) {
        setOrgName(org.name)
        setOrgId(org.id)
      }
      setOrgLoading(false)
    }
    fetchOrg()
  }, [user.id])

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProfile(true)
    setProfileMessage(null)

    try {
      const updates: any = {}
      
      // Update display name if changed
      if (displayName !== (user.user_metadata?.display_name || user.user_metadata?.full_name || '')) {
        updates.data = { display_name: displayName }
      }

      // Update email if changed
      if (email !== user.email) {
        updates.email = email
      }

      if (Object.keys(updates).length === 0) {
        setProfileMessage({ type: 'error', text: 'No changes detected' })
        return
      }

      const { error } = await supabase.auth.updateUser(updates)

      if (error) {
        setProfileMessage({ type: 'error', text: error.message })
      } else {
        setProfileMessage({ 
          type: 'success', 
          text: email !== user.email 
            ? 'Profile updated! Please check your email to confirm the new email address.'
            : 'Profile updated successfully!'
        })
        
        // Fetch updated user data
        const { data: { user: updatedUser } } = await supabase.auth.getUser()
        if (updatedUser && onUserUpdate) {
          onUserUpdate(updatedUser)
        }
      }
    } catch (error) {
      setProfileMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setIsUpdatingProfile(false)
      setTimeout(() => setProfileMessage(null), 5000)
    }
  }

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingPassword(true)
    setPasswordMessage(null)

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' })
      setIsUpdatingPassword(false)
      setTimeout(() => setPasswordMessage(null), 5000)
      return
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters long' })
      setIsUpdatingPassword(false)
      setTimeout(() => setPasswordMessage(null), 5000)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        setPasswordMessage({ type: 'error', text: error.message })
      } else {
        setPasswordMessage({ type: 'success', text: 'Password updated successfully!' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setIsUpdatingPassword(false)
      setTimeout(() => setPasswordMessage(null), 5000)
    }
  }

  const handleOrgNameUpdate = async () => {
    setOrgLoading(true)
    setOrgError('')
    setOrgSuccess('')
    try {
      const res = await fetch(`/api/organizations/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId, name: orgName })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update organization')
      setOrgSuccess('Organization name updated!')
    } catch (e: any) {
      setOrgError(e.message)
    } finally {
      setOrgLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="mb-6">
        <h2 
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {t('title')}
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('description')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div 
          className="rounded-lg shadow p-6"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('profileInformation')}
          </h3>
          
          <form onSubmit={updateProfile} className="space-y-4">
            <div>
              <label 
                htmlFor="displayName" 
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('displayName')}
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-orange-500"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
                placeholder={t('displayNamePlaceholder')}
              />
            </div>
            
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('emailAddress')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-orange-500"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
                placeholder={t('emailPlaceholder')}
              />
              <p 
                className="text-xs mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t('emailVerificationNote')}
              </p>
            </div>

            {profileMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg border"
                style={{
                  backgroundColor: profileMessage.type === 'success' 
                    ? 'var(--bg-tertiary)' 
                    : 'var(--bg-tertiary)',
                  color: profileMessage.type === 'success'
                    ? 'var(--text-primary)'
                    : '#ef4444',
                  borderColor: profileMessage.type === 'success'
                    ? 'var(--border-primary)'
                    : '#ef4444'
                }}
              >
                {profileMessage.text}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full disabled:cursor-not-allowed font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              style={{ 
                backgroundColor: isUpdatingProfile ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => !isUpdatingProfile && (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => !isUpdatingProfile && (e.currentTarget.style.backgroundColor = 'var(--accent-primary)')}
            >
              {isUpdatingProfile ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  {t('updating')}
                </>
              ) : (
                t('updateProfile')
              )}
            </button>
          </form>

          {/* Organization Name Edit */}
          <div className="mb-4">
            <label 
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              {t('organizationName')}
            </label>
            <div className="flex items-center space-x-2">
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
                placeholder={t('organizationNamePlaceholder')}
              />
              <button
                type="button"
                onClick={handleOrgNameUpdate}
                className="px-3 py-1 rounded text-xs font-medium disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--text-primary)'
                }}
                disabled={orgLoading || !orgName}
              >
                {t('save')}
              </button>
            </div>
            {orgError && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{orgError}</p>}
            {orgSuccess && <p className="text-xs mt-1" style={{ color: '#22c55e' }}>{orgSuccess}</p>}
          </div>
        </div>

        {/* Password Settings */}
        <div 
          className="rounded-lg shadow p-6"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('changePassword')}
          </h3>
          
          <form onSubmit={updatePassword} className="space-y-4">
            <div>
              <label 
                htmlFor="newPassword" 
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('newPassword')}
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-orange-500"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
                placeholder={t('newPasswordPlaceholder')}
                minLength={6}
              />
            </div>
            
            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('confirmNewPassword')}
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-orange-500"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
                placeholder={t('confirmPasswordPlaceholder')}
                minLength={6}
              />
            </div>

            {passwordMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg border"
                style={{
                  backgroundColor: passwordMessage.type === 'success' 
                    ? 'var(--bg-tertiary)' 
                    : 'var(--bg-tertiary)',
                  color: passwordMessage.type === 'success'
                    ? 'var(--text-primary)'
                    : '#ef4444',
                  borderColor: passwordMessage.type === 'success'
                    ? 'var(--border-primary)'
                    : '#ef4444'
                }}
              >
                {passwordMessage.text}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isUpdatingPassword || !newPassword || !confirmPassword}
              className="w-full disabled:cursor-not-allowed font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              style={{ 
                backgroundColor: isUpdatingPassword ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => !isUpdatingPassword && (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => !isUpdatingPassword && (e.currentTarget.style.backgroundColor = 'var(--accent-primary)')}
            >
              {isUpdatingPassword ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  {t('updating')}
                </>
              ) : (
                t('changePassword')
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Account Information */}
      <div 
        className="rounded-lg shadow p-6"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <h3 
          className="text-lg font-semibold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          {t('accountInformation')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <label 
              className="block mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >{t('userId')}</label>
            <p 
              className="font-mono text-xs break-all"
              style={{ color: 'var(--text-primary)' }}
            >{user.id}</p>
          </div>
          
          <div>
            <label 
              className="block mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >{t('accountCreated')}</label>
            <p style={{ color: 'var(--text-primary)' }}>
              {new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          
          <div>
            <label 
              className="block mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >{t('lastSignIn')}</label>
            <p style={{ color: 'var(--text-primary)' }}>
              {user.last_sign_in_at 
                ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : t('never')
              }
            </p>
          </div>
          
          <div>
            <label 
              className="block mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >{t('emailConfirmed')}</label>
            <p 
              className="font-medium"
              style={{ color: user.email_confirmed_at ? '#22c55e' : '#eab308' }}
            >
              {user.email_confirmed_at ? t('yes') : t('pending')}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
