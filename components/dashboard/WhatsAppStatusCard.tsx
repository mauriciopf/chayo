'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

interface WhatsAppStatusCardProps {
  agentId: string
  onSetup: () => void
}

interface WhatsAppStatus {
  isConnected: boolean
  phoneNumber?: string
  businessName?: string
  status?: string
  lastMessageAt?: string
  messageCount?: number
}

export default function WhatsAppStatusCard({ agentId, onSetup }: WhatsAppStatusCardProps) {
  const t = useTranslations('whatsAppStatusCard')
  const [status, setStatus] = useState<WhatsAppStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkWhatsAppStatus()
  }, [agentId])

  const checkWhatsAppStatus = async () => {
    try {
      const response = await fetch(`/api/whatsapp/status?agentId=${agentId}`)
      const data = await response.json()
      
      setStatus({
        isConnected: data.connected,
        phoneNumber: data.phoneNumber,
        businessName: data.businessName,
        status: data.status,
        lastMessageAt: data.lastMessageAt,
        messageCount: data.messageCount
      })
    } catch (error) {
      console.error('Failed to check WhatsApp status:', error)
      setStatus({ isConnected: false })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${
            status?.isConnected 
              ? 'bg-gradient-to-r from-gray-700 to-gray-900' 
              : 'bg-gradient-to-r from-gray-400 to-gray-500'
          }`}>
            <span className="text-white text-xl">📱</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t('title')}</h3>
            <p className="text-sm text-gray-600">
              {status?.isConnected ? t('connected') : t('notConnected')}
            </p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          status?.isConnected
            ? 'bg-gray-100 text-gray-800'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {status?.isConnected ? t('active') : t('inactive')}
        </div>
      </div>

      {status?.isConnected ? (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('phoneNumber')}</span>
            <span className="font-medium text-gray-900">{status.phoneNumber}</span>
          </div>
          
          {status.businessName && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('businessName')}</span>
              <span className="font-medium text-gray-900">{status.businessName}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('status')}</span>
            <span className="font-medium text-gray-200">{status.status || t('active')}</span>
          </div>
          
          {status.messageCount !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('messagesHandled')}</span>
              <span className="font-medium text-gray-900">{status.messageCount}</span>
            </div>
          )}
          
          {status.lastMessageAt && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('lastMessage')}</span>
              <span className="font-medium text-gray-900">
                {new Date(status.lastMessageAt).toLocaleDateString()}
              </span>
            </div>
          )}
          
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => checkWhatsAppStatus()}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              {t('refreshStatus')}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-600 text-sm mb-4">
            {t('setupDescription')}
          </p>
          <button
            onClick={onSetup}
            className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-gray-900 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg"
          >
            {t('setupWhatsApp')}
          </button>
        </div>
      )}
    </motion.div>
  )
}
