'use client'

import { motion } from 'framer-motion'

interface PlanBadgeProps {
  plan: string
}

export default function PlanBadge({ plan }: PlanBadgeProps) {
  const getPlanConfig = (planName: string) => {
    const configs = {
      free: {
        label: 'Free',
        color: 'bg-gray-100 text-gray-800',
        icon: '🆓'
      },
      basic: {
        label: 'Basic',
        color: 'bg-blue-100 text-blue-800',
        icon: '⭐'
      },
      pro: {
        label: 'Pro',
        color: 'bg-purple-100 text-purple-800',
        icon: '🚀'
      },
      premium: {
        label: 'Premium',
        color: 'bg-orange-100 text-orange-800',
        icon: '👑'
      }
    }
    
    return configs[planName as keyof typeof configs] || configs.free
  }

  const config = getPlanConfig(plan)

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </motion.div>
  )
}
