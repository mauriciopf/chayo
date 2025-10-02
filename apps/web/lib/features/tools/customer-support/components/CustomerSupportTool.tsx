'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@supabase/supabase-js';

interface CustomerSupportToolProps {
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
  priority: 'low' | 'normal' | 'high' | 'urgent';
  unread_count: number;
  last_message_content: string;
  last_message_sender_type: 'customer' | 'agent';
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

interface Message {
  id: string;
  sender_type: 'customer' | 'agent' | 'system';
  sender_name: string;
  sender_email: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  created_at: string;
  reply_to_id?: string;
}

export default function CustomerSupportTool({ 
  organizationId, 
  isEnabled, 
  onSettingsChange 
}: CustomerSupportToolProps) {
  const t = useTranslations('dashboard.tools.customerSupport');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Supabase client for realtime
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Load conversations
  const loadConversations = async () => {
    try {
      const response = await fetch('/api/customer-support/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load messages for selected conversation
  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/customer-support/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/customer-support/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          messageType: 'text'
        })
      });

      if (response.ok) {
        setNewMessage('');
        // Message will be added via realtime subscription
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Setup realtime subscriptions
  useEffect(() => {
    if (!isEnabled) return;

    // Subscribe to organization support channel for new conversations
    const orgChannel = supabase
      .channel(`org_${organizationId}_support`)
      .on('broadcast', { event: 'new_conversation' }, (payload) => {
        const { conversation, initialMessage } = payload.payload;
        setConversations(prev => [conversation, ...prev]);
      })
      .on('broadcast', { event: 'conversation_updated' }, (payload) => {
        const { conversationId, lastMessage } = payload.payload;
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? { 
                ...conv, 
                last_message_content: lastMessage.content,
                last_message_sender_type: lastMessage.sender_type,
                last_message_at: lastMessage.created_at,
                unread_count: lastMessage.sender_type === 'customer' ? conv.unread_count + 1 : conv.unread_count
              }
            : conv
        ));
      })
      .subscribe();

    // Subscribe to specific conversation channel when one is selected
    let conversationChannel: any;
    if (selectedConversation) {
      conversationChannel = supabase
        .channel(`conversation_${selectedConversation.id}`)
        .on('broadcast', { event: 'new_message' }, (payload) => {
          const message = payload.payload;
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        })
        .subscribe();
    }

    return () => {
      orgChannel.unsubscribe();
      if (conversationChannel) {
        conversationChannel.unsubscribe();
      }
    };
  }, [organizationId, selectedConversation, isEnabled]);

  // Load initial data
  useEffect(() => {
    if (isEnabled) {
      loadConversations();
    }
  }, [isEnabled]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

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
            <svg className="w-8 h-8" style={{ color: 'var(--accent-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('toolDisabledTitle')}
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {t('toolDisabledDescription')}
          </p>
          <button
            onClick={() => onSettingsChange({ enabled: true })}
            className="px-4 py-2 text-white rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--accent-secondary)' }}
          >
            {t('enableButton')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="border-b p-4 flex-shrink-0" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('title')}</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t('conversationCount', { count: conversations.length })}
            </span>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-secondary)' }}></div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('statusLive')}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversations List */}
        <div className="w-1/3 border-r flex flex-col" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('conversations')}</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs rounded-full" style={{ backgroundColor: 'var(--accent-secondary)', color: 'white' }}>
                {t('filters.all', { count: conversations.length })}
              </button>
              <button className="px-3 py-1 text-xs rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                {t('filters.unread', { count: conversations.filter(c => c.unread_count > 0).length })}
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>{t('loading')}</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>
                <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <svg className="w-6 h-6" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm">{t('noConversations')}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {t('emptyDescription')}
                </p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className="p-4 border-b cursor-pointer transition-colors"
                  style={{
                    borderColor: selectedConversation?.id === conversation.id ? 'var(--accent-secondary)' : 'var(--border-secondary)',
                    backgroundColor: selectedConversation?.id === conversation.id ? 'var(--bg-hover)' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedConversation?.id !== conversation.id) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedConversation?.id !== conversation.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {conversation.customer_name}
                        </h4>
                        {conversation.unread_count > 0 && (
                          <span className="px-2 py-0.5 text-xs text-white rounded-full" style={{ backgroundColor: 'var(--accent-secondary)' }}>
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {conversation.customer_email}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                     <span className="px-2 py-0.5 text-xs rounded-full" style={{
                        backgroundColor: conversation.status === 'open' ? 'var(--bg-tertiary)' :
                        conversation.status === 'in_progress' ? 'var(--bg-hover)' :
                        conversation.status === 'resolved' ? 'var(--accent-secondary)' :
                        'var(--bg-secondary)',
                        color: conversation.status === 'resolved' ? 'white' : 'var(--text-secondary)'
                      }}>
                        {statusLabel(conversation.status)}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(conversation.last_message_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                    <span className="font-medium" style={{
                      color: conversation.last_message_sender_type === 'customer' ? 'var(--accent-secondary)' : 'var(--text-primary)'
                    }}>
                      {conversation.last_message_sender_type === 'customer' ? `${t('customerPrefix')} ` : `${t('agentPrefix')} `}
                    </span>
                    {conversation.last_message_content}
                  </p>
                  <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>
                    {conversation.subject}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="border-b p-4" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {selectedConversation.customer_name}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {selectedConversation.customer_email} • {selectedConversation.subject}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedConversation.status}
                      onChange={(e) => {
                        // Update conversation status
                        const newStatus = e.target.value;
                        setSelectedConversation(prev => prev ? { ...prev, status: newStatus as any } : null);
                        // TODO: API call to update status
                      }}
                     className="px-3 py-1 text-sm border rounded-lg focus:ring-2"
                     style={{ 
                       backgroundColor: 'var(--bg-tertiary)', 
                       borderColor: 'var(--border-primary)', 
                       color: 'var(--text-primary)',
                       '--tw-ring-color': 'var(--accent-secondary)'
                     } as React.CSSProperties}
                   >
                      <option value="open">{t('status.open')}</option>
                      <option value="in_progress">{t('status.inProgress')}</option>
                      <option value="resolved">{t('status.resolved')}</option>
                      <option value="closed">{t('status.closed')}</option>
                    </select>
                    <select
                      value={selectedConversation.priority}
                      onChange={(e) => {
                        // Update conversation priority
                        const newPriority = e.target.value;
                        setSelectedConversation(prev => prev ? { ...prev, priority: newPriority as any } : null);
                        // TODO: API call to update priority
                      }}
                     className="px-3 py-1 text-sm border rounded-lg focus:ring-2"
                     style={{ 
                       backgroundColor: 'var(--bg-tertiary)', 
                       borderColor: 'var(--border-primary)', 
                       color: 'var(--text-primary)',
                       '--tw-ring-color': 'var(--accent-secondary)'
                     } as React.CSSProperties}
                    >
                      <option value="low">{t('priority.low')}</option>
                      <option value="normal">{t('priority.normal')}</option>
                      <option value="high">{t('priority.high')}</option>
                      <option value="urgent">{t('priority.urgent')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg" style={{
                      backgroundColor: message.sender_type === 'agent'
                        ? 'var(--accent-secondary)'
                        : message.sender_type === 'system'
                        ? 'var(--bg-tertiary)'
                        : 'var(--bg-secondary)',
                      color: message.sender_type === 'agent' ? 'white' : 'var(--text-primary)',
                      textAlign: message.sender_type === 'system' ? 'center' : 'left'
                    }}>
                      {message.sender_type !== 'system' && (
                        <div className="text-xs opacity-75 mb-1">
                          {message.sender_name} • {new Date(message.created_at).toLocaleTimeString()}
                        </div>
                      )}
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex gap-3">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('typing')}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 resize-none"
                    style={{ 
                      backgroundColor: 'var(--bg-tertiary)', 
                      borderColor: 'var(--border-primary)', 
                      color: 'var(--text-primary)',
                      '--tw-ring-color': 'var(--accent-secondary)'
                    } as React.CSSProperties}
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ backgroundColor: 'var(--accent-secondary)' }}
                  >
                    {sending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <svg className="w-8 h-8" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('selectConversationTitle')}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t('selectConversation')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
