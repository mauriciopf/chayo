import { useState, useEffect } from 'react'
import { supabase } from '@/lib/shared/supabase/client'
import type { User } from '@supabase/supabase-js'
import { AuthState, OtpLoadingState, Agent, UserSubscription, Organization, Message } from '@/lib/shared/types'
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
  const [agents, setAgents] = useState<Agent[]>([])
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)

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

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  useEffect(() => {
    let isMounted = true
    let hasInitialized = false

    // ─────────────────────────────────────────────────────────────────
    // Data fetching helpers
    // ─────────────────────────────────────────────────────────────────

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
                return
              }
            }
          } catch (error) {
            console.warn('Failed to auto-create agent:', error)
          }
        }

        setAgents(agents || [])
      } catch (error) {
        setAgents([])
      }
    }

    const fetchSubscription = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        setSubscription(error ? null : data)
      } catch {
        setSubscription(null)
      }
    }

    const fetchCurrentOrganization = async (userId: string) => {
      console.log('🏢 [AUTH] fetchCurrentOrganization called for userId:', userId)
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

        console.log('🏢 [AUTH] fetchCurrentOrganization result:', {
          error: error?.message,
          hasMembership: !!membership,
          hasOrganizations: !!membership?.organizations,
          organizationId: membership?.organizations?.[0]?.id,
        })

        if (error || !membership?.organizations) {
          console.warn('⚠️ [AUTH] No organization found or error occurred')
          setCurrentOrganization(null)
          return
        }

        setCurrentOrganization(membership.organizations as unknown as Organization)
      } catch (err) {
        console.error('❌ [AUTH] fetchCurrentOrganization error:', err)
        setCurrentOrganization(null)
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // Auth state setters
    // ─────────────────────────────────────────────────────────────────

    const setAuthenticatedState = async (user: User) => {
      setUser(user)
      setAuthState('authenticated')
      setLoading(false)
      
      // Fetch user data in parallel
      const results = await Promise.allSettled([
        fetchCurrentOrganization(user.id),
        fetchAgents(),
        fetchSubscription(user.id)
      ])
      
      console.log('✅ [AUTH] Parallel fetch complete:', {
        organization: results[0].status,
        agents: results[1].status,
        subscription: results[2].status
      })
      
      hasInitialized = true
    }

    const setUnauthenticatedState = () => {
      setUser(null)
      setAuthState('awaitingName')
      setLoading(false)
      setAgents([])
      setSubscription(null)
      setOrganizations([])
      setCurrentOrganization(null)
      hasInitialized = true
    }

    // ─────────────────────────────────────────────────────────────────
    // 1. Initial session check (one-time on mount)
    // ─────────────────────────────────────────────────────────────────

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted || hasInitialized) return

      if (error) {
        console.error('🔐 Session error:', error)
        supabase.auth.signOut({ scope: 'local' }).catch(console.error)
      }

      if (session?.user) {
        console.log('✅ Initial session found')
        setAuthenticatedState(session.user)
      } else {
        console.log('🔓 No initial session')
        setUnauthenticatedState()
      }
    })

    // ─────────────────────────────────────────────────────────────────
    // 2. Listen to auth changes (ongoing)
    // ─────────────────────────────────────────────────────────────────

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        console.log('🔐 Auth event:', event)

        // Fallback: Use INITIAL_SESSION if getSession() hasn't completed yet
        if (event === 'INITIAL_SESSION' && !hasInitialized) {
          if (session?.user) {
            await setAuthenticatedState(session.user)
          } else {
            setUnauthenticatedState()
          }
          return
        }

        // User just logged in
        if (event === 'SIGNED_IN' && session?.user) {
          await setAuthenticatedState(session.user)
          return
        }

        // User logged out
        if (event === 'SIGNED_OUT') {
          setUnauthenticatedState()
          hasInitialized = false
          return
        }

        // Token refreshed - just update user object
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
          setAuthState('authenticated')
        }
      }
    )

    // ─────────────────────────────────────────────────────────────────
    // 3. Cleanup
    // ─────────────────────────────────────────────────────────────────

    return () => {
      isMounted = false
      authSubscription.unsubscribe()
    }
  }, [])

  return {
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
    agents,
    setAgents,
    subscription,
    setSubscription,
    organizations,
    setOrganizations,
    currentOrganization,
    setCurrentOrganization,
    createOTPFlow,
  }
}
