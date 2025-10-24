'use client'

import { motion } from 'framer-motion'

interface ToolCard {
  id: string
  title: string
  description: string
  icon: string
  enabled: boolean
  category: 'chat' | 'products' | 'payments' | 'reminders' | 'forms' | 'reservations' | 'documents' | 'support'
}

interface DashboardCardGridProps {
  onCardClick: (category: string) => void
  onStartTutorial: () => void
  enabledTools: {
    products: boolean
    payments: boolean
    reminders: boolean
    forms: boolean
    reservations: boolean
  }
  isOnboardingComplete: boolean
}

export default function DashboardCardGrid({
  onCardClick,
  onStartTutorial,
  enabledTools,
  isOnboardingComplete,
}: DashboardCardGridProps) {
  
  const toolCards: ToolCard[] = [
    {
      id: 'chat',
      title: 'Asistente de IA',
      description: 'Configura tu negocio conversando con el asistente',
      icon: '💬',
      enabled: true, // Always enabled
      category: 'chat',
    },
    {
      id: 'products',
      title: 'Productos y Servicios',
      description: 'Gestiona tu catálogo y ofertas',
      icon: '🛍️',
      enabled: enabledTools.products,
      category: 'products',
    },
    {
      id: 'payments',
      title: 'Cobrar Pago',
      description: 'Envía enlaces de pago a tus clientes',
      icon: '💳',
      enabled: enabledTools.payments,
      category: 'payments',
    },
    {
      id: 'reminders',
      title: 'Recordatorios',
      description: 'Programa recordatorios por email',
      icon: '📧',
      enabled: enabledTools.reminders,
      category: 'reminders',
    },
    {
      id: 'forms',
      title: 'Formularios',
      description: 'Crea formularios personalizados',
      icon: '📋',
      enabled: enabledTools.forms,
      category: 'forms',
    },
    {
      id: 'reservations',
      title: 'Reservaciones',
      description: 'Gestiona citas y reservaciones',
      icon: '📅',
      enabled: enabledTools.reservations,
      category: 'reservations',
    },
    {
      id: 'documents',
      title: 'Compartir Documento',
      description: 'Comparte documentos con clientes',
      icon: '📄',
      enabled: true, // Always available
      category: 'documents',
    },
    {
      id: 'support',
      title: 'Soporte al Cliente',
      description: 'Configura soporte automático',
      icon: '💬',
      enabled: true, // Always available
      category: 'support',
    },
    {
      id: 'quick-links',
      title: 'Links Rápidos',
      description: 'Crea enlaces directos para compartir con clientes',
      icon: '🔗',
      enabled: true, // Always enabled
      category: 'quick-links',
    },
  ]

  const handleCardClick = (card: ToolCard) => {
    // If onboarding is not complete, only allow chat
    if (!isOnboardingComplete && card.id !== 'chat') {
      return
    }
    
    onCardClick(card.category)
  }

  const isCardAccessible = (card: ToolCard) => {
    if (!isOnboardingComplete) {
      return card.id === 'chat'
    }
    return true
  }

  return (
    <div className="h-full w-full overflow-auto bg-gray-50 p-8">
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">
              {isOnboardingComplete 
                ? 'Selecciona una herramienta para comenzar'
                : 'Completa tu configuración para acceder a todas las herramientas'}
            </p>
          </div>
          
          <button
            onClick={onStartTutorial}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
          >
            Comenzar Tutorial
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </motion.div>

        {/* 3 Column Grid */}
        <div className="grid grid-cols-3 gap-6">
          {toolCards.map((card, index) => {
            const isAccessible = isCardAccessible(card)
            const isActive = card.id === 'chat' || card.enabled
            
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <button
                  onClick={() => handleCardClick(card)}
                  disabled={!isAccessible}
                  className={`
                    group w-full p-6 rounded-2xl text-left transition-all duration-300 ease-out
                    ${isAccessible
                      ? 'bg-white hover:!bg-purple-50 hover:shadow-2xl hover:-translate-y-2 hover:border-purple-300 cursor-pointer'
                      : 'bg-gray-100 cursor-not-allowed opacity-60'
                    }
                    ${isActive && isAccessible
                      ? 'border-2 border-purple-200 shadow-md'
                      : 'border-2 border-gray-200'
                    }
                  `}
                >
                  {/* Icon */}
                  <div className={`
                    text-5xl mb-4
                    ${!isAccessible ? 'grayscale' : ''}
                  `}>
                    {card.icon}
                  </div>

                  {/* Title */}
                  <h3 className={`
                    text-xl font-semibold mb-2
                    ${isAccessible ? 'text-gray-900' : 'text-gray-500'}
                  `}>
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p className={`
                    text-sm
                    ${isAccessible ? 'text-gray-600' : 'text-gray-400'}
                  `}>
                    {card.description}
                  </p>

                  {/* Status Badge */}
                  {isAccessible && (
                    <div className="mt-4">
                      {card.enabled ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Configurar
                        </span>
                      )}
                    </div>
                  )}

                  {!isAccessible && (
                    <div className="mt-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        🔒 Completa configuración
                      </span>
                    </div>
                  )}
                </button>
              </motion.div>
            )
          })}
        </div>

        {/* Helper Text */}
        {!isOnboardingComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mt-8 p-4 bg-purple-50 border border-purple-200 rounded-lg"
          >
            <p className="text-sm text-purple-900">
              💡 <strong>Consejo:</strong> Completa tu configuración inicial usando el Asistente de IA para desbloquear todas las herramientas.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

