'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import ProductsManager from '@/components/products/ProductsManager'
import { Package } from 'lucide-react'

interface ProductsToolConfigProps {
  organizationId: string
  isEnabled: boolean
  onSettingsChange?: () => void
}

const ProductsToolConfig: React.FC<ProductsToolConfigProps> = ({
  organizationId,
  isEnabled,
  onSettingsChange
}) => {
  const t = useTranslations('agentTools')

  if (!isEnabled) {
    return (
      <div 
        className="p-6 rounded-lg border text-center"
        style={{ 
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-primary)'
        }}
      >
        <Package className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Products & Services Tool
        </h4>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Enable this agent tool above to manage your products and services catalog that can be shared with clients.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div 
        className="p-4 rounded-lg border"
        style={{ 
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-primary)'
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Package className="h-5 w-5" style={{ color: 'var(--accent-secondary)' }} />
          <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
            Products & Services Management
          </h4>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Manage your product catalog and services that can be shared with clients through the chat interface.
        </p>
      </div>
      
      <ProductsManager organizationId={organizationId} />
    </div>
  )
}

export default ProductsToolConfig
