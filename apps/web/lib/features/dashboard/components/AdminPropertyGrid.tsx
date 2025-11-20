import { motion } from 'framer-motion'
import { Home, MapPin, Bed, Bath, ChevronRight } from 'lucide-react'
import { Property } from '@/lib/features/products/hooks/useProperties'

interface AdminPropertyGridProps {
  properties: Property[]
  loading: boolean
  onSelectProperty: (property: Property) => void
}

export default function AdminPropertyGrid({ properties, loading, onSelectProperty }: AdminPropertyGridProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <Home className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No tienes propiedades registradas</h3>
        <p className="mt-2 text-sm text-gray-500">
          Registra tus propiedades en la pestaña Comercial para gestionarlas aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property, index) => (
        <motion.div
          key={property.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <button
            onClick={() => onSelectProperty(property)}
            className="w-full text-left bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group relative overflow-hidden flex flex-col h-full"
          >
            {/* Image Section */}
            <div className="relative h-40 w-full bg-gray-100 overflow-hidden">
              {property.image_url ? (
                <img 
                  src={property.image_url} 
                  alt={property.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-50 text-purple-300">
                  <Home className="h-12 w-12" />
                </div>
              )}
              
              {/* Status Badge (Example) */}
              <div className="absolute top-3 right-3">
                <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md text-xs font-semibold text-purple-700 shadow-sm">
                  Gestionar
                </span>
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-purple-700 transition-colors">
                  {property.name}
                </h3>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                <span className="truncate">{property.address || 'Sin dirección'}</span>
              </div>

              <div className="mt-auto flex items-center gap-3 text-xs text-gray-600 border-t border-gray-100 pt-3">
                {property.bedrooms !== undefined && (
                  <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                    <Bed className="h-3.5 w-3.5" /> {property.bedrooms}
                  </span>
                )}
                {property.bathrooms !== undefined && (
                  <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                    <Bath className="h-3.5 w-3.5" /> {property.bathrooms}
                  </span>
                )}
                {property.price && (
                  <span className="ml-auto font-bold text-gray-900">
                    ${property.price.toLocaleString()} <span className="font-normal text-gray-500 text-[10px]">/mes</span>
                  </span>
                )}
              </div>
            </div>
          </button>
        </motion.div>
      ))}
    </div>
  )
}

