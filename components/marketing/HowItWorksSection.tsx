"use client"

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';

export default function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const router = useRouter();
  const t = useTranslations('howItWorks');
  const locale = useLocale();

  const handleCTAClick = () => {
    router.push(`/${locale}/auth`);
  };

  const steps = [
    {
      number: "01",
      title: t('steps.step1.title'),
      description: t('steps.step1.description'),
      icon: "🎭",
      details: t.raw('steps.step1.details'),
      gradient: "from-purple-500 to-pink-500",
      color: "purple"
    },
    {
      number: "02", 
      title: t('steps.step2.title'),
      description: t('steps.step2.description'),
      icon: "🧠",
      details: t.raw('steps.step2.details'),
      gradient: "from-blue-500 to-cyan-500",
      color: "blue"
    },
    {
      number: "03",
      title: t('steps.step3.title'),
      description: t('steps.step3.description'),
      icon: "🔗",
      details: t.raw('steps.step3.details'),
      gradient: "from-green-500 to-emerald-500",
      color: "green"
    },
    {
      number: "04",
      title: t('steps.step4.title'),
      description: t('steps.step4.description'),
      icon: "🚀",
      details: t.raw('steps.step4.details'),
      gradient: "from-orange-500 to-red-500", 
      color: "orange"
    }
  ];

  return (
    <div ref={ref} className="py-20 bg-gradient-to-br from-white to-gray-50">
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
            {t('heroTitle')}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              {t('heroHighlight')}
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('subHeader')}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-20">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}
            >
              
              {/* Content */}
              <div className={`space-y-6 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                
                {/* Step Number */}
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${step.gradient} rounded-full flex items-center justify-center text-white font-bold text-xl`}>
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">{step.title}</h3>
                    <p className="text-gray-600 text-lg">{step.description}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  {step.details.map((detail: string, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.5 + index * 0.2 + idx * 0.1 }}
                      className="flex items-center space-x-3"
                    >
                      <div className={`w-6 h-6 bg-gradient-to-r ${step.gradient} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-700">{detail}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Button for this step */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCTAClick}
                  className={`bg-gradient-to-r ${step.gradient} text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300`}
                >
                  {t('cta')}
                </motion.button>

              </div>

              {/* Visual */}
              <div className={`relative ${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.8, delay: index * 0.2 + 0.3 }}
                  className={`relative bg-gradient-to-br ${step.gradient} p-8 rounded-3xl shadow-2xl`}
                >
                  
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-4 right-4 w-20 h-20 border-2 border-white rounded-full"></div>
                    <div className="absolute bottom-4 left-4 w-16 h-16 border-2 border-white rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white rounded-full"></div>
                  </div>

                  {/* Icon */}
                  <div className="relative text-center text-white">
                    <div className="text-8xl mb-4">{step.icon}</div>
                    <h4 className="text-2xl font-bold mb-2">Paso {step.number}</h4>
                    <p className="text-white/90">{step.title}</p>
                  </div>

                  {/* Floating Elements */}
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 5, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute -top-4 -right-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                  >
                    <span className="text-white text-xl">✨</span>
                  </motion.div>

                  <motion.div
                    animate={{ 
                      y: [0, 10, 0],
                      rotate: [0, -5, 0]
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1
                    }}
                    className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                  >
                    <span className="text-white text-2xl">⚡</span>
                  </motion.div>

                </motion.div>
              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
