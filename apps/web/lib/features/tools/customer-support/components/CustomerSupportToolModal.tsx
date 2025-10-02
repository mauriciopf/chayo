'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface CustomerSupportToolModalProps {
  organizationId: string;
  isEnabled: boolean;
  onSettingsChange: (settings: any) => void;
}

interface Conversation {
  id: string;
  customer_name: string;
  customer_email: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  unread_count: number;
  last_message_content: string;
  last_message_sender_type: 'customer' | 'agent';
  last_message_at: string;
}

export default function CustomerSupportToolModal({ 
  organizationId, 
  isEnabled, 
  onSettingsChange 
}: CustomerSupportToolModalProps) {
  const t = useTranslations('dashboard.tools.customerSupport');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Load conversations preview
  useEffect(() => {
    if (isEnabled) {
      loadConversations();
    }
  }, [isEnabled]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/customer-support/conversations?limit=5');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = (status: Conversation['status']) => {
    const mapping: Record<Conversation['status'], string> = {
      open: t('status.open'),
      in_progress: t('status.inProgress'),
      resolved: t('status.resolved'),
      closed: t('status.closed')
    }
    return mapping[status]
  }

  if (!isEnabled) {
    return (
      <div className="p-6 text-center">
        <div className="max-w-md mx-auto">
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <svg className="w-8 h-8" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('toolDisabledTitle')}
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t('toolDisabledDescription')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Stats Header */}
      <div 
        className="p-4 rounded-lg mb-4"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {t('conversationCount', { count: conversations.length })}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {conversations.filter(c => c.unread_count > 0).length} sin leer
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-secondary)' }}></div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('statusLive')}</span>
          </div>
        </div>
      </div>

      {/* Conversations Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Conversaciones Recientes
          </h4>
          <a 
            href="/dashboard?view=customer-support"
            className="text-xs hover:underline"
            style={{ color: 'var(--accent-secondary)' }}
          >
            Ver todas →
          </a>
        </div>

        {loading ? (
          <div className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>
            {t('loading')}
          </div>
        ) : conversations.length === 0 ? (
          <div 
            className="p-4 rounded-lg text-center"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t('noConversations')}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {t('emptyDescription')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="p-3 rounded-lg border cursor-pointer transition-colors hover:opacity-80"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-secondary)'
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {conversation.customer_name}
                      </p>
                      {conversation.unread_count > 0 && (
                        <span 
                          className="px-2 py-0.5 text-xs text-white rounded-full"
                          style={{ backgroundColor: 'var(--accent-secondary)' }}
                        >
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {conversation.customer_email}
                    </p>
                  </div>
                  <span 
                    className="px-2 py-0.5 text-xs rounded-full ml-2"
                    style={{
                      backgroundColor: conversation.status === 'resolved' ? 'var(--accent-secondary)' : 'var(--bg-secondary)',
                      color: conversation.status === 'resolved' ? 'white' : 'var(--text-secondary)'
                    }}
                  >
                    {statusLabel(conversation.status)}
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-medium" style={{
                    color: conversation.last_message_sender_type === 'customer' ? 'var(--accent-secondary)' : 'var(--text-primary)'
                  }}>
                    {conversation.last_message_sender_type === 'customer' ? 'Cliente: ' : 'Tú: '}
                  </span>
                  {conversation.last_message_content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info footer */}
      <div 
        className="mt-4 p-3 rounded-lg text-center"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      >
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          💡 Visita <span style={{ color: 'var(--accent-secondary)' }} className="font-medium">Soporte al Cliente</span> en el menú para chatear con tus clientes
        </p>
      </div>
    </div>
  );
}

