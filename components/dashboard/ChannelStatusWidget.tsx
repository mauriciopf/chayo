import { useState, useEffect } from 'react'

interface ChannelStatus {
  id: string
  name: string
  type: string
  icon: string
  connected: boolean
  lastActivity?: string
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
        id: 'web',
        name: 'Web Chat',
        type: 'web',
        icon: '🌐',
        connected: true,
        lastActivity: '2 hours ago'
      },
      {
        id: 'whatsapp',
        name: 'WhatsApp',
        type: 'whatsapp',
        icon: '📱',
        connected: false
      },
      {
        id: 'instagram',
        name: 'Instagram',
        type: 'instagram',
        icon: '📷',
        connected: false
      },
      {
        id: 'facebook',
        name: 'Facebook',
        type: 'facebook',
        icon: '💬',
        connected: false
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
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
          <div key={channel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-xl">{channel.icon}</span>
              <div>
                <p className="font-medium text-gray-900">{channel.name}</p>
                {channel.connected && channel.lastActivity && (
                  <p className="text-xs text-gray-500">
                    Last activity: {channel.lastActivity}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                channel.connected
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {channel.connected ? 'Connected' : 'Disconnected'}
              </span>
              {channel.connected && (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t">
        <button
          onClick={() => window.location.href = '/integrations'}
          className="w-full bg-orange-400 hover:bg-orange-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Manage Channels
        </button>
      </div>
    </div>
  )
}
