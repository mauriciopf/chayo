import { supabase } from '@/lib/shared/supabase/client'
import { Message, AuthState, OtpLoadingState } from '../../../shared/types'

interface AuthFlowProps {
  authState: AuthState
  setAuthState: (state: AuthState) => void
  input: string
  setInput: (input: string) => void
  setJustSent: (sent: boolean) => void
  isMobile: boolean
  inputRef: React.RefObject<HTMLTextAreaElement>
  pendingName: string
  setPendingName: (name: string) => void
  pendingEmail: string
  setPendingEmail: (email: string) => void
  otpLoading: OtpLoadingState
  setOtpLoading: (loading: OtpLoadingState) => void
  otpError: string | null
  setOtpError: (error: string | null) => void
  otpSent: boolean
  setOtpSent: (sent: boolean) => void
  resendCooldown: number
  setResendCooldown: (cooldown: number) => void
  messages: Message[]
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
}

export function useAuthFlow({
  authState,
  setAuthState,
  input,
  setInput,
  setJustSent,
  isMobile,
  inputRef,
  pendingName,
  setPendingName,
  pendingEmail,
  setPendingEmail,
  otpLoading,
  setOtpLoading,
  otpError,
  setOtpError,
  otpSent,
  setOtpSent,
  resendCooldown,
  setResendCooldown,
  messages,
  setMessages
}: AuthFlowProps) {
  
  const handleOTPFlow = async () => {
    
    if (authState === 'awaitingName') {
      if (!input.trim()) return
      setPendingName(input.trim())
      setMessages((msgs) => [
        ...msgs,
        {
          id: Date.now().toString(),
          role: 'user',
          content: input.trim(),
          timestamp: new Date(),
        },
        {
          id: Date.now().toString() + '-ai',
          role: 'ai',
          content: 'Great! What is your email address?',
          timestamp: new Date(),
        },
      ])
      setInput('')
      setJustSent(true)
      
      // Close keyboard on mobile devices
      if (isMobile && inputRef.current) {
        inputRef.current.blur()
      }
      
      setAuthState('awaitingEmail')
      return
    }

    if (authState === 'awaitingEmail') {
      if (!input.trim()) return
      setPendingEmail(input.trim())
      setMessages((msgs) => [
        ...msgs,
        {
          id: Date.now().toString(),
          role: 'user',
          content: input.trim(),
          timestamp: new Date(),
        },
      ])
      setInput('')
      setJustSent(true)
      
      // Close keyboard on mobile devices
      if (isMobile && inputRef.current) {
        inputRef.current.blur()
      }
      
      setAuthState('awaitingOTP')
      setOtpError(null)
      setOtpLoading('sending')
      
      // Call OTP send endpoint
      try {
        const res = await fetch('/api/auth/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: input.trim() }),
        })
        const data = await res.json()
        if (!res.ok) {
          setOtpError(data.error || 'Failed to send OTP code.')
          setMessages((msgs) => [
            ...msgs,
            {
              id: Date.now().toString() + '-ai',
              role: 'ai',
              content: data.error || 'Failed to send OTP code. Please try again.',
              timestamp: new Date(),
            },
          ])
          setAuthState('awaitingEmail')
          setOtpLoading('none')
          return
        }
        setOtpSent(true)
        setMessages((msgs) => [
          ...msgs,
          {
            id: Date.now().toString() + '-ai',
            role: 'ai',
            content: 'I just sent a 6-digit code to your email. Please enter it below to continue.',
            timestamp: new Date(),
          },
        ])
        setResendCooldown(30) // 30s cooldown
      } catch (err) {
        setOtpError('Failed to send OTP code.')
        setMessages((msgs) => [
          ...msgs,
          {
            id: Date.now().toString() + '-ai',
            role: 'ai',
            content: 'Failed to send OTP code. Please try again.',
            timestamp: new Date(),
          },
        ])
        setAuthState('awaitingEmail')
      }
      setOtpLoading('none')
      return
    }

    if (authState === 'awaitingOTP') {
      if (!input.trim()) return
      
      // If user types 'resend', 'send again', or 'didn't get code', trigger resend logic
      if (/resend|send again|didn'?t get/i.test(input.trim())) {
        setOtpError(null)
        setMessages((msgs) => [
          ...msgs,
          {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
          },
        ])
        setJustSent(true)
        
        // Close keyboard on mobile devices
        if (isMobile && inputRef.current) {
          inputRef.current.blur()
        }
        
        // Resend OTP
        try {
          const res = await fetch('/api/auth/otp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: pendingEmail }),
          })
          const data = await res.json()
          if (!res.ok) {
            setOtpError(data.error || 'Failed to resend OTP code.')
            setMessages((msgs) => [
              ...msgs,
              {
                id: Date.now().toString() + '-ai',
                role: 'ai',
                content: data.error || 'Failed to resend OTP code. Please try again.',
                timestamp: new Date(),
              },
            ])
            setInput('')
            return
          }
          setOtpSent(true)
          setMessages((msgs) => [
            ...msgs,
            {
              id: Date.now().toString() + '-ai',
              role: 'ai',
              content: 'A new 6-digit code was sent to your email.',
              timestamp: new Date(),
            },
          ])
          setInput('')
          return
        } catch (err) {
          setOtpError('Failed to resend OTP code.')
          setMessages((msgs) => [
            ...msgs,
            {
              id: Date.now().toString() + '-ai',
              role: 'ai',
              content: 'Failed to resend OTP code. Please try again.',
              timestamp: new Date(),
            },
          ])
          setInput('')
          return
        }
      }
      
      // Regex check for 6-digit OTP
      if (!/^\d{6}$/.test(input.trim())) {
        setOtpError('Please enter a valid 6-digit code.')
        setMessages((msgs) => [
          ...msgs,
          {
            id: Date.now().toString() + '-ai',
            role: 'ai',
            content: 'Please enter a valid 6-digit code.',
            timestamp: new Date(),
          },
        ])
        setInput('')
        
        // Close keyboard on mobile devices
        if (isMobile && inputRef.current) {
          inputRef.current.blur()
        }
        return
      }
      
      // Store the code before clearing input
      const otpCode = input.trim()
      
      setMessages((msgs) => [
        ...msgs,
        {
          id: Date.now().toString(),
          role: 'user',
          content: otpCode,
          timestamp: new Date(),
        },
      ])
      setInput('')
      setJustSent(true)
      
      // Close keyboard on mobile devices
      if (isMobile && inputRef.current) {
        inputRef.current.blur()
      }
      
      setOtpError(null)
      
      // Verify OTP directly on frontend (better for PWAs)
      try {
        
        const { data, error } = await supabase.auth.verifyOtp({
          email: pendingEmail,
          token: otpCode,
          type: 'email',
        })
        
        if (error) {
          setOtpError('Invalid or expired code.')
          setMessages((msgs) => [
            ...msgs,
            {
              id: Date.now().toString() + '-ai',
              role: 'ai',
              content: 'Invalid or expired code. Please try again.',
              timestamp: new Date(),
            },
          ])
          setInput('')
          return
        }
        
        if (!data?.user) {
          setOtpError('Invalid or expired code.')
          setMessages((msgs) => [
            ...msgs,
            {
              id: Date.now().toString() + '-ai',
              role: 'ai',
              content: 'Invalid or expired code. Please try again.',
              timestamp: new Date(),
            },
          ])
          setInput('')
          return
        }
        
        // Success: session is automatically created and persisted by Supabase client
        // The onAuthStateChange listener will automatically update the user state
        // Show the welcome message
        setMessages((msgs) => [
          ...msgs,
          {
            id: Date.now().toString() + '-ai',
            role: 'ai',
            content: `Welcome, ${pendingName}! You're now signed in. Let's get started with your business setup.`,
            timestamp: new Date(),
          },
        ])
        setInput('')
      } catch (err) {
        setOtpError('Invalid or expired code.')
        setMessages((msgs) => [
          ...msgs,
          {
            id: Date.now().toString() + '-ai',
            role: 'ai',
            content: 'Invalid or expired code. Please try again.',
            timestamp: new Date(),
          },
        ])
        setInput('')
      }
      return
    }
  }

  const handleResendOTP = async () => {
    setOtpError(null)
    setOtpLoading('sending')
    
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setOtpError(data.error || 'Failed to resend OTP code.')
        setMessages((msgs) => [
          ...msgs,
          {
            id: Date.now().toString() + '-ai',
            role: 'ai',
            content: data.error || 'Failed to resend OTP code. Please try again.',
            timestamp: new Date(),
          },
        ])
        setOtpLoading('none')
        return
      }
      setOtpSent(true)
      setMessages((msgs) => [
        ...msgs,
        {
          id: Date.now().toString() + '-ai',
          role: 'ai',
          content: 'A new 6-digit code was sent to your email.',
          timestamp: new Date(),
        },
      ])
      setResendCooldown(30) // 30s cooldown
    } catch (err) {
      setOtpError('Failed to resend OTP code.')
      setMessages((msgs) => [
        ...msgs,
        {
          id: Date.now().toString() + '-ai',
          role: 'ai',
          content: 'Failed to resend OTP code. Please try again.',
          timestamp: new Date(),
        },
      ])
    }
    setOtpLoading('none')
  }

  return {
    handleOTPFlow,
    handleResendOTP,
  }
} 