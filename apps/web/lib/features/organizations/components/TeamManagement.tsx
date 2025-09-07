'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/shared/supabase/client'

interface TeamMember {
  id: string
  user_id: string
  role: string
  status: string
  joined_at: string
  email?: string
  name?: string
}

interface TeamInvitation {
  id: string
  email: string
  role: string
  created_at: string
  expires_at: string
}

interface TeamManagementProps {
  organizationId: string
  organizationName: string
}

export default function TeamManagement({ organizationId, organizationName }: TeamManagementProps) {
  const t = useTranslations('teamManagement')
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [organizationId])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([
      fetchMembers(),
      fetchInvitations(),
      fetchCurrentUserRole()
    ])
    setLoading(false)
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/team-members?organizationId=${organizationId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const { members } = await response.json()
        setMembers(members || [])
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const fetchInvitations = async () => {
    try {
      const response = await fetch(`/api/invitations?organizationId=${organizationId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const { invitations } = await response.json()
        setInvitations(invitations || [])
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    }
  }

  const fetchCurrentUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: membership } = await supabase
          .from('team_members')
          .select('role')
          .eq('organization_id', organizationId)
          .eq('user_id', user.id)
          .single()
        
        if (membership) {
          setCurrentUserRole(membership.role)
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const handleInviteMember = async () => {
    if (!inviteEmail || inviting) return

    setInviting(true)
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          organizationId,
          email: inviteEmail,
          role: inviteRole
        })
      })

      if (response.ok) {
        setShowInviteModal(false)
        setInviteEmail('')
        setInviteRole('member')
        await fetchInvitations()
      } else {
        const { error } = await response.json()
        alert(error || 'Failed to send invitation')
      }
    } catch (error) {
      console.error('Error inviting member:', error)
      alert('Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleUpdateMember = async (memberId: string, updates: { role?: string; status?: string }) => {
    try {
      const response = await fetch('/api/team-members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ memberId, ...updates })
      })

      if (response.ok) {
        await fetchMembers()
      } else {
        const { error } = await response.json()
        alert(error || 'Failed to update member')
      }
    } catch (error) {
      console.error('Error updating member:', error)
      alert('Failed to update member')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const response = await fetch(`/api/team-members?memberId=${memberId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        await fetchMembers()
      } else {
        const { error } = await response.json()
        alert(error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Failed to remove member')
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations?invitationId=${invitationId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        await fetchInvitations()
      } else {
        const { error } = await response.json()
        alert(error || 'Failed to cancel invitation')
      }
    } catch (error) {
      console.error('Error canceling invitation:', error)
      alert('Failed to cancel invitation')
    }
  }

  const canManageTeam = ['owner', 'admin'].includes(currentUserRole)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('title')}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('description', { organizationName })}
          </p>
        </div>
        {canManageTeam && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 rounded-md transition-colors"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text-primary)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
          >
            {t('inviteMember')}
          </button>
        )}
      </div>

      {/* Team Members */}
      <div 
        className="rounded-lg shadow"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <div 
          className="px-6 py-4 border-b"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <h3 
            className="text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >{t('activeMembers')}</h3>
        </div>
        <div 
          className="divide-y"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          {members.length === 0 ? (
            <div 
              className="px-6 py-8 text-center"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('noTeamMembers')}
            </div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-semibold">
                      {member.email ? member.email[0].toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {member.email || `User ${member.user_id.slice(0, 8)}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('joined')} {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    member.role === 'owner' 
                      ? 'bg-purple-100 text-purple-800'
                      : member.role === 'admin'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {member.role}
                  </span>
                  {canManageTeam && member.role !== 'owner' && (
                    <div className="flex space-x-2">
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateMember(member.id, { role: e.target.value })}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="member">{t('member')}</option>
                        <option value="admin">{t('admin')}</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        {t('remove')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div 
        className="rounded-lg shadow"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
          <div 
          className="px-6 py-4 border-b"
          style={{ borderColor: 'var(--border-primary)' }}
        >
            <h3 
            className="text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >{t('pendingInvitations')}</h3>
          </div>
          <div 
          className="divide-y"
          style={{ borderColor: 'var(--border-primary)' }}
        >
            {invitations.map((invitation) => (
              <div key={invitation.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {invitation.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('invited')} {new Date(invitation.created_at).toLocaleDateString()} • 
                      {t('expires')} {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    {invitation.role}
                  </span>
                  {canManageTeam && (
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      {t('cancel')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('inviteTeamMember')}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('emailAddress')}
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={t('enterEmailAddress')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('role')}
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="member">{t('member')}</option>
                    <option value="admin">{t('admin')}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  disabled={inviting}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleInviteMember}
                  disabled={!inviteEmail || inviting}
                  className="bg-orange-400 hover:bg-orange-500 text-white px-4 py-2 rounded-md"
                >
                  {inviting ? t('sending') : t('sendInvitation')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
