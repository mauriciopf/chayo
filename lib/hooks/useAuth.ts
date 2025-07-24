import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { AuthState, OtpLoadingState, Agent, UserSubscription, Organization } from '@/components/dashboard/types'
import { organizationService } from '@/lib/services/organizationService'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authState, setAuthState] = useState<AuthState>('loading')
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

  // Ensure user has organization
  const ensureUserHasOrganization = async (user: User) => {
    try {
      await organizationService.ensureUserHasOrganization(user.id)
    } catch (error) {
      console.error('Error ensuring user has organization:', error)
    }
  }





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

    // Fetch agents
    const fetchAgents = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          setAgents([])
          return
        }

        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle()

        if (!org) {
          setAgents([])
          return
        }

        const { data: agents, error } = await supabase
          .from('agents')
          .select('*')
          .eq('organization_id', org.id)
          .order('created_at', { ascending: false })

        if (error) {
          setAgents([])
          return
        }

        setAgents(agents || [])
      } catch (error) {
        setAgents([])
      }
    }

    // Fetch subscription
    const fetchSubscription = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        if (error) {
          setSubscription(null)
          return
        }

        setSubscription(data || null)
      } catch (error) {
        setSubscription(null)
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
          .maybeSingle()

        if (error || !membership?.organizations) {
          setCurrentOrganization(null)
          return
        }

        const organization = membership.organizations as unknown as Organization
        setCurrentOrganization(organization)
      } catch (error) {
        setCurrentOrganization(null)
      }
    }

    const handleAuthenticatedUser = async (user: User) => {
      if (!isMounted) return
      
      setUser(user)
      setAuthState('authenticated')
      setLoading(true)
      
      try {
        await ensureUserHasOrganization(user)
        
        const results = await Promise.allSettled([
          fetchAgents(),
          fetchSubscription(user.id),
          fetchCurrentOrganization(user.id)
        ])
        
        setLoading(false)

      } catch (error) {
        console.error('Error handling authenticated user:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        
        if (event === 'SIGNED_IN' && session?.user) {
          await handleAuthenticatedUser(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setAuthState('awaitingName')
          setLoading(false)
          setAgents([])
          setSubscription(null)
          setOrganizations([])
          setCurrentOrganization(null)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Only update user and auth state, don't refetch data unless needed
          setUser(session.user)
          setAuthState('authenticated')
          // Don't set loading to true here to avoid infinite loading
        } else if (event === 'INITIAL_SESSION') {
          // Handle initial session state
          if (session?.user) {
            await handleAuthenticatedUser(session.user)
          } else {
            setUser(null)
            setAuthState('awaitingName')
            setLoading(false)
          }
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router])

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
    ensureUserHasOrganization,
  }
} 