'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Página no encontrada
        </h2>
        <p className="text-gray-600 mb-8">
          Lo sentimos, la página que buscas no existe.
        </p>
        <Link
          href="/es/dashboard"
          className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

