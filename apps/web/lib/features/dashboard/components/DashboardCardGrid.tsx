'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { ToolType } from '@/lib/features/tools/shared/services/ToolSystemService'
import { useProperties, Property } from '@/lib/features/products/hooks/useProperties'
import AdminPropertyGrid from './AdminPropertyGrid'

interface ToolCard {
  id: string
  title: string
  description: string
  icon: string
  enabled: boolean
  category: 'chat' | 'products' | 'payments' | 'reminders' | 'forms' | 'reservations' | 'documents' | 'support' | 'quick-links'
  linkSlug?: string
}

interface DashboardCardGridProps {
  onCardClick: (category: string) => void
  onStartTutorial: () => void
  onWhatsAppShare: (toolLink: string, toolName: string, toolType: ToolType) => void
  onWhatsAppSetup?: () => void // NEW: Open WhatsApp setup flow
  enabledTools: {
    products: boolean
    payments: boolean
    reminders: boolean
    forms: boolean
    reservations: boolean
  }
  isOnboardingComplete: boolean
  organizationSlug: string
  organizationId?: string
  selectedProperty?: Property | null
  onSelectProperty?: (property: Property | null) => void
}

export default function DashboardCardGrid({
  onCardClick,
  onStartTutorial,
  onWhatsAppShare,
  onWhatsAppSetup,
  enabledTools,
  isOnboardingComplete,
  organizationSlug,
  organizationId,
  selectedProperty,
  onSelectProperty,
}: DashboardCardGridProps) {
  // Define tabs
  const [activeTab, setActiveTab] = useState<'commercial' | 'admin'>('commercial')
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  // Internal state fallback if not controlled (though we aim to control it)
  const [internalSelectedProperty, setInternalSelectedProperty] = useState<Property | null>(null)
  
  const activeSelectedProperty = selectedProperty !== undefined ? selectedProperty : internalSelectedProperty
  const handleSelectProperty = onSelectProperty || setInternalSelectedProperty

  // Load properties for Admin tab
  const { properties, loading: propertiesLoading } = useProperties(organizationId)

  const tabs = [
    { id: 'commercial', label: 'Comercial y Ventas', icon: '🏠', description: 'Captación, listados y visitas' },
    { id: 'admin', label: 'Administración', icon: '💼', description: 'Contratos, cobranza y gestión' },
  ] as const

  const toolCards: ToolCard[] = [
    // Comercial Tools
    {
      id: 'products',
      title: 'Propiedades',
      description: 'Gestiona tus inmuebles en renta o venta',
      icon: '🏠',
      enabled: enabledTools.products,
      category: 'products',
      // No linkSlug - each product gets its own link inside the tool
    },
    {
      id: 'reservations',
      title: 'Citas y Visitas',
      description: 'Gestiona visitas a tus propiedades',
      icon: '📅',
      enabled: enabledTools.reservations,
      category: 'reservations',
      linkSlug: 'reservation', // General booking calendar
    },
    {
      id: 'chat',
      title: 'Asistente de IA',
      description: 'Configura tu negocio y atiende leads',
      icon: '🤖',
      enabled: true,
      category: 'chat',
      linkSlug: 'chat', // General link makes sense
    },
    {
      id: 'quick-links',
      title: 'Links Rápidos',
      description: 'Comparte tu inventario y perfiles',
      icon: '🔗',
      enabled: true,
      category: 'quick-links',
      // Hub - no general link needed
    },
    // Admin Tools
    {
      id: 'reminders',
      title: 'Recordatorios',
      description: 'Seguimiento de clientes y pagos',
      icon: '⏰',
      enabled: enabledTools.reminders,
      category: 'reminders',
      // No linkSlug - reminders are internal, not shareable
    },
    {
      id: 'forms',
      title: 'Formularios',
      description: 'Solicitudes de arrendamiento y mantenimiento',
      icon: '📋',
      enabled: enabledTools.forms,
      category: 'forms',
      linkSlug: 'form', // Can link to main form or form list
    },
    {
      id: 'documents',
      title: 'Documentos',
      description: 'Gestiona contratos y archivos',
      icon: '📄',
      enabled: true,
      category: 'documents',
      // No linkSlug - each document gets its own link inside the tool
    },
    {
      id: 'support',
      title: 'Soporte',
      description: 'Atención a inquilinos y reportes',
      icon: '💬',
      enabled: true,
      category: 'support',
      linkSlug: 'help', // General support/help center
    },
  ]

  // Filter cards based on active tab and selection state
  const filteredCards = toolCards.filter(card => {
    if (activeTab === 'commercial') {
      return ['products', 'reservations', 'chat', 'quick-links', 'reminders'].includes(card.id)
    } else {
      // Admin tab
      // Only show tools if a property is selected (or handle logic in render)
      // The list of tools available for a property:
      return ['reminders', 'forms', 'documents', 'support'].includes(card.id)
    }
  })

  const handleCardClick = (card: ToolCard) => {
    if (!isOnboardingComplete && card.id !== 'chat') {
      return
    }
    // TODO: Pass selectedProperty context if available
    onCardClick(card.category)
  }

  const isCardAccessible = (card: ToolCard) => {
    if (!isOnboardingComplete) {
      return card.id === 'chat'
    }
    return true
  }

  const handleShareWhatsApp = (e: React.MouseEvent, card: ToolCard) => {
    e.stopPropagation()
    if (!card.linkSlug) return
    
    const link = `https://chayo.onelink.me/SB63?deep_link_value=${organizationSlug}&deep_link_sub1=${card.linkSlug}`
    
    // Map category to ToolType
    const toolTypeMap: Record<string, ToolType> = {
      'chat': 'vibe_card',
      'products': 'products',
      'reservations': 'reservations',
      'forms': 'intake_forms',
      'documents': 'documents',
      'support': 'customer_support',
      'quick-links': 'vibe_card'  // Fallback to vibe_card
    }
    
    const toolType = toolTypeMap[card.category] || 'vibe_card'
    
    // Notify parent to open WhatsApp flow with toolType
    onWhatsAppShare(link, card.title, toolType)
  }

  const generateShortLink = (linkSlug?: string) => {
    if (!linkSlug) return ''
    // Use AppsFlyer OneLink - matches mobile DeepLinkService
    return `https://chayo.onelink.me/SB63?deep_link_value=${organizationSlug}&deep_link_sub1=${linkSlug}`
  }

  const getDisplayLink = (linkSlug?: string) => {
    if (!linkSlug) return ''
    // Show branded short version for better UX (actual OneLink is used behind the scenes)
    return `chayo.onelink.me/${linkSlug}`
  }

  return (
    <div className="h-full w-full overflow-auto bg-gray-50 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Crea tu propio agente inmobiliario IA
              </h1>
              <p className="text-xl text-gray-600 mb-6 flex items-center gap-2 flex-wrap">
                Atiende leads 24/7, agenda citas, firma documentos y recibe pagos por
                {onWhatsAppSetup ? (
                  <button
                    onClick={onWhatsAppSetup}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 font-medium text-base hover:bg-green-100 transition-colors border border-green-200"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    WhatsApp
                  </button>
                ) : (
                  <span className="text-green-600 font-medium">WhatsApp</span>
                )}
              </p>

              {/* Tab Navigation - Enhanced Segmented Control */}
              <div className="w-full bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm inline-flex mb-8 relative">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        relative flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-medium transition-all duration-300
                        ${isActive 
                          ? 'text-purple-900' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-purple-50 rounded-xl border border-purple-100 shadow-sm"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 text-2xl">{tab.icon}</span>
                      <div className="relative z-10 text-left">
                        <div className="text-base font-bold">{tab.label}</div>
                        <div className={`text-xs ${isActive ? 'text-purple-700' : 'text-gray-400'}`}>{tab.description}</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {!isOnboardingComplete && (
                <p className="text-sm text-orange-600 font-medium mb-4">
                  💡 Completa tu configuración para acceder a todas las herramientas
                </p>
              )}
            </div>
            
            <button
              onClick={onStartTutorial}
              className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
            >
              Comenzar Tutorial
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* 2 Column Grid (Adaptive) or Admin Property View */}
        {activeTab === 'admin' && !activeSelectedProperty ? (
          <AdminPropertyGrid
            properties={properties}
            loading={propertiesLoading}
            onSelectProperty={handleSelectProperty}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Back button for Admin Property View */}
            {activeTab === 'admin' && activeSelectedProperty && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full mb-2"
              >
                <button
                  onClick={() => handleSelectProperty(null)}
                  className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors mb-4 group"
                >
                  <div className="p-2 rounded-full bg-white border border-gray-200 group-hover:border-purple-200 group-hover:bg-purple-50">
                    <ArrowLeft className="h-5 w-5" />
                  </div>
                  <span className="font-medium">Volver a Propiedades</span>
                </button>
                
                <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-sm mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 text-purple-700 rounded-lg">
                      <span className="text-2xl">🏠</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Gestionando</p>
                      <h2 className="text-xl font-bold text-gray-900">{activeSelectedProperty.name}</h2>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="popLayout">
              {filteredCards.map((card, index) => {
                const isAccessible = isCardAccessible(card)
                const isActive = card.id === 'chat' || card.enabled
                const isHovered = hoveredCard === card.id
                const hasLink = card.linkSlug && card.id !== 'quick-links' && isAccessible
                
                return (
                  <motion.div
                    key={card.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    onMouseEnter={() => setHoveredCard(card.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                  <button
                    onClick={() => handleCardClick(card)}
                    disabled={!isAccessible}
                    className={`
                      group relative w-full p-6 rounded-2xl text-left transition-all duration-300 ease-out overflow-hidden
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
                    {/* Subtle gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    
                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon */}
                      <div className={`
                        text-5xl mb-4 transition-transform duration-300
                        ${isHovered && isAccessible ? 'scale-110' : 'scale-100'}
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
                      <div className="mt-4">
                        {isAccessible ? (
                          card.enabled ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Configurar
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            🔒 Completa configuración
                          </span>
                        )}
                      </div>

                      {/* Shareable Link Section - Progressive Disclosure */}
                      <AnimatePresence>
                        {hasLink && isHovered && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 border-t border-gray-200">
                              {/* Link Display */}
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  Link compartible
                                </span>
                              </div>
                              
                              {/* Shortened URL Display */}
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex-1 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                                  <p className="text-xs font-mono text-purple-900 truncate">
                                    {getDisplayLink(card.linkSlug)}
                                  </p>
                                </div>
                              </div>

                              {/* Action Button - WhatsApp Only */}
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e: React.MouseEvent) => handleShareWhatsApp(e, card)}
                                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-all"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                              </svg>
                              Compartir por WhatsApp
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                      </AnimatePresence>
                    </div>
                  </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

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
  )
}
