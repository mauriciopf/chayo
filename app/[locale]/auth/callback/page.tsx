'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLocale, useTranslations } from 'next-intl'

export default function AuthCallback() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('auth')
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current URL to check for auth codes
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')
        const error = url.searchParams.get('error')
        const errorDescription = url.searchParams.get('error_description')
        
        // Handle OAuth errors
        if (error) {
          console.error('OAuth error:', error, errorDescription)
          const errorMessage = errorDescription || error
          router.push(`/${locale}/auth?error=` + encodeURIComponent(errorMessage))
          return
        }
        
        if (code) {
          console.log('Processing OAuth code...')
          
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('Code exchange error:', error)
            router.push(`/${locale}/auth?error=` + encodeURIComponent(error.message))
            return
          }

          if (data.session) {
            console.log('Session created successfully:', data.session.user.email)
            
            // Implement polling to ensure session is fully persisted
            const pollForSession = async (attempts = 0) => {
              const maxAttempts = 10
              const delay = 500
              
              try {
                const { data: verifyData, error: verifyError } = await supabase.auth.getSession()
                
                if (verifyError) {
                  console.error('Session verification error:', verifyError)
                  if (attempts < maxAttempts) {
                    console.log(`Retrying session verification... (${attempts + 1}/${maxAttempts})`)
                    await new Promise(resolve => setTimeout(resolve, delay))
                    return pollForSession(attempts + 1)
                  }
                  router.push(`/${locale}/auth?error=` + encodeURIComponent('Session verification failed'))
                  return
                }
                
                if (verifyData.session) {
                  console.log('Session verified successfully, redirecting to dashboard')
                  // Force a complete page reload to ensure session is picked up
                  window.location.replace(`/${locale}/dashboard`)
                  return
                }
                
                if (attempts < maxAttempts) {
                  console.log(`Session not ready yet, retrying... (${attempts + 1}/${maxAttempts})`)
                  await new Promise(resolve => setTimeout(resolve, delay))
                  return pollForSession(attempts + 1)
                }
                
                console.error('Session not found after maximum attempts')
                router.push(`/${locale}/auth?error=` + encodeURIComponent('Session not found'))
              } catch (pollError) {
                console.error('Error during session polling:', pollError)
                if (attempts < maxAttempts) {
                  await new Promise(resolve => setTimeout(resolve, delay))
                  return pollForSession(attempts + 1)
                }
                router.push(`/${locale}/auth?error=` + encodeURIComponent('Session polling failed'))
              }
            }
            
            // Start polling for session
            await pollForSession()
            return
          } else {
            console.error('No session returned from code exchange')
            router.push(`/${locale}/auth?error=` + encodeURIComponent('No session created'))
            return
          }
        }
        
        // If no code, check for existing session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          router.push(`/${locale}/auth?error=` + encodeURIComponent(sessionError.message))
          return
        }

        if (sessionData.session) {
          // Session exists, redirect to dashboard
          console.log('Existing session found, redirecting to dashboard')
          window.location.replace(`/${locale}/dashboard`)
        } else {
          // No session, redirect back to auth
          console.log('No session found, redirecting to auth')
          router.push(`/${locale}/auth`)
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error)
        router.push(`/${locale}/auth?error=` + encodeURIComponent('Authentication failed'))
      }
    }

    handleAuthCallback()
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{t('completingAuth')}</p>
        <p className="text-sm text-gray-500 mt-2">{t('redirectingToDashboard')}</p>
      </div>
    </div>
  )
}
