'use client'

import { motion } from 'framer-motion'

export default function BetaBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="py-2 md:py-3 px-4 text-center text-xs md:text-sm font-medium shadow-lg"
      style={{ 
        background: 'var(--marketing-gradient-subtle)',
        color: 'var(--text-primary)'
      }}
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 max-w-7xl mx-auto">
        <span 
          className="px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ backgroundColor: 'var(--marketing-accent-primary)', color: 'var(--text-primary)' }}
        >
          BETA
        </span>
        <span className="leading-tight">
          Chayo is currently in Beta — enjoy free access until December 31st, 2025! 🎉
        </span>
      </div>
    </motion.div>
  )
}