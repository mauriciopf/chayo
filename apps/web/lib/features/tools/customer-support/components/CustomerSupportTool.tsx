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
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('toolDisabledTitle')}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {t('toolDisabledDescription')}
          </p>
          <button
            onClick={() => onSettingsChange({ enabled: true })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('enableButton')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('title')}</h2>
            <p className="text-sm text-gray-600">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {t('conversationCount', { count: conversations.length })}
            </span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-400">{t('statusLive')}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">{t('conversations')}</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                {t('filters.all', { count: conversations.length })}
              </button>
              <button className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                {t('filters.unread', { count: conversations.filter(c => c.unread_count > 0).length })}
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">{t('loading')}</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm">{t('noConversations')}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {t('emptyDescription')}
                </p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {conversation.customer_name}
                        </h4>
                        {conversation.unread_count > 0 && (
                          <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {conversation.customer_email}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                     <span className={`px-2 py-0.5 text-xs rounded-full ${
                        conversation.status === 'open' ? 'bg-green-100 text-green-700' :
                        conversation.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                        conversation.status === 'resolved' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {statusLabel(conversation.status)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(conversation.last_message_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    <span className={`font-medium ${
                      conversation.last_message_sender_type === 'customer' ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {conversation.last_message_sender_type === 'customer' ? `${t('customerPrefix')} ` : `${t('agentPrefix')} `}
                    </span>
                    {conversation.last_message_content}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    {conversation.subject}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedConversation.customer_name}
                    </h3>
                    <p className="text-sm text-gray-600">
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
                     className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                     className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_type === 'agent'
                        ? 'bg-blue-600 text-white'
                        : message.sender_type === 'system'
                        ? 'bg-gray-100 text-gray-600 text-center'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
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
              <div className="border-t border-gray-200 p-4">
                <div className="flex gap-3">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('typing')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('selectConversationTitle')}</h3>
                <p className="text-sm text-gray-600">
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
