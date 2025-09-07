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
    <div 
      ref={ref} 
      className="py-20"
      style={{ background: 'var(--marketing-hero-bg)' }}
    >
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 
            className="text-4xl lg:text-5xl font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('title')}
          </h2>
          <p 
            className="text-xl max-w-3xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
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
            <div 
              className="rounded-2xl shadow-xl p-6 space-y-4"
              style={{ backgroundColor: 'var(--marketing-card-bg)' }}
            >
              
              {/* User Message */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 }}
                className="flex justify-end"
              >
                <div 
                  className="text-white rounded-lg px-4 py-3 max-w-xs"
                  style={{ backgroundColor: 'var(--marketing-accent-primary)' }}
                >
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
                <div 
                  className="rounded-lg px-4 py-3 max-w-xs border"
                  style={{ 
                    background: 'var(--marketing-gradient-card)',
                    borderColor: 'var(--marketing-accent-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
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
                <div 
                  className="rounded-lg px-4 py-3 max-w-xs border"
                  style={{ 
                    background: 'var(--marketing-gradient-card)',
                    borderColor: 'var(--marketing-accent-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
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
              <p 
                className="text-lg italic"
                style={{ color: 'var(--text-secondary)' }}
              >
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
            <div 
              className="rounded-2xl shadow-xl p-8"
              style={{ backgroundColor: 'var(--marketing-card-bg)' }}
            >
              
              <h3 
                className="text-2xl font-bold mb-6"
                style={{ color: 'var(--text-primary)' }}
              >Health Assistant Setup</h3>
              
              {/* Name Field */}
              <div className="mb-6">
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Health Assistant Name
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value="Chayo" 
                    readOnly
                    className="w-full px-4 py-3 border-2 rounded-lg font-medium"
                    style={{ 
                      borderColor: 'var(--border-primary)',
                      backgroundColor: 'var(--marketing-card-bg)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <span className="absolute right-3 top-3 text-green-500">✨</span>
                </div>
              </div>

              {/* Tone Selection */}
              <div className="mb-6">
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Personality & Tone
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    className="border-2 rounded-lg p-3 text-center"
                    style={{ 
                      borderColor: 'var(--marketing-accent-primary)',
                      backgroundColor: 'var(--marketing-card-bg)'
                    }}
                  >
                    <span 
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >Friendly & Professional</span>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3 text-center">
                    <span 
                      className="text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >Casual & Fun</span>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3 text-center">
                    <span 
                      className="text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >Formal & Expert</span>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3 text-center">
                    <span 
                      className="text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >Custom Tone</span>
                  </div>
                </div>
              </div>

              {/* Goals Checklist */}
              <div className="mb-6">
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
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
                      <div 
                        className="w-5 h-5 rounded border-2 flex items-center justify-center"
                        style={{
                          backgroundColor: goal.checked ? 'var(--marketing-accent-primary)' : 'transparent',
                          borderColor: goal.checked ? 'var(--marketing-accent-primary)' : 'var(--border-primary)'
                        }}
                      >
                        {goal.checked && <span 
                          className="text-xs"
                          style={{ color: 'var(--text-primary)' }}
                        >✓</span>}
                      </div>
                      <span 
                        className="text-sm"
                        style={{ 
                          color: goal.checked ? 'var(--text-primary)' : 'var(--text-secondary)' 
                        }}
                      >
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
