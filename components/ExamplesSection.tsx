"use client"

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { useTranslations } from 'next-intl';

export default function ExamplesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [selectedExample, setSelectedExample] = useState(0);
  const t = useTranslations('examples');

  const examples = [
    {
      title: "Taco Truck 'El Corazón'",
      business: "Food Truck",
      description: "Chayo maneja pedidos por WhatsApp, coordina ubicaciones y aumentó ventas 300% en 2 meses",
      beforeAfter: {
        before: "📱 Perdían 40% de llamadas\n⏰ Solo abierto 8 horas\n😰 Dueño siempre estresado",
        after: "🎯 0% llamadas perdidas\n🌙 Toma pedidos 24/7\n😎 Dueño enfocado en cocinar"
      },
      metrics: {
        orders: "+300%",
        satisfaction: "4.9/5",
        savings: "20hrs/semana"
      },
      conversation: [
        { type: "customer", message: "Hola! Están abiertos?" },
        { type: "chayo", message: "¡Órale! Claro que sí, compadre 🌮 Estamos en la 5ta y Broadway hasta las 9pm. ¿Qué se te antoja del menú?" },
        { type: "customer", message: "Quiero 3 tacos de asada y 2 de pastor" },
        { type: "chayo", message: "¡Perfecto! Son $25 total. Tu orden estará lista en 12 minutos. ¿Pagas efectivo o tarjeta? 💳" }
      ],
      gradient: "from-orange-400 to-red-400",
      emoji: "🌮"
    },
    {
      title: "Salón 'Bella Vista'", 
      business: "Beauty Salon",
      description: "Chayo programa citas, envía recordatorios y maneja cancelaciones sin que la dueña levante un dedo",
      beforeAfter: {
        before: "📞 Contestaba durante servicios\n📅 Doble citas por error\n💸 30% cancelaciones last-minute",
        after: "💅 Se enfoca en sus clientes\n📱 Citas perfectamente organizadas\n⭐ Solo 5% cancelaciones"
      },
      metrics: {
        bookings: "+150%",
        efficiency: "95%",
        revenue: "+$3,200/mes"
      },
      conversation: [
        { type: "customer", message: "Necesito cita para uñas gel mañana" },
        { type: "chayo", message: "¡Claro, mi amor! 💅 Tengo disponible a las 2pm o 4pm mañana. ¿Cuál te conviene?" },
        { type: "customer", message: "Las 2pm está perfecto" },
        { type: "chayo", message: "¡Listo! Cita confirmada para mañana 2pm con María. Te mando recordatorio 2 horas antes. ¿Tu número es el 555-1234?" }
      ],
      gradient: "from-pink-400 to-purple-400",
      emoji: "💅"
    },
    {
      title: "Constructora 'Hernández'",
      business: "Construction",
      description: "Chayo califica leads, agenda visitas y explica servicios mientras el equipo está en obra",
      beforeAfter: {
        before: "📞 Perdían calls en horario laboral\n🤔 Leads fríos sin seguimiento\n📋 Cotizaciones tardías",
        after: "📱 Atiende 24/7 desde obra\n🔥 Leads calientes automáticos\n⚡ Cotizaciones en minutos"
      },
      metrics: {
        leads: "+400%",
        conversion: "65%",
        projects: "+12/mes"
      },
      conversation: [
        { type: "customer", message: "Necesito cotización para remodelar cocina" },
        { type: "chayo", message: "¡Qué padre! 🔨 Te ayudo con eso. ¿Cuántos metros tiene tu cocina aproximadamente?" },
        { type: "customer", message: "Como 15 metros cuadrados" },
        { type: "chayo", message: "Perfecto. Para darte una cotización exacta, ¿cuándo podemos visitarte? Tengo disponible este viernes 10am o sábado 2pm 📅" }
      ],
      gradient: "from-blue-400 to-cyan-400",
      emoji: "🔨"
    }
  ];

  return (
    <div ref={ref} className="py-20 bg-gradient-to-br from-gray-50 to-slate-100 text-gray-900">
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
            <span className="text-sm font-medium text-purple-700">{t('sectionTitle')}</span>
          </motion.div>

          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            {t('subheader')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('subheader')}
          </p>
        </motion.div>

        {/* Example Selector */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <div className="flex space-x-4 bg-white p-2 rounded-2xl shadow-lg border border-gray-200">
            {examples.map((example, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedExample(index)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  selectedExample === index 
                    ? `bg-gradient-to-r ${example.gradient} text-white shadow-lg` 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{example.emoji}</span>
                {example.business}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Selected Example */}
        <motion.div
          key={selectedExample}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="grid lg:grid-cols-2 gap-12 items-start"
        >
          
          {/* Left Side - Business Info */}
          <div className="space-y-8">
            
            {/* Business Header */}
            <div className={`bg-gradient-to-r ${examples[selectedExample].gradient} p-8 rounded-3xl`}>
              <div className="flex items-center mb-4">
                <span className="text-4xl mr-4">{examples[selectedExample].emoji}</span>
                <div>
                  <h3 className="text-2xl font-bold">{examples[selectedExample].title}</h3>
                  <p className="text-white/80">{examples[selectedExample].business}</p>
                </div>
              </div>
              <p className="text-white/90 text-lg leading-relaxed">
                {examples[selectedExample].description}
              </p>
            </div>

            {/* Before/After */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-red-50 border border-red-200 p-6 rounded-2xl">
                <h4 className="text-red-600 font-bold mb-3 flex items-center">
                  <span className="mr-2">😰</span> ANTES
                </h4>
                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {examples[selectedExample].beforeAfter.before}
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 p-6 rounded-2xl">
                <h4 className="text-green-600 font-bold mb-3 flex items-center">
                  <span className="mr-2">🚀</span> DESPUÉS
                </h4>
                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {examples[selectedExample].beforeAfter.after}
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(examples[selectedExample].metrics).map(([key, value], index) => (
                <div key={index} className="bg-gray-100 border border-gray-200 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-purple-600">{value}</div>
                  <div className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                </div>
              ))}
            </div>

          </div>

          {/* Right Side - Conversation */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg">
            <h4 className="text-xl font-bold mb-6 flex items-center text-gray-900">
              <span className="mr-3">💬</span>
              Conversación Real con Chayo
            </h4>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {examples[selectedExample].conversation.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.3 }}
                  className={`flex ${msg.type === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs px-4 py-3 rounded-2xl ${
                    msg.type === 'customer' 
                      ? 'bg-blue-600 text-white' 
                      : `bg-gradient-to-r ${examples[selectedExample].gradient} text-white`
                  }`}>
                    <div className="text-sm font-medium mb-1">
                      {msg.type === 'customer' ? 'Cliente' : 'Chayo'}
                    </div>
                    <div className="text-sm">{msg.message}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Typing Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="flex justify-start mt-4"
            >
              <div className={`bg-gradient-to-r ${examples[selectedExample].gradient} px-4 py-3 rounded-2xl`}>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </motion.div>
          </div>

        </motion.div>

      </div>
    </div>
  );
}
