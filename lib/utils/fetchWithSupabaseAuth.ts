import { supabase } from '@/lib/supabase/client'

export async function fetchWithSupabaseAuth(
  url: string,
  options: RequestInit = {}
) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  const accessToken = sessionData?.session?.access_token

  if (!accessToken || sessionError) {
    // Optional: handle logout and redirect if needed
    await supabase.auth.signOut()
    console.warn('🔒 Session missing or expired. User signed out.')
    throw new Error('User is not authenticated. Please log in again.')
  }

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  headers.set('Content-Type', 'application/json')

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Always include credentials for cookies
  }

  return fetch(url, fetchOptions)
} 