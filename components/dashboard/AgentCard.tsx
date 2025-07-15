'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

interface Agent {
  id: string
  name: string
  greeting: string
  tone: string
  goals: string[]
  system_prompt: string
  paused: boolean
  created_at: string
}

interface AgentChannel {
  id: string
  agent_id: string
  channel_type: string
  connected: boolean
  credentials: any
}

interface AgentCardProps {
  agent: Agent
  channels: AgentChannel[]
  onEdit: () => void
  onTogglePause: () => void
  onDelete: () => void
  onManageDocuments: () => void
}

export default function AgentCard({ 
  agent, 
  channels, 
  onEdit, 
  onTogglePause, 
  onDelete,
  onManageDocuments
}: AgentCardProps) {
  const t = useTranslations('agentCard')
  const [showMenu, setShowMenu] = useState(false)

  const getChannelIcon = (channelType: string) => {
    const icons = {
      whatsapp: '📱',
      instagram: '📷',
      facebook: '📘',
      webchat: '💬',
      voice: '📞',
      email: '📧'
    }
    return icons[channelType as keyof typeof icons] || '🔗'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const connectedChannels = channels.filter(c => c.connected)
  const availableChannels = channels.filter(c => !c.connected)

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 relative overflow-hidden"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-pink-50/30 to-orange-50/30 pointer-events-none" />
      
      {/* Agent Status Indicator */}
      <div className="absolute top-4 right-4 z-10">
        <div className={`w-3 h-3 rounded-full ${agent.paused ? 'bg-yellow-400' : 'bg-green-400'} shadow-lg`} />
      </div>

      {/* Agent Info */}
      <div className="mb-4 relative z-10">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">{agent.name}</h3>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 text-gray-400 hover:text-purple-600 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-white/20 py-1 z-20">
                <button
                  onClick={() => {
                    onEdit()
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 transition-all duration-200 rounded-lg mx-1"
                >
                  {t('editAgent')}
                </button>
                <button
                  onClick={() => {
                    onManageDocuments()
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 transition-all duration-200 rounded-lg mx-1"
                >
                  {t('manageDocuments')}
                </button>
                <button
                  onClick={() => {
                    onTogglePause()
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 transition-all duration-200 rounded-lg mx-1"
                >
                  {agent.paused ? t('resumeAgent') : t('pauseAgent')}
                </button>
                <button
                  onClick={() => {
                    onDelete()
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 rounded-lg mx-1"
                >
                  {t('deleteAgent')}
                </button>
              </div>
            )}
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {agent.greeting}
        </p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-500">{t('tone')}:</span>
            <span className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-1 rounded-full capitalize font-medium">
              {agent.tone}
            </span>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onManageDocuments}
            className="text-xs bg-gradient-to-r from-orange-100 to-pink-100 text-orange-800 px-3 py-1 rounded-full hover:from-orange-200 hover:to-pink-200 transition-all duration-200 flex items-center space-x-1 font-medium"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{t('docs')}</span>
          </motion.button>
        </div>

        {/* Goals */}
        {agent.goals && agent.goals.length > 0 && (
          <div className="mb-3">
            <span className="text-xs font-medium text-gray-500">{t('goals')}:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {agent.goals.slice(0, 2).map((goal: string, index: number) => (
                <span key={index} className="text-xs bg-gradient-to-r from-gray-100 to-purple-50 text-gray-700 px-2 py-1 rounded-full">
                  {goal}
                </span>
              ))}
              {agent.goals.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{agent.goals.length - 2} {t('more')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Connected Channels */}
      <div className="mb-4 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Connected Channels</span>
          <span className="text-xs text-gray-500">{connectedChannels.length} active</span>
        </div>
        
        {connectedChannels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {connectedChannels.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center space-x-1 bg-gradient-to-r from-green-100 to-teal-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium"
              >
                <span>{getChannelIcon(channel.channel_type)}</span>
                <span className="capitalize">{channel.channel_type}</span>
                <div className="w-2 h-2 bg-green-400 rounded-full shadow-sm" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No channels connected</p>
        )}
      </div>

      {/* Available Channels */}
      {availableChannels.length > 0 && (
        <div className="mb-4 relative z-10">
          <span className="text-sm font-semibold text-gray-700">Available Channels</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {availableChannels.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center space-x-1 bg-gradient-to-r from-gray-100 to-purple-50 text-gray-600 px-3 py-1 rounded-full text-xs font-medium"
              >
                <span>{getChannelIcon(channel.channel_type)}</span>
                <span className="capitalize">{channel.channel_type}</span>
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Stats */}
      <div className="border-t border-gray-200/50 pt-4 relative z-10">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-gray-500">Status:</span>
              <span className={`ml-1 font-semibold ${
                agent.paused ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {agent.paused ? t('status.paused') : t('status.active')}
              </span>
            </div>
            <div>
              <span className="text-gray-500">{t('created')}:</span>
              <span className="ml-1 text-gray-900 font-medium">{formatDate(agent.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-3 mt-4 relative z-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEdit}
          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-semibold py-3 px-3 rounded-xl transition-all duration-200 shadow-lg"
        >
          Configure
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onTogglePause}
          className={`flex-1 text-sm font-semibold py-3 px-3 rounded-xl transition-all duration-200 ${
            agent.paused 
              ? 'bg-gradient-to-r from-green-100 to-teal-100 hover:from-green-200 hover:to-teal-200 text-green-800'
              : 'bg-gradient-to-r from-yellow-100 to-orange-100 hover:from-yellow-200 hover:to-orange-200 text-yellow-800'
          }`}
        >
          {agent.paused ? 'Resume' : 'Pause'}
        </motion.button>
      </div>
    </motion.div>
  )
}
