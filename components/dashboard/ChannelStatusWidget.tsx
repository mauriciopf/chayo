import { useState, useEffect } from 'react'

interface ChannelStatus {
  id: string
  name: string
  type: string
  icon: string
  connected: boolean
  lastActivity?: string
  comingSoon?: boolean
}

interface ChannelStatusWidgetProps {
  agentId?: string
}

export default function ChannelStatusWidget({ agentId }: ChannelStatusWidgetProps) {
  const [channels, setChannels] = useState<ChannelStatus[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data for now - this will be replaced with actual API calls
  useEffect(() => {
    const mockChannels: ChannelStatus[] = [
      {
        id: 'whatsapp',
        name: 'WhatsApp AI Agent',
        type: 'whatsapp',
        icon: '📱',
        connected: true,
        lastActivity: '2 hours ago'
      },
      {
        id: 'web',
        name: 'Web AI Widget',
        type: 'web',
        icon: '🌐',
        connected: false,
        comingSoon: true
      },
      {
        id: 'video',
        name: 'Video AI Agent',
        type: 'video',
        icon: '🎥',
        connected: false,
        comingSoon: true
      },
      {
        id: 'instagram',
        name: 'Instagram DM Automation',
        type: 'instagram',
        icon: '�',
        connected: false,
        comingSoon: true
      }
    ]

    // Simulate API call
    setTimeout(() => {
      setChannels(mockChannels)
      setLoading(false)
    }, 500)
  }, [agentId])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const connectedChannels = channels.filter(c => c.connected)
  const totalChannels = channels.length

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Channel Status
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {connectedChannels.length}/{totalChannels} connected
          </span>
          <div className={`w-3 h-3 rounded-full ${
            connectedChannels.length > 0 ? 'bg-green-400' : 'bg-gray-300'
          }`}></div>
        </div>
      </div>

      <div className="space-y-3">
        {channels.map((channel) => (
          <div key={channel.id} className={`flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 ${
            channel.comingSoon ? 'opacity-75' : ''
          }`}>
            <div className="flex items-center space-x-3">
              <span className="text-xl">{channel.icon}</span>
              <div>
                <p className="font-medium text-gray-900">{channel.name}</p>
                {channel.connected && channel.lastActivity && (
                  <p className="text-xs text-gray-500">
                    Last activity: {channel.lastActivity}
                  </p>
                )}
                {channel.comingSoon && (
                  <p className="text-xs text-blue-600 font-medium">
                    Coming Soon
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                channel.comingSoon
                  ? 'bg-blue-100 text-blue-800'
                  : channel.connected
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {channel.comingSoon ? 'Próximamente' : channel.connected ? 'Connected' : 'Disconnected'}
              </span>
              {channel.connected && !channel.comingSoon && (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => window.location.href = '/integrations'}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-lg"
        >
          Manage Channels
        </button>
      </div>
    </div>
  )
}
