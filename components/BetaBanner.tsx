'use client'

import { motion } from 'framer-motion'

export default function BetaBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white py-2 md:py-3 px-4 text-center text-xs md:text-sm font-medium shadow-lg"
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 max-w-7xl mx-auto">
        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
          BETA
        </span>
        <span className="leading-tight">
          Chayo is currently in Beta — enjoy free access until December 31st, 2025! 🎉
        </span>
      </div>
    </motion.div>
  )
}