import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import { useAppConfig } from '../hooks/useAppConfig';
import { useAuth } from '../context/AuthContext';
import { useSSEProgress } from '../hooks/useSSEProgress';
import LoginModal from '../components/LoginModal';
import { SkeletonBox } from '../components/SkeletonLoader';
import { ThinkingMessage } from '../components/ThinkingMessage';
import { supabase } from '../services/authService';

interface SupportMessage {
  id: string;
  content: string;
  sender_type: 'customer' | 'agent' | 'system';
  sender_name: string;
  sender_email: string;
  created_at: string;
  isUser?: boolean; // For UI compatibility
}

interface Conversation {
  id: string;
  subject: string;
  status: string;
  created_at: string;
}

export const CustomerSupportScreen: React.FC = () => {
  const { config } = useAppConfig();
  const { theme, fontSizes, themedStyles } = useThemedStyles();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [waitingForAgent, setWaitingForAgent] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);

  // Automatically show login modal when screen is focused and user is not authenticated
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        // Small delay to let the screen transition complete
        const timer = setTimeout(() => {
          setShowLoginModal(true);
        }, 300);
        
        return () => clearTimeout(timer);
      }
    }, [isAuthenticated])
  );
  
  // Use existing SSE system for loading states
  const sseProgress = useSSEProgress(config?.organizationId);

  // Initialize conversation when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && config) {
      initializeCustomerSupport();
    }
  }, [isAuthenticated, user, config, initializeCustomerSupport]);

  // Setup realtime subscription
  useEffect(() => {
    if (conversation && isAuthenticated) {
      setupRealtimeSubscription();
    }
  }, [conversation, isAuthenticated, setupRealtimeSubscription]);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const { data: messageData, error } = await supabase
        .from('customer_support_messages')
        .select(`
          id,
          content,
          sender_type,
          sender_name,
          sender_email,
          created_at
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      const formattedMessages: SupportMessage[] = messageData?.map(msg => ({
        ...msg,
        isUser: msg.sender_type === 'customer'
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  const initializeCustomerSupport = useCallback(async () => {
    if (!user || !config) return;

    setLoading(true);
    try {
      // Check if user has an existing conversation
      const { data: existingConversations, error: fetchError } = await supabase
        .from('customer_support_conversations')
        .select('id, subject, status, created_at')
        .eq('organization_id', config.organizationId)
        .eq('customer_id', user.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('Error fetching conversations:', fetchError);
        return;
      }

      let currentConversation: Conversation;

      if (existingConversations && existingConversations.length > 0) {
        // Use existing conversation
        currentConversation = existingConversations[0];
        setConversation(currentConversation);
        
        // Load message history
        await loadMessages(currentConversation.id);
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('customer_support_conversations')
          .insert({
            organization_id: config.organizationId,
            customer_id: user.id,
            customer_email: user.email,
            customer_name: user.fullName || null, // Optional name
            subject: 'Customer Support Request',
            status: 'open',
            priority: 'normal'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating conversation:', createError);
          Alert.alert('Error', 'Failed to start conversation. Please try again.');
          return;
        }

        setConversation(newConversation);
        
        // Send welcome message
        const displayName = user.fullName || user.email?.split('@')[0] || 'there';
        const welcomeMessage = {
          id: 'welcome',
          content: `Hello ${displayName}! How can we help you today?`,
          sender_type: 'system' as const,
          sender_name: 'Customer Support',
          sender_email: 'support@chayo.ai',
          created_at: new Date().toISOString(),
          isUser: false
        };
        
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error initializing customer support:', error);
      Alert.alert('Error', 'Failed to initialize customer support. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, config, loadMessages]);

  const setupRealtimeSubscription = useCallback(() => {
    if (!conversation) return;

    const channel = supabase
      .channel(`conversation_${conversation.id}`)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const newMessage: SupportMessage = {
          ...payload.payload,
          isUser: payload.payload.sender_type === 'customer'
        };
        
        // If it's an agent message, stop the waiting state and SSE
        if (newMessage.sender_type === 'agent') {
          setWaitingForAgent(false);
          sseProgress.disconnect();
        }
        
        // Avoid duplicate messages
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
        scrollToBottom();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Connected to customer support realtime');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Customer support realtime connection error');
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [conversation, sseProgress]);

  const sendMessage = async () => {
    // Check authentication first
    if (!isAuthenticated || !user) {
      setShowLoginModal(true);
      return;
    }

    if (!inputText.trim() || !conversation || sending) return;

    // Add user message immediately
    const userMessage: SupportMessage = {
      id: `temp-${Date.now()}`,
      content: inputText.trim(),
      sender_type: 'customer',
      sender_name: user.fullName || user.email?.split('@')[0] || 'Customer',
      sender_email: user.email || '',
      created_at: new Date().toISOString(),
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setSending(true);
    setWaitingForAgent(true);

    // Start SSE for agent response loading
    const sessionId = `support-${conversation.id}-${Date.now()}`;
    sseProgress.connect(sessionId, 'customer-support');

    try {
      const { data: message, error } = await supabase
        .from('customer_support_messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_type: 'customer',
          sender_name: user.fullName || user.email?.split('@')[0] || 'Customer',
          sender_email: user.email,
          content: inputText.trim(),
          message_type: 'text'
        })
        .select(`
          id,
          content,
          sender_type,
          sender_name,
          sender_email,
          created_at
        `)
        .single();

      if (error) {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Failed to send message. Please try again.');
        // Remove the temporary message
        setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
        return;
      }

      // Update the temporary message with real ID
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...message, isUser: true } : msg
      ));
      
      scrollToBottom();

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      // Remove the temporary message
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setSending(false);
      // Keep waiting for agent state until we get a response
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleLoginSuccess = (_authUser: any) => {
    setShowLoginModal(false);
    // Will trigger useEffect to initialize customer support
  };

  const renderMessage = ({ item }: { item: SupportMessage }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.agentMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.isUser 
          ? [styles.userBubble, { backgroundColor: theme.primaryColor }]
          : [styles.agentBubble, { backgroundColor: theme.surfaceColor }]
      ]}>
        {!item.isUser && (
          <Text style={[styles.senderName, { color: theme.placeholderColor, fontSize: fontSizes.xs }]}>
            {item.sender_name}
          </Text>
        )}
        <Text style={[
          styles.messageText,
          { color: item.isUser ? '#FFFFFF' : theme.textColor, fontSize: fontSizes.base }
        ]}>
          {item.content}
        </Text>
        <Text style={[
          styles.timestamp,
          { color: item.isUser ? 'rgba(255,255,255,0.7)' : theme.placeholderColor, fontSize: fontSizes.xs }
        ]}>
          {new Date(item.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    </View>
  );

  // Show clean loading state while login modal is presented
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, themedStyles.container]}>
        {/* Clean background while login modal is shown - tappable to reopen modal */}
        <TouchableOpacity 
          style={styles.authLoadingContainer}
          onPress={() => setShowLoginModal(true)}
          activeOpacity={1}
        >
          <View style={styles.authLoadingContent}>
            <Text style={[styles.authLoadingText, { color: theme.placeholderColor, fontSize: fontSizes.base }]}>
              {showLoginModal ? 'Preparing Support Chat...' : 'Tap to Sign In for Support'}
            </Text>
          </View>
        </TouchableOpacity>

        <LoginModal
          visible={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            // If user closes modal without logging in, show a helpful message
            // They can tap anywhere to try again
          }}
          onSuccess={handleLoginSuccess}
          title="Sign in for Support"
          message="Sign in to start a conversation with our support team"
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, themedStyles.container]}>
        <SkeletonBox width={200} height={20} borderRadius={8} style={{ marginBottom: 16 }} />
        <SkeletonBox width="100%" height={60} borderRadius={12} style={{ marginBottom: 12 }} />
        <SkeletonBox width="80%" height={60} borderRadius={12} style={{ marginBottom: 12 }} />
        <SkeletonBox width="100%" height={60} borderRadius={12} style={{ marginBottom: 12 }} />
        <SkeletonBox width="70%" height={60} borderRadius={12} />
      </View>
    );
  }

  if (!config) {
    return (
      <View style={[styles.container, themedStyles.container]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.textColor, fontSize: fontSizes.base }]}>
            Customer support is not available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, themedStyles.container]}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        enabled={true}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.borderColor }]}>
          <Text style={[styles.headerTitle, { color: theme.textColor, fontSize: fontSizes.lg }]}>
            Customer Support
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.placeholderColor, fontSize: fontSizes.sm }]}>
            Chat with our support team
          </Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={
            waitingForAgent ? (
              <View style={styles.thinkingContainer}>
                <ThinkingMessage
                  context="customer-support"
                  instanceId={conversation?.id || 'support'}
                  organizationId={config?.organizationId}
                  visible={waitingForAgent}
                />
              </View>
            ) : null
          }
        />

        {/* Input Container */}
        <View style={[styles.inputContainer, { backgroundColor: theme.backgroundColor, borderTopColor: theme.borderColor }]}>
          <TextInput
            ref={textInputRef}
            style={[styles.textInput, { backgroundColor: theme.surfaceColor, color: theme.textColor, borderColor: theme.borderColor, fontSize: fontSizes.base }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor={theme.placeholderColor}
            multiline
            maxLength={1000}
            editable={!sending}
            keyboardAppearance="dark"
            blurOnSubmit={false}
            returnKeyType="done"
            onSubmitEditing={() => textInputRef.current?.blur()}
            enablesReturnKeyAutomatically={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() ? theme.primaryColor : theme.borderColor },
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <Text style={[styles.sendButtonText, { fontSize: fontSizes.lg }]}>...</Text>
            ) : (
              <Text style={[styles.sendButtonText, { fontSize: fontSizes.lg }]}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
        title="Sign in for Support"
        message="Sign in to start a conversation with our support team"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  agentMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  agentBubble: {
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    maxHeight: 120,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  thinkingContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  authLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  authLoadingContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  authLoadingText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    opacity: 0.8,
  },
});
