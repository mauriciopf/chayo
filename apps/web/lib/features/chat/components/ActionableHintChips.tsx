'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import HorizontalCarousel from '@/lib/shared/components/HorizontalCarousel'

export type ActionableHint = {
  id: string
  label: string
  icon: string
  description: string
  category: 'documents' | 'payments' | 'products' | 'intake_forms' | 'faqs' | 'vibe-card' | 'customer_support'
}

interface ActionableHintChipsProps {
  onHintSelect: (hint: ActionableHint) => void
  organizationId: string
  className?: string
}

type AgentToolSettings = {
  [key in Exclude<ActionableHint['category'], 'vibe-card'>]: boolean
}

const ActionableHintChips: React.FC<ActionableHintChipsProps> = ({ 
  onHintSelect,
  organizationId,
  className = ''
}) => {
  const t = useTranslations('chat')

  // Helper function to check if a hint is enabled (special handling for vibe-card)
  const isHintEnabled = (category: ActionableHint['category']): boolean => {
    if (category === 'vibe-card') {
      return true // Vibe card is always "enabled" as a core feature
    }
    return agentToolSettings[category as keyof AgentToolSettings] || false
  }

  const [agentToolSettings, setAgentToolSettings] = useState<AgentToolSettings>({
    documents: false,
    payments: false,
    products: false,
    intake_forms: false,
    faqs: false,
    customer_support: false
  })

  // Define the actionable hints
  const actionableHints: ActionableHint[] = [
    {
      id: 'vibe_card',
      label: '💖 Vibe Card',
      icon: '💖',
      description: 'Crea tu tarjeta vibe única para atraer clientes ideales.',
      category: 'vibe-card'
    },
    {
      id: 'products_services',
      label: '🛍️ Productos y Servicios',
      icon: '🛍️',
      description: 'Comparte tu catálogo de productos, lista de servicios o información de precios.',
      category: 'products'
    },
    {
      id: 'customer_support',
      label: '💬 Soporte al Cliente',
      icon: '💬',
      description: 'Gestiona conversaciones de clientes y tickets de soporte en tiempo real.',
      category: 'customer_support'
    },
    {
      id: 'share_document',
      label: '📝 Compartir documento',
      icon: '📝',
      description: 'Envía formularios, acuerdos u hojas de información.',
      category: 'documents'
    },
    {
      id: 'collect_payment',
      label: '💳 Cobrar pago',
      icon: '💳',
      description: 'Envía un enlace de pago o confirma detalles de pago.',
      category: 'payments'
    },
    {
      id: 'collect_intake_form',
      label: '📋 Formulario de ingreso',
      icon: '📋',
      description: 'Envía formularios personalizados para recopilar información, preferencias o requisitos del cliente.',
      category: 'intake_forms'
    },
    {
      id: 'answer_faqs',
      label: '❓ Responder FAQ',
      icon: '❓',
      description: 'Horarios de negocio, ubicación, precios, políticas.',
      category: 'faqs'
    }
  ]

  // Load agent tool settings on component mount
  useEffect(() => {
    if (organizationId) {
      loadAgentToolSettings()
    }
  }, [organizationId])

  const loadAgentToolSettings = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/agent-tools`)
      if (response.ok) {
        const settings = await response.json()
        setAgentToolSettings(settings)
      }
    } catch (error) {
      console.error('Error loading agent tool settings:', error)
    }
  }

  const handleHintClick = (hint: ActionableHint) => {
    // Always open the modal when a hint is clicked
    onHintSelect(hint)
  }

  return (
    <div className={`w-full ${className}`}>
      <HorizontalCarousel>
        {/* Hint Chips */}
        {actionableHints.map((hint) => (
          <button
            key={hint.id}
            onClick={() => handleHintClick(hint)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium relative whitespace-nowrap cursor-pointer border ${
              isHintEnabled(hint.category)
                ? 'shadow-lg ring-1'
                : ''
            }`}
            style={{
              backgroundColor: isHintEnabled(hint.category) ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              borderColor: isHintEnabled(hint.category) ? 'var(--border-focus)' : 'var(--border-secondary)',
              minWidth: '160px'
            }}
            title={hint.description}
          >
            {/* Subtle background pattern for enabled state */}
            {isHintEnabled(hint.category) && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
            )}
            
            <span className="relative z-10">
              {hint.label}
            </span>
            
            {/* Active indicator */}
            {isHintEnabled(hint.category) && (
              <div
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full shadow-sm ring-2"
                style={{ 
                  backgroundColor: 'var(--text-primary)',
                  '--tw-ring-color': 'var(--border-focus)'
                } as React.CSSProperties}
              />
            )}
          </button>
        ))}
      </HorizontalCarousel>
    </div>
  )
}

export default ActionableHintChips