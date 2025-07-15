'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import MetricCard from './MetricCard'

interface PerformanceOverviewProps {
  className?: string
}

export default function PerformanceOverview({ className = '' }: PerformanceOverviewProps) {
  const t = useTranslations('performanceOverview')
  const [selectedPeriod, setSelectedPeriod] = useState('current_month')
  const [comparison, setComparison] = useState('no_comparison')

  const periods = [
    { value: 'current_month', label: t('periods.current_month') },
    { value: 'last_month', label: t('periods.last_month') },
    { value: 'last_3_months', label: t('periods.last_3_months') },
    { value: 'last_6_months', label: t('periods.last_6_months') },
    { value: 'current_year', label: t('periods.current_year') }
  ]

  const comparisonOptions = [
    { value: 'no_comparison', label: t('comparison.no_comparison') },
    { value: 'previous_period', label: t('comparison.previous_period') },
    { value: 'previous_year', label: t('comparison.previous_year') }
  ]

  // Mock data - in production, this would come from your analytics API
  const metrics = [
    {
      title: t('metrics.totalConversations'),
      value: '0',
      icon: '💬',
      color: 'bg-blue-500',
      change: undefined,
      trend: undefined
    },
    {
      title: t('metrics.totalMessages'),
      value: '0',
      icon: '📨',
      color: 'bg-green-500',
      change: undefined,
      trend: undefined
    },
    {
      title: t('metrics.avgMessagesPerConversation'),
      value: '0',
      icon: '📊',
      color: 'bg-purple-500',
      change: undefined,
      trend: undefined
    },
    {
      title: t('metrics.leadsCaptured'),
      value: '0',
      icon: '🎯',
      color: 'bg-orange-500',
      change: undefined,
      trend: undefined
    },
    {
      title: t('metrics.appointmentsScheduled'),
      value: '0',
      icon: '📅',
      color: 'bg-pink-500',
      change: undefined,
      trend: undefined
    }
  ]

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t('title')}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {t('description')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Period Selector */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>

            {/* Comparison Selector */}
            <select
              value={comparison}
              onChange={(e) => setComparison(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
            >
              {comparisonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {metrics.map((metric, index) => (
            <MetricCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              color={metric.color}
              change={metric.change}
              trend={metric.trend}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Conversation Trends Chart Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
          >
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">{t('conversationTrends')}</h4>
              <p className="text-sm text-gray-500 mb-3">{t('interactiveChartsComingSoon')}</p>
              <button className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full hover:bg-orange-200 transition-colors">
                {t('viewSampleChart')}
              </button>
            </div>
          </motion.div>

          {/* Engagement Metrics Chart Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
          >
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">{t('engagementMetrics')}</h4>
              <p className="text-sm text-gray-500 mb-3">{t('pieChartsComingSoon')}</p>
              <button className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors">
                {t('viewSampleChart')}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap gap-2"
        >
          <button className="px-4 py-2 text-sm bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{t('exportData')}</span>
          </button>
          
          <button className="px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{t('viewDetails')}</span>
          </button>
          
          <button className="px-4 py-2 text-sm bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a4 4 0 01-4-4V5a2 2 0 012-2h6l3 3h6a2 2 0 012 2v11a4 4 0 01-4 4z" />
            </svg>
            <span>{t('generateReport')}</span>
          </button>
          
          <button className="px-4 py-2 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{t('refreshData')}</span>
          </button>
        </motion.div>
      </div>
    </div>
  )
}
