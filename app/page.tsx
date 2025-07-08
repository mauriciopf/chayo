'use client'

import { Suspense } from 'react'
import ChayoAIHome from '@/components/ChayoAIHome'
import OAuthRedirectHandler from '@/components/OAuthRedirectHandler'

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <OAuthRedirectHandler />
      </Suspense>
      <ChayoAIHome />
    </>
  )
}
