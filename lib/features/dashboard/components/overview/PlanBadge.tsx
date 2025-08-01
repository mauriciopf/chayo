'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

interface PlanBadgeProps {
  plan: string
}

export default function PlanBadge({ plan }: PlanBadgeProps) {
  const t = useTranslations('planBadge')
  
  const getPlanConfig = (planName: string) => {
    const configs = {
      free: {
        label: t('free'),
        color: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800',
        icon: '🆓'
      },
      basic: {
        label: t('basic'),
        color: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800',
        icon: '⭐'
      },
      pro: {
        label: t('pro'),
        color: 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800',
        icon: '🚀'
      },
      premium: {
        label: t('premium'),
        color: 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800',
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
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${config.color}`}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </motion.div>
  )
}
