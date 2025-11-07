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
    let isInitializing = false
    let hasInitialized = false

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

        setCurrentOrganization(membership.organizations as unknown as Organization)
      } catch {
        setCurrentOrganization(null)
      }
    }

    const handleAuthenticatedUser = async (user: User) => {
      if (!isMounted || isInitializing) return
      
      isInitializing = true
      setUser(user)
      setAuthState('authenticated')

      try {
        await Promise.allSettled([
          fetchCurrentOrganization(user.id),
          fetchAgents(),
          fetchSubscription(user.id)
        ])
      } finally {
        if (isMounted) {
          setLoading(false)
          isInitializing = false
          hasInitialized = true
        }
      }
    }

    const initializeAuth = async () => {
      console.log('🔐 useAuth: Starting auth initialization...')
      
      try {
        // Try to get session with timeout protection
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 3000)
        )
        
        let session, error
        try {
          const result = await Promise.race([sessionPromise, timeoutPromise]) as any
          session = result.data?.session
          error = result.error
          console.log('🔐 useAuth: Got session result:', { hasSession: !!session, hasUser: !!session?.user, error: error?.message })
        } catch (timeoutError) {
          // Session call timed out - likely stale session causing refresh loop
          console.warn('🔐 useAuth: getSession() timed out - clearing stale session')
          
          try {
            // Clear local storage directly - faster than signOut
            localStorage.removeItem('supabase.auth.token')
            // Also try signOut with timeout
            const signOutPromise = supabase.auth.signOut({ scope: 'local' })
            const signOutTimeout = new Promise((resolve) => setTimeout(resolve, 1000))
            await Promise.race([signOutPromise, signOutTimeout])
            console.log('🔐 useAuth: Cleared stale session')
          } catch (clearError) {
            console.error('🔐 useAuth: Error clearing session:', clearError)
            // Continue anyway
          }
          
          // Force no session state immediately
          session = null
          error = null
          console.log('🔐 useAuth: Forcing no-session state after timeout')
        }
        
        if (error || !session?.user) {
          if (isMounted) {
            console.log('🔐 useAuth: No session - setting awaitingName')
            setUser(null)
            setAuthState('awaitingName')
            setLoading(false)
            hasInitialized = true
          }
          return
        }

        if (isMounted) {
          console.log('🔐 useAuth: Session found - authenticating user')
          await handleAuthenticatedUser(session.user)
        }
      } catch (err) {
        console.error('🔐 useAuth: Error during initialization:', err)
        if (isMounted) {
          // On any error, force awaitingName state
          console.log('🔐 useAuth: Forcing awaitingName due to error')
          setUser(null)
          setAuthState('awaitingName')
          setLoading(false)
          hasInitialized = true
        }
      }
    }

    initializeAuth()

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          const userChanged = !user || user.id !== session.user.id
          
          if (!hasInitialized || userChanged) {
            await handleAuthenticatedUser(session.user)
          } else {
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
          isInitializing = false
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
          setAuthState('authenticated')
        }
      }
    )

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
