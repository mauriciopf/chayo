import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { AuthState, OtpLoadingState, Agent, UserSubscription, Organization } from '@/components/dashboard/types'
import { organizationService } from '@/lib/services/organizationService'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authState, setAuthState] = useState<AuthState>('awaitingName')
  const [otpLoading, setOtpLoading] = useState<OtpLoadingState>('none')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpSent, setOtpSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [pendingName, setPendingName] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')

  // Related state that depends on auth
  const [agents, setAgents] = useState<Agent[]>([])
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)

  const router = useRouter()
  const supabase = createClient()

  // Ensure user has organization
  const ensureUserHasOrganization = async (user: User) => {
    try {
      await organizationService.ensureUserHasOrganization(user.id)
    } catch (error) {
      console.error('Error ensuring user has organization:', error)
    }
  }

  // Fetch agents
  const fetchAgents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!org) return

      const { data: agents, error } = await supabase
        .from('agents')
        .select('*')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching agents:', error)
        return
      }

      setAgents(agents || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  // Fetch subscription
  const fetchSubscription = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error)
        return
      }

      setSubscription(data || null)
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }

  // Fetch current organization
  const fetchCurrentOrganization = async (userId: string) => {
    try {
      const { data: membership, error } = await supabase
        .from('team_members')
        .select(`
          organization_id,
          organizations!inner (
            id,
            name,
            slug,
            owner_id,
            created_at
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('joined_at', { ascending: true })
        .limit(1)
        .single()

      if (error || !membership?.organizations) {
        console.error('Error fetching current organization:', error)
        return
      }

      const organization = membership.organizations as unknown as Organization
      console.log('🔍 useAuth: Setting current organization:', organization)
      setCurrentOrganization(organization)
    } catch (error) {
      console.error('Error fetching current organization:', error)
    }
  }

  // Auth state sync
  useEffect(() => {
    if (user) {
      setAuthState('authenticated')
    } else if (!loading) {
      setAuthState('awaitingName')
    }
  }, [user, loading])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Main auth setup effect
  useEffect(() => {
    let isMounted = true
    
    const getUser = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const pollForUser = async (attempts = 0) => {
          const maxAttempts = 5
          const delay = 500
          
          try {
            const { data: { user } } = await supabase.auth.getUser()
            
            if (!isMounted) return
            
            if (user) {
              console.log('Dashboard: User found', user.email)
              setUser(user)
              
              await ensureUserHasOrganization(user)
              
              await Promise.all([
                fetchAgents(),
                fetchSubscription(user.id),
                fetchCurrentOrganization(user.id)
              ])
              return
            }
            
            if (attempts < maxAttempts) {
              console.log(`Dashboard: No user found, retrying... (${attempts + 1}/${maxAttempts})`)
              await new Promise(resolve => setTimeout(resolve, delay))
              return pollForUser(attempts + 1)
            }
            
            console.log('Dashboard: No user found after all attempts, showing chat for unauthenticated user')
            setUser(null)
          } catch (error) {
            console.error('Dashboard: Error getting user:', error)
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, delay))
              return pollForUser(attempts + 1)
            }
            
            if (isMounted) {
              setUser(null)
            }
          }
        }
        
        await pollForUser()
      } catch (error) {
        console.error('Dashboard: Error in getUser:', error)
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Dashboard: Auth state change:', event, session?.user?.email)
        
        if (!isMounted) return
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Dashboard: User signed in via auth state change')
          setUser(session.user)
          setLoading(true)
          
          await ensureUserHasOrganization(session.user)
          await Promise.all([
            fetchAgents(),
            fetchSubscription(session.user.id),
            fetchCurrentOrganization(session.user.id)
          ])
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          console.log('Dashboard: User signed out')
          setUser(null)
          setAgents([])
          setSubscription(null)
          setOrganizations([])
          setCurrentOrganization(null)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Dashboard: Token refreshed')
          setUser(session.user)
        }
      }
    )

    getUser()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router, supabase.auth])

  return {
    // Auth state
    user,
    loading,
    authState,
    setAuthState,
    otpLoading,
    setOtpLoading,
    otpError,
    setOtpError,
    otpSent,
    setOtpSent,
    resendCooldown,
    setResendCooldown,
    pendingName,
    setPendingName,
    pendingEmail,
    setPendingEmail,
    
    // Related data
    agents,
    setAgents,
    subscription,
    setSubscription,
    organizations,
    setOrganizations,
    currentOrganization,
    setCurrentOrganization,
    
    // Methods
    fetchAgents,
    fetchSubscription,
    fetchCurrentOrganization,
    ensureUserHasOrganization,
  }
} 