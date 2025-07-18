"use client"

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslations } from 'next-intl';

export default function VibeSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const t = useTranslations('vibe');

  return (
    <div ref={ref} className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Chat Animation */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            
            {/* Chat Conversation */}
            <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
              
              {/* User Message */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 }}
                className="flex justify-end"
              >
                <div className="bg-blue-500 text-white rounded-lg px-4 py-3 max-w-xs">
                  Chayo, can you help me with my health and book appointments?
                </div>
              </motion.div>

              {/* Chayo Response */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1 }}
                className="flex justify-start"
              >
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg px-4 py-3 max-w-xs border border-green-200">
                  Absolutely! Name me, pick my tone, and tell me what you need. 🏥
                </div>
              </motion.div>

              {/* Second Chayo Message */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.5 }}
                className="flex justify-start"
              >
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg px-4 py-3 max-w-xs border border-green-200">
                  I'll become your digital health companion — caring, supportive, and never tired.
                </div>
              </motion.div>

            </div>

            {/* Quote */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 2 }}
              className="text-center"
            >
              <p className="text-lg text-gray-600 italic">
                "She learns your health needs instantly and supports you like she's been your wellness partner for years."
              </p>
            </motion.div>

          </motion.div>

          {/* Right Side - Configuration UI Mockup */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-6"
          >
            
            {/* Config Panel */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Health Assistant Setup</h3>
              
              {/* Name Field */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Health Assistant Name
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value="Chayo" 
                    readOnly
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-lg bg-green-50 text-gray-900 font-medium"
                  />
                  <span className="absolute right-3 top-3 text-green-500">✨</span>
                </div>
              </div>

              {/* Tone Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personality & Tone
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border-2 border-green-500 bg-green-50 rounded-lg p-3 text-center">
                    <span className="text-sm font-medium text-green-700">Friendly & Professional</span>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3 text-center">
                    <span className="text-sm text-gray-500">Casual & Fun</span>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3 text-center">
                    <span className="text-sm text-gray-500">Formal & Expert</span>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3 text-center">
                    <span className="text-sm text-gray-500">Custom Tone</span>
                  </div>
                </div>
              </div>

              {/* Goals Checklist */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What should Chayo help you with?
                </label>
                <div className="space-y-3">
                  {[
                    { text: "Book appointments & consultations", checked: true },
                    { text: "Answer health questions", checked: true },
                    { text: "Monitor wellness goals", checked: true },
                    { text: "Provide health reminders", checked: false }
                  ].map((goal, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        goal.checked ? 'bg-green-500 border-green-500' : 'border-gray-300'
                      }`}>
                        {goal.checked && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className={`text-sm ${goal.checked ? 'text-gray-900' : 'text-gray-500'}`}>
                        {goal.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deploy Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Deploy Chayo 🏥
              </motion.button>

            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
