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
    { icon: "📂", text: "Dragging PDF documents" },
    { icon: "🌐", text: "Pasting website links" },
    { icon: "📝", text: "Adding business details" }
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
    <div ref={ref} className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
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
                  className={`border-2 border-dashed rounded-lg p-6 transition-all duration-500 ${
                    currentStep === index 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-3">{step.icon}</div>
                    <p className="text-lg text-gray-700 font-medium">{step.text}</p>
                    {currentStep === index && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-3"
                      >
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2.5 }}
                            className="bg-blue-500 h-2 rounded-full"
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
            <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
              
              {/* User Message */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.8 }}
                className="flex justify-end"
              >
                <div className="bg-blue-500 text-white rounded-lg px-4 py-3 max-w-xs">
                  Here's my website and service guide.
                </div>
              </motion.div>

              {/* Chayo Response */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.5 }}
                className="flex justify-start"
              >
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg px-4 py-3 max-w-xs border border-blue-200">
                  Got it! I'm already learning. 🧠 I'll talk like I've been on your team for years.
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
              <h3 className="text-2xl font-bold text-gray-900">What Chayo learns:</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: "📋", text: "Your services & pricing" },
                  { icon: "🎯", text: "Your brand voice & style" },
                  { icon: "❓", text: "Common customer questions" },
                  { icon: "📞", text: "Your booking process" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 2.2 + index * 0.1 }}
                    className="flex items-center space-x-3 bg-white rounded-lg p-3 shadow-sm border"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium text-gray-700">{item.text}</span>
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
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                <span>⚡</span>
                <span>Powered by ChatGPT</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Learns your brand instantly</p>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
