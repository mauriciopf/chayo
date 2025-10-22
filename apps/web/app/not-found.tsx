'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RootNotFound() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to Spanish 404 page
    router.push('/es/dashboard')
  }, [router])

  return (
    <html lang="es">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center px-4">
            <div className="animate-pulse">
              <p className="text-gray-600">Redirigiendo...</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

