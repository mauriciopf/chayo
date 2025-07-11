'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import type { User } from '@supabase/supabase-js'

interface ProfileSettingsProps {
  user: User
  onUserUpdate?: (user: User) => void
}

export default function ProfileSettings({ user, onUserUpdate }: ProfileSettingsProps) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || user.user_metadata?.full_name || '')
      setEmail(user.email || '')
    }
  }, [user])

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Profile Settings
        </h2>
        <p className="text-gray-600">
          Manage your account information and security settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Profile Information
          </h3>
          
          <form onSubmit={updateProfile} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter your display name"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter your email"
              />
              <p className="text-xs text-gray-500 mt-1">
                Changing your email will require verification
              </p>
            </div>

            {profileMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg ${
                  profileMessage.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {profileMessage.text}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full bg-orange-400 hover:bg-orange-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isUpdatingProfile ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Updating...
                </>
              ) : (
                'Update Profile'
              )}
            </button>
          </form>
        </div>

        {/* Password Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Change Password
          </h3>
          
          <form onSubmit={updatePassword} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter new password"
                minLength={6}
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Confirm new password"
                minLength={6}
              />
            </div>

            {passwordMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg ${
                  passwordMessage.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {passwordMessage.text}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isUpdatingPassword || !newPassword || !confirmPassword}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isUpdatingPassword ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Updating...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Account Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <label className="block text-gray-500 mb-1">User ID</label>
            <p className="text-gray-900 font-mono text-xs break-all">{user.id}</p>
          </div>
          
          <div>
            <label className="block text-gray-500 mb-1">Account Created</label>
            <p className="text-gray-900">
              {new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          
          <div>
            <label className="block text-gray-500 mb-1">Last Sign In</label>
            <p className="text-gray-900">
              {user.last_sign_in_at 
                ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'Never'
              }
            </p>
          </div>
          
          <div>
            <label className="block text-gray-500 mb-1">Email Confirmed</label>
            <p className={`font-medium ${user.email_confirmed_at ? 'text-green-600' : 'text-yellow-600'}`}>
              {user.email_confirmed_at ? 'Yes' : 'Pending'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
