'use client'

import { useState, useEffect } from 'react'
import { WeeklySummary } from '../services/SimpleClientInsightsService'

export function useClientInsights(organizationId?: string) {
  const [summary, setSummary] = useState<WeeklySummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = async () => {
    if (!organizationId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/client-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch insights')
      }

      const data = await response.json()
      setSummary(data.summary)
    } catch (err) {
      console.error('Failed to fetch client insights:', err)
      setError('Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (organizationId) {
      fetchSummary()
    }
  }, [organizationId])

  const refreshSummary = () => {
    fetchSummary()
  }

  return {
    summary,
    loading,
    error,
    refreshSummary
  }
}