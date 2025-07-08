'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ChayoAIHome from '@/components/ChayoAIHome'

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle OAuth callback redirect if it lands on home page
  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      // If there's an OAuth code, redirect to the proper callback
      console.log('OAuth code detected on home page, redirecting to callback...')
      window.location.replace(`/auth/callback?${searchParams.toString()}`)
    }
  }, [searchParams])

  return <ChayoAIHome />
}
