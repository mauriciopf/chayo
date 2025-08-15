import { supabase } from '@/lib/shared/supabase/client'

export interface OTPAction {
  type: 'add_messages' | 'set_auth_state' | 'set_input' | 'set_loading' | 'set_error' | 'set_cooldown' | 'blur_input'
  payload?: any
}

export interface OTPFlowResult {
  success: boolean
  actions: OTPAction[]
  error?: string
}

export class OTPService {
  /**
   * Handle name input during auth flow
   */
  static handleNameInput(name: string): OTPFlowResult {
    if (!name.trim()) {
      return { success: false, actions: [], error: 'Name is required' }
    }

    return {
      success: true,
      actions: [
        {
          type: 'add_messages',
          payload: [
            {
              id: Date.now().toString(),
              role: 'user',
              content: name.trim(),
              timestamp: new Date(),
            },
            {
              id: Date.now().toString() + '-ai',
              role: 'ai',
              content: 'Great! What is your email address?',
              timestamp: new Date(),
            }
          ]
        },
        { type: 'set_input', payload: '' },
        { type: 'blur_input' },
        { type: 'set_auth_state', payload: 'awaitingEmail' }
      ]
    }
  }

  /**
   * Handle email input and send OTP
   */
  static async handleEmailInput(email: string): Promise<OTPFlowResult> {
    if (!email.trim()) {
      return { success: false, actions: [], error: 'Email is required' }
    }

    const actions: OTPAction[] = [
      {
        type: 'add_messages',
        payload: [{
          id: Date.now().toString(),
          role: 'user',
          content: email.trim(),
          timestamp: new Date(),
        }]
      },
      { type: 'set_input', payload: '' },
      { type: 'blur_input' },
      { type: 'set_auth_state', payload: 'awaitingOTP' },
      { type: 'set_error', payload: null },
      { type: 'set_loading', payload: 'sending' }
    ]

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        actions.push(
          {
            type: 'add_messages',
            payload: [{
              id: Date.now().toString() + '-ai',
              role: 'ai',
              content: data.error || 'Failed to send verification code. Please enter a valid email.',
              timestamp: new Date(),
            }]
          },
          { type: 'set_auth_state', payload: 'awaitingEmail' },
          { type: 'set_loading', payload: 'none' },
          { type: 'set_error', payload: data.error || 'Failed to send verification code.' }
        )
        return { success: false, actions, error: data.error }
      }

      // Success
      actions.push(
        {
          type: 'add_messages',
          payload: [{
            id: Date.now().toString() + '-ai',
            role: 'ai',
            content: 'I just sent a 6-digit code to your email. Please enter it below to continue.',
            timestamp: new Date(),
          }]
        },
        { type: 'set_cooldown', payload: 30 },
        { type: 'set_loading', payload: 'none' }
      )

      return { success: true, actions }
    } catch (err) {
      actions.push(
        {
          type: 'add_messages',
          payload: [{
            id: Date.now().toString() + '-ai',
            role: 'ai',
            content: 'Failed to send verification code. Please enter a valid email.',
            timestamp: new Date(),
          }]
        },
        { type: 'set_auth_state', payload: 'awaitingEmail' },
        { type: 'set_loading', payload: 'none' },
        { type: 'set_error', payload: 'Failed to send verification code.' }
      )
      return { success: false, actions, error: 'Network error' }
    }
  }

  /**
   * Handle OTP verification
   */
  static async handleOTPVerification(otp: string, pendingEmail: string): Promise<OTPFlowResult> {
    if (!otp.trim()) {
      return { success: false, actions: [], error: 'Verification code is required' }
    }

    const actions: OTPAction[] = [
      {
        type: 'add_messages',
        payload: [{
          id: Date.now().toString(),
          role: 'user',
          content: otp.trim(),
          timestamp: new Date(),
        }]
      },
      { type: 'set_input', payload: '' },
      { type: 'blur_input' },
      { type: 'set_loading', payload: 'verifying' }
    ]

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otp.trim(),
        type: 'email'
      })

      if (error) {
        actions.push(
          {
            type: 'add_messages',
            payload: [{
              id: Date.now().toString() + '-ai',
              role: 'ai',
              content: 'Invalid verification code. Please try again.',
              timestamp: new Date(),
            }]
          },
          { type: 'set_loading', payload: 'none' },
          { type: 'set_error', payload: 'Invalid verification code' }
        )
        return { success: false, actions, error: error.message }
      }

      // Success - auth state will be updated by the auth listener
      actions.push(
        { type: 'set_loading', payload: 'none' },
        { type: 'set_error', payload: null },
        { type: 'set_auth_state', payload: 'authenticated' }
      )

      return { success: true, actions }
    } catch (err) {
      actions.push(
        {
          type: 'add_messages',
          payload: [{
            id: Date.now().toString() + '-ai',
            role: 'ai',
            content: 'Failed to verify code. Please try again.',
            timestamp: new Date(),
          }]
        },
        { type: 'set_loading', payload: 'none' },
        { type: 'set_error', payload: 'Verification failed' }
      )
      return { success: false, actions, error: 'Verification failed' }
    }
  }

  /**
   * Resend OTP code
   */
  static async handleResendOTP(email: string): Promise<OTPFlowResult> {
    const actions: OTPAction[] = [
      { type: 'set_loading', payload: 'sending' },
      { type: 'set_error', payload: null }
    ]

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        actions.push(
          {
            type: 'add_messages',
            payload: [{
              id: Date.now().toString() + '-ai',
              role: 'ai',
              content: data.error || 'Failed to resend verification code.',
              timestamp: new Date(),
            }]
          },
          { type: 'set_loading', payload: 'none' },
          { type: 'set_error', payload: data.error || 'Failed to resend verification code.' }
        )
        return { success: false, actions, error: data.error }
      }

      // Success
      actions.push(
        {
          type: 'add_messages',
          payload: [{
            id: Date.now().toString() + '-ai',
            role: 'ai',
            content: 'New verification code sent! Please check your email.',
            timestamp: new Date(),
          }]
        },
        { type: 'set_cooldown', payload: 30 },
        { type: 'set_loading', payload: 'none' }
      )

      return { success: true, actions }
    } catch (err) {
      actions.push(
        {
          type: 'add_messages',
          payload: [{
            id: Date.now().toString() + '-ai',
            role: 'ai',
            content: 'Failed to resend verification code.',
            timestamp: new Date(),
          }]
        },
        { type: 'set_loading', payload: 'none' },
        { type: 'set_error', payload: 'Failed to resend verification code.' }
      )
      return { success: false, actions, error: 'Network error' }
    }
  }
}