import { useState, useEffect } from 'react'
import { supabase } from '@/lib/shared/supabase/client'
import type { User } from '@supabase/supabase-js'
import { AuthState, OtpLoadingState, Agent, UserSubscription, Organization, Message } from '@/lib/shared/types'
import { organizationService } from '@/lib/features/organizations/services/organizationService'
import { agentService } from '@/lib/features/organizations/services/agentService'
import { OTPService, OTPTranslations } from '@/lib/features/auth/services/otpService'


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

  // Function to create OTP flow with chat dependencies
  const createOTPFlow = (chatDeps: {
    input: string
    setInput: (input: string) => void
    setJustSent: (sent: boolean) => void
    isMobile: boolean
    inputRef: React.RefObject<HTMLTextAreaElement | null>
    messages: Message[]
    setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
    translations: OTPTranslations
  }) => {
    return {
      handleOTPFlow: async () => {
        if (authState === 'awaitingName') {
          const result = OTPService.handleNameInput(chatDeps.input, chatDeps.translations)
          if (result.success) {
            setPendingName(chatDeps.input.trim())
            executeActions(result.actions, chatDeps)
          }
          return
        }

        if (authState === 'awaitingEmail') {
          const result = await OTPService.handleEmailInput(chatDeps.input, chatDeps.translations)
          if (result.success) {
            setPendingEmail(chatDeps.input.trim())
          }
          executeActions(result.actions, chatDeps)
          return
        }

        if (authState === 'awaitingOTP') {
          const result = await OTPService.handleOTPVerification(chatDeps.input, pendingEmail, chatDeps.translations)
          executeActions(result.actions, chatDeps)
          return
        }
      },
      handleResendOTP: async () => {
        const result = await OTPService.handleResendOTP(pendingEmail, chatDeps.translations)
        executeActions(result.actions, chatDeps)
      }
    }
  }

  const executeActions = (actions: any[], chatDeps: any) => {
    for (const action of actions) {
      switch (action.type) {
        case 'add_messages':
          chatDeps.setMessages((msgs: Message[]) => [...msgs, ...action.payload])
          chatDeps.setJustSent(true)
          break
        case 'set_auth_state':
          setAuthState(action.payload)
          break
        case 'set_input':
          chatDeps.setInput(action.payload)
          break
        case 'set_loading':
          setOtpLoading(action.payload)
          break
        case 'set_error':
          setOtpError(action.payload)
          break
        case 'set_cooldown':
          setResendCooldown(action.payload)
          setOtpSent(true)
          break
        case 'blur_input':
          if (chatDeps.isMobile && chatDeps.inputRef.current) {
            chatDeps.inputRef.current.blur()
          }
          break
      }
    }
  }


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
    console.log('🔄 [AUTH] Main auth setup effect - Starting')
    let isMounted = true
    let isInitializing = false
    let hasInitialized = false
    let isTabSwitching = false
    let authSubscription: any = null
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CRITICAL: SYNCHRONOUS STATE INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════
    // Set initial state IMMEDIATELY (synchronous) to prevent race conditions
    // This ensures downstream hooks (useDashboardInit, etc.) never see 'loading'
    // state during the async getSession() call in production environments.
    //
    // Why this matters:
    // - Localhost: getSession() completes in ~1ms (fast enough for React)
    // - Production: getSession() takes 50-200ms (cookies, network, validation)
    // - Without this: Hooks render with authState='loading', get stuck
    // - With this: Hooks see 'awaitingName', continue properly
    //
    // This state will be overwritten by initializeAuth() if a session exists.
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('🔄 [AUTH] Setting initial state (sync)')
    setAuthState('awaitingName')
    setLoading(true)
    
    // Track tab visibility to avoid unnecessary auth calls
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isTabSwitching = true
        console.log('👁️ [AUTH] Tab hidden - pausing auth events')
      } else {
        setTimeout(() => {
          isTabSwitching = false
          console.log('👁️ [AUTH] Tab visible - resuming auth events')
        }, 500)
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

        // If no agents exist, try to create one for completed onboarding
        if (!agents || agents.length === 0) {
          try {
            const { data: orgDetails } = await supabase
              .from('organizations')
              .select('id, slug')
              .eq('id', org.id)
              .single()

            if (orgDetails) {
      
              const newAgent = await agentService.maybeCreateAgentChatLinkIfThresholdMet({
                id: orgDetails.id,
                slug: orgDetails.slug
              })
              if (newAgent) {
                setAgents([newAgent.agent])
                console.log('✅ Auto-created agent for existing user')
                return
              }
            }
          } catch (error) {
            console.warn('⚠️ Failed to auto-create agent during auth:', error)
          }
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

    // ═══════════════════════════════════════════════════════════════════════════
    // AUTHENTICATED USER HANDLER
    // ═══════════════════════════════════════════════════════════════════════════
    // Handles the complete authenticated user initialization flow:
    // 1. Prevents duplicate initialization with isInitializing guard
    // 2. Sets user + authState immediately (unblocks UI)
    // 3. Fetches organization data in parallel
    // 4. Handles errors gracefully (always stops loading)
    // ═══════════════════════════════════════════════════════════════════════════
    const handleAuthenticatedUser = async (user: User) => {
      // Guard: Prevent duplicate initialization
      if (!isMounted) {
        console.log('⏭️ [AUTH] Component unmounted, skipping initialization')
        return
      }
      
      if (isInitializing) {
        console.log('⏭️ [AUTH] Already initializing, skipping duplicate call')
        return
      }
      
      isInitializing = true
      console.log('🔄 [AUTH] handleAuthenticatedUser - Start', { userId: user.id })
      
      // ═══════════════════════════════════════════════════════════════════════════
      // PHASE 1: IMMEDIATE STATE UPDATE (Unblock UI)
      // ═══════════════════════════════════════════════════════════════════════════
      // Set user and authState IMMEDIATELY so dashboard can start rendering
      // Keep loading=true while we fetch organization data
      console.log('✅ [AUTH] Phase 1: Setting authenticated state')
      setUser(user)
      setAuthState('authenticated')
      setLoading(true)
      
      // ═══════════════════════════════════════════════════════════════════════════
      // PHASE 2: PARALLEL DATA FETCHING
      // ═══════════════════════════════════════════════════════════════════════════
      // Fetch all required data in parallel for performance
      // Use allSettled to continue even if individual fetches fail
      console.log('🔄 [AUTH] Phase 2: Fetching organization data')
      const startTime = Date.now()
      
      try {
        const results = await Promise.allSettled([
          ensureUserHasOrganization(user),
          fetchAgents(),
          fetchSubscription(user.id),
          fetchCurrentOrganization(user.id)
        ])
        
        const elapsed = Date.now() - startTime
        console.log(`✅ [AUTH] Phase 2: Complete (${elapsed}ms)`)
        
        // Log any failures (but don't block)
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const labels = ['ensureOrg', 'fetchAgents', 'fetchSub', 'fetchCurrentOrg']
            console.warn(`⚠️ [AUTH] ${labels[index]} failed:`, result.reason)
          }
        })

        // ═══════════════════════════════════════════════════════════════════════════
        // PHASE 3: FINALIZATION
        // ═══════════════════════════════════════════════════════════════════════════
        if (isMounted) {
          setLoading(false)
          isInitializing = false
          hasInitialized = true
          console.log('✅ [AUTH] Initialization complete - User authenticated')
        }
      } catch (error) {
        // This catch should never be reached (allSettled doesn't throw)
        // But included for safety
        console.error('❌ [AUTH] Fatal error in handleAuthenticatedUser:', error)
        
        if (isMounted) {
          setLoading(false)
          isInitializing = false
          hasInitialized = true
        }
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // INITIAL SESSION CHECK
    // ═══════════════════════════════════════════════════════════════════════════
    // Called immediately on mount to check for existing session
    // This is the entry point for the entire auth flow
    //
    // Flow:
    // 1. Call getSession() (async - may take time in production)
    // 2. If session exists → handleAuthenticatedUser()
    // 3. If no session → confirm awaitingName state (already set sync)
    // 4. Handle errors → default to awaitingName
    //
    // Error handling: All failures default to unauthenticated state
    // ═══════════════════════════════════════════════════════════════════════════
    const initializeAuth = async () => {
      console.log('🚀 [AUTH] initializeAuth - Checking for existing session')
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ [AUTH] Error getting session:', error)
          if (isMounted) {
            setUser(null)
            setAuthState('awaitingName')
            setLoading(false)
            hasInitialized = true
            console.log('🔐 [AUTH] Defaulting to unauthenticated after error')
          }
          return
        }
        
        if (session?.user) {
          console.log('✅ [AUTH] Session found - initializing authenticated user')
          if (isMounted) {
            await handleAuthenticatedUser(session.user)
          }
        } else {
          console.log('🔐 [AUTH] No session found - confirming unauthenticated state')
          if (isMounted) {
            // Confirm the initial state (already set synchronously)
            setUser(null)
            setAuthState('awaitingName')
            setLoading(false)
            hasInitialized = true
          }
        }
      } catch (err) {
        console.error('❌ [AUTH] Fatal error in initializeAuth:', err)
        if (isMounted) {
          setUser(null)
          setAuthState('awaitingName')
          setLoading(false)
          hasInitialized = true
          console.log('🔐 [AUTH] Defaulting to unauthenticated after fatal error')
        }
      }
    }
    
    // Start initialization (async, non-blocking)
    initializeAuth()

    // ═══════════════════════════════════════════════════════════════════════════
    // AUTH STATE CHANGE LISTENER
    // ═══════════════════════════════════════════════════════════════════════════
    // Subscribes to Supabase auth events for real-time auth state updates
    //
    // Events handled:
    // - SIGNED_IN: User just signed in (OTP verified, OAuth callback, etc.)
    // - SIGNED_OUT: User signed out
    // - TOKEN_REFRESHED: Session token was refreshed (silent update)
    //
    // Events ignored:
    // - INITIAL_SESSION: Handled by initializeAuth() instead
    //
    // Guards:
    // - isTabSwitching: Prevents unnecessary updates during tab visibility changes
    // - hasInitialized: Prevents redundant initialization
    // ═══════════════════════════════════════════════════════════════════════════
    authSubscription = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) {
          console.log('⏭️ [AUTH] Component unmounted, ignoring event:', event)
          return
        }
        
        // ═════════════════════════════════════════════════════════════════════════
        // Tab Switching Guard
        // ═════════════════════════════════════════════════════════════════════════
        // Skip certain events during tab switches to prevent unnecessary loading
        if (isTabSwitching && (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN')) {
          console.log('👁️ [AUTH] Skipping event during tab switch:', event)
          // Still update user data silently if session matches current user
          if (session?.user && session.user.id === user?.id) {
            setUser(session.user)
          }
          return
        }
        
        console.log('🔄 [AUTH] Event:', event, { hasInitialized, isTabSwitching })
        
        // ═════════════════════════════════════════════════════════════════════════
        // Event: SIGNED_IN
        // ═════════════════════════════════════════════════════════════════════════
        // User just authenticated (OTP, OAuth, etc.)
        // Only do full initialization if needed
        if (event === 'SIGNED_IN' && session?.user) {
          const userChanged = !user || user.id !== session.user.id
          
          if (!hasInitialized || userChanged) {
            console.log('✅ [AUTH] SIGNED_IN - Initializing user', { userChanged })
            await handleAuthenticatedUser(session.user)
          } else {
            console.log('✅ [AUTH] SIGNED_IN - Updating existing user (no re-init)')
            setUser(session.user)
            setAuthState('authenticated')
          }
        }
        
        // ═════════════════════════════════════════════════════════════════════════
        // Event: SIGNED_OUT
        // ═════════════════════════════════════════════════════════════════════════
        // User signed out - clear all state
        else if (event === 'SIGNED_OUT') {
          console.log('🚪 [AUTH] SIGNED_OUT - Clearing state')
          setUser(null)
          setAuthState('awaitingName')
          setLoading(false)
          setAgents([])
          setSubscription(null)
          setOrganizations([])
          setCurrentOrganization(null)
          hasInitialized = false
          isInitializing = false
        }
        
        // ═════════════════════════════════════════════════════════════════════════
        // Event: TOKEN_REFRESHED
        // ═════════════════════════════════════════════════════════════════════════
        // Session token refreshed - silent update (don't refetch data)
        else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 [AUTH] TOKEN_REFRESHED - Silent update')
          setUser(session.user)
          setAuthState('authenticated')
          // IMPORTANT: Don't set loading=true to avoid UI flicker
        }
        
        // ═════════════════════════════════════════════════════════════════════════
        // Other Events
        // ═════════════════════════════════════════════════════════════════════════
        // INITIAL_SESSION is ignored - handled by initializeAuth()
        // Any other events are logged but not processed
        else {
          console.log('ℹ️ [AUTH] Unhandled event:', event)
        }
      }
    )

    // ═══════════════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════════════
    // Called when component unmounts
    // Ensures all listeners are removed and subscriptions are cancelled
    // ═══════════════════════════════════════════════════════════════════════════
    return () => {
      console.log('🧹 [AUTH] Cleanup - Unsubscribing and removing listeners')
      isMounted = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (authSubscription) {
        authSubscription.data.subscription.unsubscribe()
      }
    }
  }, []) // Empty deps - only run once on mount

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
    
    // OTP Flow factory
    createOTPFlow,
  }
} 