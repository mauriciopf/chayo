import { useState, useEffect } from 'react'
import { supabase } from '@/lib/shared/supabase/client'
import type { User } from '@supabase/supabase-js'
import { AuthState, OtpLoadingState, Agent, UserSubscription, Organization } from '@/lib/shared/types'
import { organizationService } from '../../organizations/services/organizationService'

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
    console.log('🔄 Main auth setup effect - Starting')
    let isMounted = true
    let hasInitialized = false
    let isTabSwitching = false
    let authSubscription: any = null
    
    // Track tab visibility to avoid unnecessary auth calls
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is being hidden - set flag to ignore auth events temporarily
        isTabSwitching = true
      } else {
        // Tab is visible again - re-enable auth events after a short delay
        setTimeout(() => {
          isTabSwitching = false
        }, 500) // Small delay to avoid immediate auth events
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    


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
      
      console.log('🔄 handleAuthenticatedUser - Starting for user:', user.id)
      setUser(user)
      setAuthState('authenticated')
      setLoading(true)
      
      try {
        await Promise.allSettled([
          ensureUserHasOrganization(user),
          fetchAgents(),
          fetchSubscription(user.id),
          fetchCurrentOrganization(user.id)
        ])

      } catch (error) {
        console.error('Error handling authenticated user:', error)
      } finally {
        // Always set loading to false, regardless of success or failure
        if (isMounted) {
          console.log('✅ handleAuthenticatedUser - Complete, setting loading to false')
          setLoading(false)
        }
      }
    }

    authSubscription = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        
        // Skip auth events during tab switching to prevent unnecessary loading states
        if (isTabSwitching && (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN')) {
          console.log('🔄 Skipping auth event during tab switch:', event)
          // Still update user data silently if it's different, just don't trigger loading states
          if (session?.user && session.user.id === user?.id) {
            setUser(session.user)
          }
          return
        }
        
        console.log('🔄 Auth state change:', event, 'hasInitialized:', hasInitialized, 'isTabSwitching:', isTabSwitching)
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Only do full auth flow if we haven't initialized yet, or if user actually changed
          const userChanged = !user || user.id !== session.user.id
          if (!hasInitialized || userChanged) {
            await handleAuthenticatedUser(session.user)
            hasInitialized = true
          } else {
            // Just update user data without expensive operations
            setUser(session.user)
            setAuthState('authenticated')
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setAuthState('awaitingName')
          setLoading(false)
          setAgents([])
          setSubscription(null)
          setOrganizations([])
          setCurrentOrganization(null)
          hasInitialized = false
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Only update user and auth state, don't refetch data unless needed
          setUser(session.user)
          setAuthState('authenticated')
          // Don't set loading to true here to avoid infinite loading
        } else if (event === 'INITIAL_SESSION') {
          // Handle initial session state - only do full flow once
          if (session?.user && !hasInitialized) {
            await handleAuthenticatedUser(session.user)
            hasInitialized = true
          } else if (session?.user && hasInitialized) {
            // Already initialized, just update user
            setUser(session.user)
            setAuthState('authenticated')
            setLoading(false)
          } else {
            setUser(null)
            setAuthState('awaitingName')
            setLoading(false)
            hasInitialized = true
          }
        }
      }
    )

    return () => {
      isMounted = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (authSubscription) {
        authSubscription.data.subscription.unsubscribe()
      }
    }
  }, [])

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