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

export interface OTPTranslations {
  askEmail: string
  codeSent: string
  codeInvalid: string
  codeFailed: string
  sendFailed: string
  resendFailed: string
  resendSuccess: string
  nameRequired: string
  emailRequired: string
  codeRequired: string
}

export class OTPService {
  /**
   * Handle name input during auth flow
   */
  static handleNameInput(name: string, t: OTPTranslations): OTPFlowResult {
    if (!name.trim()) {
      return { success: false, actions: [], error: t.nameRequired }
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
              content: t.askEmail,
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
  static async handleEmailInput(email: string, t: OTPTranslations): Promise<OTPFlowResult> {
    if (!email.trim()) {
      return { success: false, actions: [], error: t.emailRequired }
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
              content: data.error || t.sendFailed,
              timestamp: new Date(),
            }]
          },
          { type: 'set_auth_state', payload: 'awaitingEmail' },
          { type: 'set_loading', payload: 'none' },
          { type: 'set_error', payload: data.error || t.sendFailed }
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
            content: t.codeSent,
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
            content: t.sendFailed,
            timestamp: new Date(),
          }]
        },
        { type: 'set_auth_state', payload: 'awaitingEmail' },
        { type: 'set_loading', payload: 'none' },
        { type: 'set_error', payload: t.sendFailed }
      )
      return { success: false, actions, error: 'Network error' }
    }
  }

  /**
   * Handle OTP verification
   */
  static async handleOTPVerification(otp: string, pendingEmail: string, t: OTPTranslations): Promise<OTPFlowResult> {
    if (!otp.trim()) {
      return { success: false, actions: [], error: t.codeRequired }
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
              content: t.codeInvalid,
              timestamp: new Date(),
            }]
          },
          { type: 'set_loading', payload: 'none' },
          { type: 'set_error', payload: t.codeInvalid }
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
            content: t.codeFailed,
            timestamp: new Date(),
          }]
        },
        { type: 'set_loading', payload: 'none' },
        { type: 'set_error', payload: t.codeFailed }
      )
      return { success: false, actions, error: 'Verification failed' }
    }
  }

  /**
   * Resend OTP code
   */
  static async handleResendOTP(email: string, t: OTPTranslations): Promise<OTPFlowResult> {
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
              content: data.error || t.resendFailed,
              timestamp: new Date(),
            }]
          },
          { type: 'set_loading', payload: 'none' },
          { type: 'set_error', payload: data.error || t.resendFailed }
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
            content: t.resendSuccess,
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
            content: t.resendFailed,
            timestamp: new Date(),
          }]
        },
        { type: 'set_loading', payload: 'none' },
        { type: 'set_error', payload: t.resendFailed }
      )
      return { success: false, actions, error: 'Network error' }
    }
  }
}