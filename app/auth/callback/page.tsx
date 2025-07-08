'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallback() {
  const router = useRouter()
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
          router.push('/auth?error=' + encodeURIComponent(errorMessage))
          return
        }
        
        if (code) {
          console.log('Processing OAuth code...')
          
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('Code exchange error:', error)
            router.push('/auth?error=' + encodeURIComponent(error.message))
            return
          }

          if (data.session) {
            console.log('Session created successfully:', data.session.user.email)
            
            // Wait a moment to ensure session is fully persisted
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // Verify the session is accessible
            const { data: verifyData, error: verifyError } = await supabase.auth.getSession()
            
            if (verifyError) {
              console.error('Session verification error:', verifyError)
              router.push('/auth?error=' + encodeURIComponent('Session verification failed'))
              return
            }
            
            if (verifyData.session) {
              console.log('Session verified, redirecting to dashboard')
              // Use window.location.href for a hard redirect to ensure proper session handling
              window.location.href = '/dashboard'
              return
            } else {
              console.error('Session not found after verification')
              router.push('/auth?error=' + encodeURIComponent('Session not found'))
              return
            }
          } else {
            console.error('No session returned from code exchange')
            router.push('/auth?error=' + encodeURIComponent('No session created'))
            return
          }
        }
        
        // If no code, check for existing session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          router.push('/auth?error=' + encodeURIComponent(sessionError.message))
          return
        }

        if (sessionData.session) {
          // Session exists, redirect to dashboard
          console.log('Existing session found, redirecting to dashboard')
          window.location.href = '/dashboard'
        } else {
          // No session, redirect back to auth
          console.log('No session found, redirecting to auth')
          router.push('/auth')
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error)
        router.push('/auth?error=' + encodeURIComponent('Authentication failed'))
      }
    }

    handleAuthCallback()
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we redirect you to the dashboard</p>
      </div>
    </div>
  )
}
