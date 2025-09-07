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
    router.push(`/${locale}/dashboard`);
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
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-20"
      style={{ background: 'var(--marketing-hero-bg)' }}
    >
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
              <div 
                className="w-full h-full rounded-[2.5rem] overflow-hidden"
                style={{ backgroundColor: 'var(--bg-primary)' }}
              >
                
                {/* Phone Header */}
                <div 
                  className="p-4 flex items-center"
                  style={{ 
                    background: 'var(--marketing-gradient-card)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: 'var(--marketing-card-alt)' }}
                  >
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div>
                    <h3 className="font-bold">Chayo AI</h3>
                    <p className="text-xs opacity-90">Tu asistente de salud</p>
                  </div>
                  <div className="ml-auto w-3 h-3 bg-green-400 rounded-full"></div>
                </div>

                {/* Chat Area */}
                <div 
                  className="p-4 space-y-4 h-full overflow-y-auto"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  
                  {/* User Message */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-end"
                  >
                    <div 
                      className="rounded-lg px-4 py-2 max-w-xs"
                      style={{ 
                        backgroundColor: 'var(--marketing-accent-primary)',
                        color: 'var(--text-primary)'
                      }}
                    >
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
                    <div 
                      className="border rounded-lg px-4 py-2 max-w-xs shadow-sm"
                      style={{ 
                        backgroundColor: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                    >
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
                    <div 
                      className="border rounded-lg px-4 py-2 shadow-sm"
                      style={{ 
                        backgroundColor: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-primary)'
                      }}
                    >
                      <div className="flex space-x-1">
                        <div 
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{ backgroundColor: 'var(--text-muted)' }}
                        ></div>
                        <div 
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{ backgroundColor: 'var(--text-muted)', animationDelay: '0.1s' }}
                        ></div>
                        <div 
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{ backgroundColor: 'var(--text-muted)', animationDelay: '0.2s' }}
                        ></div>
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
              className="text-5xl lg:text-6xl font-bold leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {t('headline')}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-xl leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
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
              className="px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              style={{ 
                background: 'var(--marketing-gradient-button)',
                color: 'var(--text-primary)'
              }}
            >
              🔵 {t('ctaPrimary')}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartWithChayo}
              className="border-2 px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300"
              style={{ 
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--marketing-accent-primary)'
                e.currentTarget.style.color = 'var(--marketing-accent-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-primary)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
            >
              ⚪️ {t('ctaSecondary')}
            </motion.button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="flex items-center space-x-6 text-sm"
            style={{ color: 'var(--text-muted)' }}
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
