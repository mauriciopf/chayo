import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { useRouter } from "next/navigation";

interface PricingSectionProps {
  onStartCall?: () => void;
}

export default function PricingSection({ onStartCall }: PricingSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const router = useRouter();

  const handleSolicitaDemo = () => {
    router.push('/auth');
  };

  const pricingTiers = [
    {
      name: "Plan Básico",
      icon: "💬",
      price: "$49",
      period: "USD / mes",
      description: "Ideal para pequeños negocios que quieren responder sin estar pegados al celular.",
      features: [
        "WhatsApp AI Agent",
        "Chat inteligente con respuestas personalizadas",
        "Confirmación automática de citas",
        "Soporte por email",
        "Acceso al panel de control Chayo"
      ],
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      borderColor: "border-purple-200",
      popular: true
    },
    {
      name: "Plan Profesional",
      icon: "🧠",
      price: "$129",
      period: "USD / mes",
      description: "Para clínicas, restaurantes o negocios que necesitan automatizar todo.",
      features: [
        "WhatsApp AI Agent",
        "Web Widget AI incluido",
        "Reagendamiento inteligente",
        "Recordatorios automatizados",
        "Formularios personalizados",
        "Soporte prioritario"
      ],
      gradient: "from-orange-500 to-yellow-500",
      bgGradient: "from-orange-50 to-yellow-50",
      borderColor: "border-orange-200",
      popular: false
    },
    {
      name: "Plan Premium",
      icon: "🚀",
      price: "$249",
      period: "USD / mes",
      description: "Para marcas que quieren diferenciarse y dar una experiencia wow.",
      features: [
        "Todo lo del Plan Profesional",
        "Video AI Agent personalizado (1 idioma)",
        "Integración con CRM o agenda externa",
        "Análisis de conversaciones + mejoras de flujo",
        "Video mensajes proactivos (seguimiento a leads)",
        "Instagram DM Automation"
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
              Plan Perfecto
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Desde pequeños negocios hasta empresas grandes, Chayo se adapta a tus necesidades con planes flexibles.
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
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg">
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
                    onClick={handleSolicitaDemo}
                    className={`w-full py-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r ${tier.gradient}`}
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
