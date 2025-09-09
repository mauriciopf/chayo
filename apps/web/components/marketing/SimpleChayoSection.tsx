'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { useTranslations } from 'next-intl'

export default function SimpleChayoSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const t = useTranslations('marketing')

  const features = [
    { icon: "📅", title: "Appointments", desc: "Automated scheduling & reminders" },
    { icon: "💳", title: "Payments", desc: "Secure checkout & subscriptions" },
    { icon: "📄", title: "Documents", desc: "Upload, sign & share instantly" },
    { icon: "💬", title: "Support", desc: "AI-driven answers & FAQs" },
    { icon: "📊", title: "Analytics", desc: "Clear business insights" }
  ]

  return (
    <section 
      ref={ref}
      className="py-24 px-4"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="max-w-6xl mx-auto">
        
        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 
            className="text-4xl lg:text-5xl font-bold mb-6"
            style={{ color: 'var(--text-primary)' }}
          >
            Your ALL-Business App
          </h2>
          <p 
            className="text-xl lg:text-2xl max-w-4xl mx-auto leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            One seamless, chat-first workspace where service businesses run their entire operation. 
            No more juggling multiple tools—everything your business needs, unified.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
              className="text-center p-6 rounded-2xl border"
              style={{ 
                backgroundColor: 'var(--marketing-card-bg)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 
                className="font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {feature.title}
              </h3>
              <p 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Message */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center"
        >
          <div 
            className="inline-block px-8 py-4 rounded-2xl border"
            style={{ 
              backgroundColor: 'var(--marketing-card-bg)',
              borderColor: 'var(--marketing-accent-primary)'
            }}
          >
            <p 
              className="text-lg font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              One place where owners, teams, and customers meet—as simple as chat.
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
