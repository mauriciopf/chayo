'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { getAuthCallbackUrl } from '@/lib/utils/auth'
import { useTranslations, useLocale } from 'next-intl'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [initialLoading, setInitialLoading] = useState(true)
  const router = useRouter()
  const t = useTranslations('auth')
  const locale = useLocale()
  
  const supabase = createClient()

  // Check if user is already logged in and handle URL error parameters
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Auth page: Checking session...')
        console.log('Auth page: Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
        console.log('Auth page: Supabase key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth page: Session error:', error)
          setMessage(`Error: ${error.message}`)
          setInitialLoading(false)
          return
        }
        
        console.log('Auth page: Session result:', session ? 'Found session' : 'No session')
        
        if (session) {
          console.log('Auth page: Redirecting to dashboard...')
          router.push(`/${locale}/dashboard`)
          return
        }
        
        // Check for error in URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        const urlError = urlParams.get('error')
        if (urlError) {
          console.log('Auth page: URL error found:', urlError)
          setMessage(decodeURIComponent(urlError))
        }
      } catch (error) {
        console.error('Auth page: Error checking session:', error)
        setMessage(`Unexpected error: ${error}`)
      } finally {
        console.log('Auth page: Setting initial loading to false')
        setInitialLoading(false)
      }
    }

    checkSession()
  }, [router, supabase.auth, locale])

  // If still checking session, show loading
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    )
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        })
        if (error) throw error
        // Immediately check for session (should exist if email confirmation is off)
        if (data.session) {
          router.push(`/${locale}/dashboard`)
        } else {
          setMessage('Sign up successful, but no session found. Please try logging in.')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        
        // Check if session was created successfully
        if (data.session) {
          router.push(`/${locale}/dashboard`)
        } else {
          throw new Error('Login failed - no session created')
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      setMessage(error.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      console.log('Starting Google OAuth with redirect to:', getAuthCallbackUrl())
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getAuthCallbackUrl(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })
      
      if (error) {
        throw error
      }
      
      // The redirect will happen automatically, so we don't need to do anything else
    } catch (error: any) {
      console.error('Google auth error:', error)
      setMessage(error.message || 'Google authentication failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isSignUp ? t('signUpTitle') : t('signInTitle')}
            </h1>
            <p className="text-gray-600">
              {isSignUp ? t('signUpSubtitle') : t('signInSubtitle')}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {message && (
              <div className={`text-sm p-3 rounded-lg ${
                message.includes('error') || message.includes('Invalid') 
                  ? 'bg-red-50 text-red-600 border border-red-200' 
                  : 'bg-green-50 text-green-600 border border-green-200'
              }`}>
                {message}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('processing') : (isSignUp ? t('createAccount') : t('signIn'))}
            </motion.button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t('orContinueWith')}</span>
              </div>
            </div>

            <motion.button
              onClick={handleGoogleAuth}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-4 w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('continueWithGoogle')}
            </motion.button>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              {isSignUp 
                ? t('alreadyHaveAccount')
                : t('dontHaveAccount')
              }
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
