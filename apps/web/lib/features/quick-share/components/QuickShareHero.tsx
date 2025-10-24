'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import QuickLinksManager from '@/lib/features/tools/quick-links/components/QuickLinksManager'

interface QuickShareHeroProps {
  organizationSlug: string
  organizationId: string
  onQuickAction: (type: string) => void
  onViewAllLinks?: () => void
}

export default function QuickShareHero({ organizationSlug, organizationId, onQuickAction, onViewAllLinks }: QuickShareHeroProps) {
  const [showFullManager, setShowFullManager] = useState(false)
  const [recentLinks] = useState([
    // Mock data - will be replaced with real data
  ])

  const handleViewAllLinks = () => {
    if (onViewAllLinks) {
      onViewAllLinks()
    } else {
      setShowFullManager(true)
    }
  }

  const quickActions = [
    {
      type: 'product',
      icon: '🛍️',
      title: 'Producto',
      description: 'Comparte un producto',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      type: 'reservation',
      icon: '📅',
      title: 'Reservación',
      description: 'Agenda una cita',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      type: 'form',
      icon: '📋',
      title: 'Formulario',
      description: 'Recolecta información',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      type: 'payment',
      icon: '💳',
      title: 'Pago',
      description: 'Cobra fácilmente',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      type: 'document',
      icon: '📄',
      title: 'Documento',
      description: 'Comparte archivos',
      gradient: 'from-indigo-500 to-purple-500'
    },
  ]

  if (showFullManager) {
    return (
      <div className="w-full">
        <button
          onClick={() => setShowFullManager(false)}
          className="mb-4 flex items-center gap-2 text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          ← Volver al Dashboard
        </button>
        <QuickLinksManager
          organizationSlug={organizationSlug}
          organizationId={organizationId}
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            🚀 Comparte con tus Clientes
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Crea y comparte links en segundos - por SMS, Email o WhatsApp
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onQuickAction(action.type)}
              className="group relative overflow-hidden rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-2xl"
              style={{
                background: `linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)`,
                border: '1px solid var(--border-primary)',
              }}
            >
              {/* Gradient Overlay on Hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
              />
              
              <div className="relative z-10">
                <div className="text-4xl mb-3">{action.icon}</div>
                <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                  {action.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {action.description}
                </p>
              </div>

              {/* Shine Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-transform duration-1000" />
              </div>
            </motion.button>
          ))}
        </div>

        {/* View All Links */}
        <div className="text-center">
          <button
            onClick={handleViewAllLinks}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text-primary)',
            }}
          >
            Ver Todos los Links
            <span className="text-lg">→</span>
          </button>
        </div>
      </motion.div>

      {/* Recent Links Section */}
      {recentLinks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            📊 Links Recientes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentLinks.map((link: any) => (
              <div
                key={link.id}
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-primary)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {link.name}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      {link.clicks || 0} clicks
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg hover:bg-opacity-80 transition-colors">
                      📋
                    </button>
                    <button className="p-2 rounded-lg hover:bg-opacity-80 transition-colors">
                      📱
                    </button>
                    <button className="p-2 rounded-lg hover:bg-opacity-80 transition-colors">
                      📧
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 grid grid-cols-3 gap-4"
      >
        <div className="p-6 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="text-3xl font-bold mb-1" style={{ color: 'var(--accent-primary)' }}>
            0
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Links Creados
          </div>
        </div>
        <div className="p-6 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="text-3xl font-bold mb-1" style={{ color: 'var(--accent-primary)' }}>
            0
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Clicks Totales
          </div>
        </div>
        <div className="p-6 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="text-3xl font-bold mb-1" style={{ color: 'var(--accent-primary)' }}>
            0%
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Tasa de Conversión
          </div>
        </div>
      </motion.div>
    </div>
  )
}

