'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

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
}

export default function AgentCard({ 
  agent, 
  channels, 
  onEdit, 
  onTogglePause, 
  onDelete 
}: AgentCardProps) {
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
      whileHover={{ y: -2 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative"
    >
      {/* Agent Status Indicator */}
      <div className="absolute top-4 right-4">
        <div className={`w-3 h-3 rounded-full ${agent.paused ? 'bg-yellow-400' : 'bg-green-400'}`} />
      </div>

      {/* Agent Info */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-md hover:bg-gray-100 text-gray-400"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={onEdit}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Edit Agent
                </button>
                <button
                  onClick={onTogglePause}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {agent.paused ? 'Resume' : 'Pause'} Agent
                </button>
                <button
                  onClick={onDelete}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete Agent
                </button>
              </div>
            )}
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {agent.greeting}
        </p>
        
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-xs font-medium text-gray-500">TONE:</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize">
            {agent.tone}
          </span>
        </div>

        {/* Goals */}
        {agent.goals && agent.goals.length > 0 && (
          <div className="mb-3">
            <span className="text-xs font-medium text-gray-500">GOALS:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {agent.goals.slice(0, 2).map((goal: string, index: number) => (
                <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {goal}
                </span>
              ))}
              {agent.goals.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{agent.goals.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Connected Channels */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Connected Channels</span>
          <span className="text-xs text-gray-500">{connectedChannels.length} active</span>
        </div>
        
        {connectedChannels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {connectedChannels.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
              >
                <span>{getChannelIcon(channel.channel_type)}</span>
                <span className="capitalize">{channel.channel_type}</span>
                <div className="w-2 h-2 bg-green-400 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No channels connected</p>
        )}
      </div>

      {/* Available Channels */}
      {availableChannels.length > 0 && (
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-700">Available Channels</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {availableChannels.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center space-x-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs"
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
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-gray-500">Status:</span>
              <span className={`ml-1 font-medium ${
                agent.paused ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {agent.paused ? 'Paused' : 'Active'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Created:</span>
              <span className="ml-1 text-gray-900">{formatDate(agent.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-2 mt-4">
        <button
          onClick={onEdit}
          className="flex-1 bg-orange-400 hover:bg-orange-500 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
        >
          Configure
        </button>
        <button
          onClick={onTogglePause}
          className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
            agent.paused 
              ? 'bg-green-100 hover:bg-green-200 text-green-800'
              : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
          }`}
        >
          {agent.paused ? 'Resume' : 'Pause'}
        </button>
      </div>
    </motion.div>
  )
}
