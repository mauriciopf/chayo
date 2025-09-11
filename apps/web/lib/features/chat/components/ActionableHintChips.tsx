'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import HorizontalCarousel from '@/lib/shared/components/HorizontalCarousel'

export type ActionableHint = {
  id: string
  label: string
  icon: string
  description: string
  category: 'appointments' | 'documents' | 'payments' | 'products' | 'intake_forms' | 'faqs' | 'mobile-branding'
}

interface ActionableHintChipsProps {
  onHintSelect: (hint: ActionableHint) => void
  organizationId: string
  className?: string
}

type AgentToolSettings = {
  [key in ActionableHint['category']]: boolean
}

const ActionableHintChips: React.FC<ActionableHintChipsProps> = ({ 
  onHintSelect,
  organizationId,
  className = ''
}) => {
  const t = useTranslations('chat')

  const [agentToolSettings, setAgentToolSettings] = useState<AgentToolSettings>({
    'mobile-branding': false,
    appointments: false,
    documents: false,
    payments: false,
    products: false,
    intake_forms: false,
    faqs: false
  })

  // Define the actionable hints
  const actionableHints: ActionableHint[] = [
    {
      id: 'mobile_branding',
      label: '📱 Mobile branding',
      icon: '📱',
      description: 'Customize mobile app colors, logo, and branding.',
      category: 'mobile-branding'
    },
    {
      id: 'schedule_appointment',
      label: '📅 Schedule appointment',
      icon: '📅',
      description: 'Book a meeting, reservation, or service time slot.',
      category: 'appointments'
    },
    {
      id: 'share_document',
      label: '📝 Share document',
      icon: '📝',
      description: 'Send intake forms, agreements, or information sheets.',
      category: 'documents'
    },
    {
      id: 'collect_payment',
      label: '💳 Collect payment',
      icon: '💳',
      description: 'Send a payment link or confirm payment details.',
      category: 'payments'
    },
    {
      id: 'products_services',
      label: '🛍️ Products & Services',
      icon: '🛍️',
      description: 'Share your product catalog, services list, or pricing information.',
      category: 'products'
    },
    {
      id: 'collect_intake_form',
      label: '📋 Intake form',
      icon: '📋',
      description: 'Send custom forms to collect client information, preferences, or requirements.',
      category: 'intake_forms'
    },
    {
      id: 'answer_faqs',
      label: '❓ Answer FAQ',
      icon: '❓',
      description: 'Business hours, location, pricing, policies.',
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
              agentToolSettings[hint.category]
                ? 'shadow-lg ring-1'
                : ''
            }`}
            style={{
              backgroundColor: agentToolSettings[hint.category] ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              borderColor: agentToolSettings[hint.category] ? 'var(--border-focus)' : 'var(--border-secondary)',
              minWidth: '160px'
            }}
            title={hint.description}
          >
            {/* Subtle background pattern for enabled state */}
            {agentToolSettings[hint.category] && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
            )}
            
            <span className="relative z-10">
              {hint.label}
            </span>
            
            {/* Active indicator */}
            {agentToolSettings[hint.category] && (
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