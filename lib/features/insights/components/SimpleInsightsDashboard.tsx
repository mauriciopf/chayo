'use client'

import { useTranslations } from 'next-intl'
import { useClientInsights } from '../hooks/useClientInsights'

interface SimpleInsightsDashboardProps {
  organizationId?: string
}

export default function SimpleInsightsDashboard({ organizationId }: SimpleInsightsDashboardProps) {
  const t = useTranslations('insights')
  const { summary, loading, error } = useClientInsights(organizationId)

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="w-full max-w-6xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: What customers want most */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Top Customer Request
          </h3>
          {summary?.topRequest ? (
            <>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {summary.topRequest.percentage}%
              </div>
              <p className="text-gray-600">
                of customers are asking about{' '}
                <strong className="text-gray-900">
                  {getIntentDisplayName(summary.topRequest.intent)}
                </strong>
              </p>
            </>
          ) : (
            <div className="text-gray-500">
              <div className="text-2xl font-bold mb-1">—</div>
              <p>No customer data yet</p>
            </div>
          )}
        </div>

        {/* Card 2: Simple recommendation */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Recommendation
          </h3>
          <div className="text-sm text-gray-700">
            {getSimpleRecommendation(summary?.topRequest)}
          </div>
        </div>

        {/* Card 3: Quick stats */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            This Week
          </h3>
          <div className="text-3xl font-bold text-green-600 mb-1">
            {summary?.totalConversations || 0}
          </div>
          <p className="text-gray-600">customer conversations</p>
        </div>
        
      </div>

      {/* Detailed breakdown if there are multiple request types */}
      {summary?.allRequests && summary.allRequests.length > 1 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Customer Request Breakdown
          </h3>
          <div className="space-y-3">
            {summary.allRequests.map((request, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-700 capitalize">
                    {getIntentDisplayName(request.intent)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{request.count} requests</span>
                  <span className="text-sm font-medium text-gray-900">
                    {request.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

function getIntentDisplayName(intent: string): string {
  const displayNames: Record<string, string> = {
    'booking': 'appointment booking',
    'pricing': 'pricing information',
    'support': 'support & help',
    'complaint': 'complaints & issues',
    'other': 'other inquiries'
  }
  
  return displayNames[intent] || intent
}

function getSimpleRecommendation(topRequest?: { intent: string; percentage: number } | null): string {
  if (!topRequest) {
    return 'Start getting customer conversations to see personalized recommendations based on what your customers are actually asking for.'
  }

  const recommendations: Record<string, string> = {
    'booking': 'Consider adding an online booking system or making your booking process more prominent on your website.',
    'pricing': 'Make your pricing more visible on your website or create a dedicated pricing page to reduce customer inquiries.',
    'support': 'Consider adding an FAQ section or help documentation for common support questions.',
    'complaint': 'Review recent service issues and follow up with unhappy customers to improve satisfaction.',
    'other': 'Analyze these conversations for new service opportunities or common patterns.'
  }
  
  const baseRecommendation = recommendations[topRequest.intent] || 'Monitor customer conversations for patterns and opportunities.'
  
  if (topRequest.percentage > 50) {
    return `🔥 High priority: ${baseRecommendation} (${topRequest.percentage}% of customers need this)`
  }
  
  return baseRecommendation
}