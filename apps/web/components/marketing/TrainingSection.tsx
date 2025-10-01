"use client"

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useTranslations } from 'next-intl';

export default function TrainingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [currentStep, setCurrentStep] = useState(0);
  const t = useTranslations('training');

  const trainingSteps = [
    { icon: "📂", text: "Arrastrando documentos de negocio" },
    { icon: "🌐", text: "Pegando enlaces del sitio web de negocio" },
    { icon: "📝", text: "Agregando preferencias de negocio" }
  ];

  useEffect(() => {
    if (isInView) {
      const timer = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % trainingSteps.length);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [isInView]);

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
          
          {/* Left Side - Training Visual */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            
            {/* Upload Areas */}
            <div className="space-y-4">
              {trainingSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5 + index * 0.3 }}
                  className="border-2 border-dashed rounded-lg p-6 transition-all duration-500"
                  style={{
                    borderColor: currentStep === index 
                      ? 'var(--marketing-accent-primary)' 
                      : 'var(--border-primary)',
                    backgroundColor: currentStep === index 
                      ? 'var(--marketing-card-hover)' 
                      : 'var(--marketing-card-bg)'
                  }}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-3">{step.icon}</div>
                    <p 
                      className="text-lg font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >{step.text}</p>
                    {currentStep === index && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-3"
                      >
                        <div 
                          className="w-full rounded-full h-2"
                          style={{ backgroundColor: 'var(--border-primary)' }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2.5 }}
                            className="h-2 rounded-full"
                            style={{ backgroundColor: 'var(--marketing-accent-primary)' }}
                          ></motion.div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

          </motion.div>

          {/* Right Side - Chat Example */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
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
                transition={{ delay: 0.8 }}
                className="flex justify-end"
              >
                <div 
                  className="rounded-lg px-4 py-3 max-w-xs"
                  style={{ 
                    backgroundColor: 'var(--marketing-accent-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  Aquí está la información y preferencias de mi negocio.
                </div>
              </motion.div>

              {/* Chayo Response */}
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
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  ¡Entendido! Ya estoy aprendiendo. 🧠 Te apoyaré como si hubiera sido tu socia de negocios por años.
                </div>
              </motion.div>

            </div>

            {/* Features List */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 2 }}
              className="space-y-4"
            >
              <h3 
                className="text-2xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >Lo que Chayo aprende:</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: "📋", text: "Tu historial y preferencias de negocio" },
                  { icon: "🎯", text: "Tus objetivos y estilo de negocio" },
                  { icon: "❓", text: "Preguntas comunes de negocio" },
                  { icon: "📞", text: "Tus preferencias de citas" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 2.2 + index * 0.1 }}
                    className="flex items-center space-x-3 rounded-lg p-3 shadow-sm border"
                    style={{ 
                      backgroundColor: 'var(--marketing-card-bg)',
                      borderColor: 'var(--border-primary)'
                    }}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span 
                      className="font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Powered by badge */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 2.5 }}
              className="text-center"
            >
              <div 
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium"
                style={{ 
                  background: 'var(--marketing-gradient-button)',
                  color: 'var(--text-primary)'
                }}
              >
                <span>⚡</span>
                <span>Impulsado por ChatGPT</span>
              </div>
              <p 
                className="text-sm mt-2"
                style={{ color: 'var(--text-secondary)' }}
              >Aprende las necesidades de tu negocio instantáneamente</p>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
