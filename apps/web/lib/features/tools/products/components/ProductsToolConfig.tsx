'use client'

import React from 'react'
import PropertiesManager from '@/components/products/PropertiesManager'
import { Home } from 'lucide-react'

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
  if (!isEnabled) {
    return (
      <div 
        className="p-6 rounded-lg border text-center"
        style={{ 
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-primary)'
        }}
      >
        <Home className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Herramienta de Propiedades
        </h4>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Habilita esta herramienta para gestionar tus propiedades que se pueden compartir con los clientes.
        </p>
      </div>
    )
  }

  return (
    <PropertiesManager organizationId={organizationId} />
  )
}

export default ProductsToolConfig
