"use client"

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';

interface NewHeroProps {
  onStartCall?: () => void;
}

export default function NewHero({ onStartCall }: NewHeroProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const t = useTranslations('hero');
  const locale = useLocale();
  
  const chatSteps = [
    {
      user: t('conversationExample.userMessage'),
      chayo: t('conversationExample.chayoResponse')
    }
  ];

  const features = [
    t('conversationExample.features.sell'),
    t('conversationExample.features.book'), 
    t('conversationExample.features.faq'),
    t('conversationExample.features.support')
  ];

  const handleStartWithChayo = () => {
    router.push(`/${locale}/auth`);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < chatSteps.length) {
        setCurrentStep(currentStep + 1);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center px-4 py-20">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Side - Phone Mockup */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex justify-center lg:justify-end"
        >
          <div className="relative">
            {/* Phone Frame */}
            <div className="w-80 h-[640px] bg-black rounded-[3rem] p-2 shadow-2xl">
              <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                
                {/* Phone Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div>
                    <h3 className="font-bold">Chayo AI</h3>
                    <p className="text-xs opacity-90">Tu comadre digital</p>
                  </div>
                  <div className="ml-auto w-3 h-3 bg-green-400 rounded-full"></div>
                </div>

                {/* Chat Area */}
                <div className="p-4 space-y-4 h-full overflow-y-auto bg-gray-50">
                  
                  {/* User Message */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-end"
                  >
                    <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-xs">
                      {t('conversationExample.userMessage')}
                    </div>
                  </motion.div>

                  {/* Chayo Response */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white border rounded-lg px-4 py-2 max-w-xs shadow-sm">
                      {t('conversationExample.chayoResponse')}
                    </div>
                  </motion.div>

                  {/* Feature Checkboxes */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5 }}
                    className="bg-white rounded-lg p-4 space-y-2 shadow-sm"
                  >
                    {features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 3 + index * 0.2 }}
                        className="flex items-center text-sm text-gray-700"
                      >
                        {feature}
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Typing Indicator */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 4.5 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white border rounded-lg px-4 py-2 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </motion.div>

                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Content */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-8"
        >
          
          {/* Headline */}
          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
            >
              {t('headline')}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-xl text-gray-600 leading-relaxed"
            >
              {t('subheadline')}
            </motion.p>
          </div>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartWithChayo}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              🔵 {t('ctaPrimary')}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartWithChayo}
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full text-lg font-semibold hover:border-purple-600 hover:text-purple-600 transition-all duration-300"
            >
              ⚪️ {t('ctaSecondary')}
            </motion.button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="flex items-center space-x-6 text-sm text-gray-500"
          >
            <div className="flex items-center space-x-2">
              <span>⚡</span>
              <span>{t('trustBadge3')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>🤖</span>
              <span>{t('trustBadge2')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>🌎</span>
              <span>{t('trustBadge1')}</span>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
