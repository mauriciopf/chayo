import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

interface PricingSectionProps {
  onStartCall?: () => void;
}

export default function PricingSection({ onStartCall }: PricingSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const pricingTiers = [
    {
      name: "Chayo Básico",
      icon: "💬",
      price: "$97",
      period: "USD / mes",
      description: "Perfecto para pequeños negocios que quieren delegar su atención al cliente 24/7 con IA en WhatsApp, Instagram, Facebook y su sitio web.",
      features: [
        "1 Agente de texto Chayo",
        "$9 USD de saldo en respuestas IA",
        "Acceso a todos los modelos de ChatGPT",
        "Chat centralizado (multicanal)",
        "CRM y contactos ilimitados",
        "Reconocimiento de imágenes y notas de voz en WhatsApp Business",
        "Automatizaciones / Workflows básicos",
        "Soporte vía ticket",
        "Costos adicionales en ciertas acciones"
      ],
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      borderColor: "border-purple-200",
      popular: false
    },
    {
      name: "Chayo Pro",
      icon: "🧠",
      price: "$197",
      period: "USD / mes",
      description: "Para negocios que buscan combinar marketing inteligente con servicio al cliente IA, todo desde un solo lugar.",
      features: [
        "1 Agente de texto Chayo",
        "$20 USD en saldo de respuestas IA o voz",
        "Acceso a todos los modelos de ChatGPT",
        "CRM y contactos ilimitados",
        "Reconocimiento de imágenes y notas de voz en WhatsApp Business",
        "Automatizaciones / Workflows básicos",
        "Agentes ilimitados para llamadas entrantes y salientes",
        "Calendario inteligente integrado",
        "Formularios y encuestas personalizables",
        "Embudo de ventas (Pipeline)",
        "5 cuentas de equipo",
        "Soporte estándar vía chatbot",
        "Costos adicionales en ciertas acciones"
      ],
      gradient: "from-orange-500 to-yellow-500",
      bgGradient: "from-orange-50 to-yellow-50",
      borderColor: "border-orange-200",
      popular: true
    },
    {
      name: "Chayo Premium",
      icon: "🚀",
      price: "$297",
      period: "USD / mes",
      description: "Ideal para empresas que necesitan escalar, optimizar equipos y contar con soporte dedicado.",
      features: [
        "2 Agentes de texto Chayo",
        "Agentes ilimitados para llamadas Inbound y Outbound",
        "$30 USD en respuestas IA o saldo de voz",
        "Acceso a todos los modelos de ChatGPT",
        "Cuentas ilimitadas para tu equipo",
        "CRM y contactos ilimitados",
        "Reconocimiento de imágenes y notas de voz en WhatsApp Business",
        "Automatizaciones / Workflows avanzados",
        "Embudo de ventas (Pipeline)",
        "Calendario inteligente",
        "Formularios y encuestas",
        "Email Marketing",
        "Social Planner (publicaciones en redes)",
        "Módulo de Reseñas",
        "Soporte premium con atención personalizada",
        "Costos adicionales en ciertas acciones"
      ],
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-50 to-teal-50",
      borderColor: "border-emerald-200",
      popular: false
    }
  ];

  return (
    <div ref={ref} className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            className="inline-flex items-center gap-2 bg-purple-100 border border-purple-200 rounded-full px-6 py-2 mb-6"
          >
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-purple-700">Planes y Precios</span>
          </motion.div>

          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Elige tu{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              Chayo perfecta
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Desde pequeños negocios hasta empresas grandes, Chayo se adapta a tus necesidades
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className={`relative group ${tier.popular ? 'lg:-mt-4' : ''}`}
            >
              
              {/* Popular Badge */}
              {tier.popular && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
                >
                  <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg">
                    ¡Más Popular!
                  </div>
                </motion.div>
              )}

              {/* Card */}
              <div className={`relative h-full bg-white rounded-3xl border-2 ${tier.borderColor} p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105`}>
                
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${tier.bgGradient} rounded-3xl opacity-50`}></div>
                
                <div className="relative z-10">
                  
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${tier.gradient} rounded-full mb-4 text-2xl`}>
                      {tier.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{tier.description}</p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-8">
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-bold text-gray-900">{tier.price}</span>
                      <span className="text-gray-600 ml-2">{tier.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.6 + index * 0.1 + idx * 0.05 }}
                        className="flex items-start space-x-3"
                      >
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${tier.gradient} flex items-center justify-center mt-0.5 flex-shrink-0`}>
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-700 leading-tight">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 ${
                      tier.popular 
                        ? `bg-gradient-to-r ${tier.gradient}` 
                        : `bg-gradient-to-r ${tier.gradient}`
                    }`}
                  >
                    🔵 Solicita una demo
                  </motion.button>

                </div>
              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
