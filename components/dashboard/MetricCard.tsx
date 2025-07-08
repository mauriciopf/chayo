'use client'

import { motion } from 'framer-motion'

interface MetricCardProps {
  title: string
  value: string | number
  icon: string
  color: string
  change?: number
  trend?: 'up' | 'down' | 'stable'
  delay?: number
}

export default function MetricCard({ 
  title, 
  value, 
  icon, 
  color, 
  change, 
  trend, 
  delay = 0 
}: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        )
      case 'down':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
          </svg>
        )
      case 'stable':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        )
      default:
        return null
    }
  }

  const getChangeColor = () => {
    if (!change) return ''
    return change > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white text-lg`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${getChangeColor()}`}>
            {getTrendIcon()}
            <span>{change > 0 ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
      </div>
      
      <div className="text-sm text-gray-600">{title}</div>
    </motion.div>
  )
}
