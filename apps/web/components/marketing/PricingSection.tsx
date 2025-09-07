"use client"

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';

interface PricingSectionProps {
  onStartCall?: () => void;
}

export default function PricingSection({ onStartCall }: PricingSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const router = useRouter();
  const t = useTranslations('pricing');
  const locale = useLocale();

  const handleSolicitaDemo = () => {
    router.push(`/${locale}/dashboard`);
  };

  const pricingTiers = [
    {
      name: t('plans.basic.name'),
      icon: "💬",
      price: t('plans.basic.price'),
      period: t('plans.basic.period'),
      description: t('plans.basic.description'),
      features: t.raw('plans.basic.features'),
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      borderColor: "border-purple-200",
      popular: true
    },
    {
      name: t('plans.professional.name'),
      icon: "🧠",
      price: t('plans.professional.price'),
      period: t('plans.professional.period'),
      description: t('plans.professional.description'),
      features: t.raw('plans.professional.features'),
      gradient: "from-orange-500 to-yellow-500",
      bgGradient: "from-orange-50 to-yellow-50",
      borderColor: "border-orange-200",
      popular: false
    },
    {
      name: t('plans.premium.name'),
      icon: "🚀",
      price: t('plans.premium.price'),
      period: "USD / mes",
      description: t('plans.premium.description'),
      features: t.raw('plans.premium.features'),
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-50 to-teal-50",
      borderColor: "border-emerald-200",
      popular: false
    }
  ];

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
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            className="inline-flex items-center gap-2 border rounded-full px-6 py-2 mb-6"
            style={{ 
              backgroundColor: 'var(--marketing-card-bg)',
              borderColor: 'var(--marketing-accent-primary)'
            }}
          >
            <span 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--marketing-accent-primary)' }}
            ></span>
            <span 
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >{t('sectionTitle')}</span>
          </motion.div>

          <h2 
            className="text-4xl lg:text-5xl font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('subheader')}
          </h2>
          <p 
            className="text-xl max-w-3xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('subheader')}
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
                  <div 
                    className="text-sm font-bold px-4 py-1 rounded-full shadow-lg"
                    style={{ 
                      background: 'var(--marketing-gradient-button)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {t('plans.professional.popular')}
                  </div>
                </motion.div>
              )}

              {/* Card */}
              <div 
                className="relative h-full rounded-3xl border-2 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105"
                style={{ 
                  backgroundColor: 'var(--marketing-card-bg)',
                  borderColor: tier.popular ? 'var(--marketing-accent-primary)' : 'var(--border-primary)'
                }}
              >
                
                {/* Background Gradient */}
                <div 
                  className="absolute inset-0 rounded-3xl opacity-10"
                  style={{ 
                    background: tier.popular ? 'var(--marketing-gradient-subtle)' : 'var(--marketing-gradient-card)'
                  }}
                ></div>
                
                <div className="relative z-10">
                  
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div 
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 text-2xl"
                      style={{ 
                        background: tier.popular ? 'var(--marketing-gradient-button)' : 'var(--marketing-gradient-card)'
                      }}
                    >
                      {tier.icon}
                    </div>
                    <h3 
                      className="text-2xl font-bold mb-2"
                      style={{ color: 'var(--text-primary)' }}
                    >{tier.name}</h3>
                    <p 
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >{tier.description}</p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-8">
                    <div className="flex items-baseline justify-center">
                      <span 
                        className="text-5xl font-bold"
                        style={{ color: 'var(--text-primary)' }}
                      >{tier.price}</span>
                      <span 
                        className="ml-2"
                        style={{ color: 'var(--text-secondary)' }}
                      >{tier.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature: string, idx: number) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.6 + index * 0.1 + idx * 0.05 }}
                        className="flex items-start space-x-3"
                      >
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0"
                          style={{ 
                            background: tier.popular ? 'var(--marketing-gradient-button)' : 'var(--marketing-gradient-card)'
                          }}
                        >
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span 
                          className="text-sm leading-tight"
                          style={{ color: 'var(--text-secondary)' }}
                        >{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSolicitaDemo}
                    className="w-full py-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    style={{ 
                      background: 'var(--marketing-gradient-button)'
                    }}
                  >
                    🔵 {tier.name === t('plans.basic.name') ? t('plans.basic.cta') : tier.name === t('plans.professional.name') ? t('plans.professional.cta') : t('plans.premium.cta')}
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
