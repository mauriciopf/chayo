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
      title: t('businesses.food_truck.title'),
      business: t('businesses.food_truck.name'),
      description: t('businesses.food_truck.description'),
      beforeAfter: {
        before: t('businesses.food_truck.beforeDetails'),
        after: t('businesses.food_truck.afterDetails')
      },
      metrics: {
        orders: t('businesses.food_truck.metrics.orders'),
        efficiency: t('businesses.food_truck.metrics.efficiency'),
        customers: t('businesses.food_truck.metrics.customers')
      },
      conversation: [
        { type: "customer", message: t('businesses.food_truck.conversations.0.user') },
        { type: "chayo", message: t('businesses.food_truck.conversations.0.chayo') },
        { type: "customer", message: t('businesses.food_truck.conversations.1.user') },
        { type: "chayo", message: t('businesses.food_truck.conversations.1.chayo') }
      ],
      gradient: "from-orange-400 to-red-400",
      emoji: "🌮"
    },
    {
      title: t('businesses.beauty_salon.title'),
      business: t('businesses.beauty_salon.name'),
      description: t('businesses.beauty_salon.description'),
      beforeAfter: {
        before: t('businesses.beauty_salon.beforeDetails'),
        after: t('businesses.beauty_salon.afterDetails')
      },
      metrics: {
        appointments: t('businesses.beauty_salon.metrics.appointments'),
        efficiency: t('businesses.beauty_salon.metrics.efficiency'),
        customers: t('businesses.beauty_salon.metrics.customers')
      },
      conversation: [
        { type: "customer", message: t('businesses.beauty_salon.conversations.0.user') },
        { type: "chayo", message: t('businesses.beauty_salon.conversations.0.chayo') },
        { type: "customer", message: t('businesses.beauty_salon.conversations.1.user') },
        { type: "chayo", message: t('businesses.beauty_salon.conversations.1.chayo') }
      ],
      gradient: "from-pink-400 to-purple-400",
      emoji: "💇"
    },
    {
      title: t('businesses.construction.title'),
      business: t('businesses.construction.name'),
      description: t('businesses.construction.description'),
      beforeAfter: {
        before: t('businesses.construction.beforeDetails'),
        after: t('businesses.construction.afterDetails')
      },
      metrics: {
        projects: t('businesses.construction.metrics.projects'),
        leads: t('businesses.construction.metrics.leads'),
        customers: t('businesses.construction.metrics.customers')
      },
      conversation: [
        { type: "customer", message: t('businesses.construction.conversations.0.user') },
        { type: "chayo", message: t('businesses.construction.conversations.0.chayo') },
        { type: "customer", message: t('businesses.construction.conversations.1.user') },
        { type: "chayo", message: t('businesses.construction.conversations.1.chayo') }
      ],
      gradient: "from-yellow-400 to-orange-400",
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
            See how Chayo transforms business support across different industries
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
