'use client'

import React, { useState } from 'react'
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
          Herramienta de Productos y Servicios
        </h4>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Habilita esta herramienta de agente arriba para gestionar tu catálogo de productos y servicios que se puede compartir con los clientes.
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
            Gestión de Productos y Servicios
          </h4>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Gestiona tu catálogo de productos, servicios y ofertas promocionales que se pueden compartir con los clientes.
        </p>
      </div>
      
      {/* Products Manager with integrated offers */}
      <ProductsManager organizationId={organizationId} />
    </div>
  )
}

export default ProductsToolConfig
