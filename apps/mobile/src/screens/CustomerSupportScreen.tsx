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
  Alert,
  Keyboard,
} from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import { useAppConfig } from '../hooks/useAppConfig';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import { SkeletonBox } from '../components/SkeletonLoader';
import { supabase } from '../services/authService';
import { KeyboardAwareChat } from '../components/KeyboardAwareChat';

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
  const { theme, fontSizes } = useThemedStyles();
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const flatListRef = useRef<FlatList<SupportMessage>>(null);
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

  // Declare functions first to avoid hoisting issues
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
        isUser: msg.sender_type === 'customer',
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // Handle keyboard show/hide to scroll to bottom
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        scrollToBottom();
      }
    );

    return () => {
      keyboardWillShowListener.remove();
    };
  }, [scrollToBottom]);

  const initializeCustomerSupport = useCallback(async () => {
    if (!user || !config) {return;}

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
            priority: 'normal',
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating conversation:', createError);
          Alert.alert('Error', 'No se pudo iniciar la conversación. Intenta de nuevo.');
          return;
        }

        setConversation(newConversation);

        // Send welcome message
        const displayName = user.fullName || user.email?.split('@')[0] || 'amiga';
        const welcomeMessage = {
          id: 'welcome',
          content: `¡Hola ${displayName}! ¿Cómo podemos ayudarte hoy?`,
          sender_type: 'system' as const,
          sender_name: 'Soporte al cliente',
          sender_email: 'support@chayo.ai',
          created_at: new Date().toISOString(),
          isUser: false,
        };

        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error initializing customer support:', error);
      Alert.alert('Error', 'No se pudo iniciar el soporte al cliente. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [user, config, loadMessages]);

  const setupRealtimeSubscription = useCallback(() => {
    if (!conversation) {return;}

    const channel = supabase
      .channel(`conversation_${conversation.id}`)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const newMessage: SupportMessage = {
          ...payload.payload,
          isUser: payload.payload.sender_type === 'customer',
        };

        // Avoid duplicate messages
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) {return prev;}
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
  }, [conversation, scrollToBottom]);

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

  const sendMessage = async () => {
    // Check authentication first
    if (!isAuthenticated || !user) {
      setShowLoginModal(true);
      return;
    }

    if (!inputText.trim() || !conversation || sending) {return;}

    // Add user message immediately
    const userMessage: SupportMessage = {
      id: `temp-${Date.now()}`,
      content: inputText.trim(),
      sender_type: 'customer',
      sender_name: user.fullName || user.email?.split('@')[0] || 'Cliente',
      sender_email: user.email || '',
      created_at: new Date().toISOString(),
      isUser: true,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setSending(true);

    try {
      const { data: message, error } = await supabase
        .from('customer_support_messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_type: 'customer',
          sender_name: user.fullName || user.email?.split('@')[0] || 'Cliente',
          sender_email: user.email,
          content: inputText.trim(),
          message_type: 'text',
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
        Alert.alert('Error', 'No se pudo enviar el mensaje. Intenta de nuevo.');
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
      Alert.alert('Error', 'No se pudo enviar el mensaje. Intenta de nuevo.');
      // Remove the temporary message
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleLoginSuccess = (_authUser: any) => {
    setShowLoginModal(false);
    // Will trigger useEffect to initialize customer support
  };

  const renderMessage = ({ item }: { item: SupportMessage }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.agentMessage,
    ]}>
      <View style={[
        styles.messageBubble,
        item.isUser
          ? [styles.userBubble, { backgroundColor: theme.primaryColor }]
          : [styles.agentBubble, { backgroundColor: theme.surfaceColor }],
      ]}>
        {!item.isUser && (
          <Text style={[styles.senderName, { color: theme.placeholderColor, fontSize: fontSizes.xs }]}>
            {item.sender_name}
          </Text>
        )}
        <Text style={[
          styles.messageText,
          { color: item.isUser ? '#FFFFFF' : theme.textColor, fontSize: fontSizes.base },
        ]}>
          {item.content}
        </Text>
        <Text style={[
          styles.timestamp,
          { color: item.isUser ? 'rgba(255,255,255,0.7)' : theme.placeholderColor, fontSize: fontSizes.xs },
        ]}>
          {new Date(item.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );

  // Show clean loading state while login modal is presented
  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
        {/* Clean background while login modal is shown - tappable to reopen modal */}
        <TouchableOpacity
          style={styles.authLoadingContainer}
          onPress={() => setShowLoginModal(true)}
          activeOpacity={1}
        >
          <View style={styles.authLoadingContent}>
            <Text style={[styles.authLoadingText, { color: theme.placeholderColor, fontSize: fontSizes.base }]}>
              {showLoginModal ? 'Preparando el chat de soporte...' : 'Toca para iniciar sesión y recibir soporte'}
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
          title="Inicia sesión para recibir soporte"
          message="Inicia sesión para comenzar una conversación con nuestro equipo de soporte"
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundColor }]}>
        <SkeletonBox width={200} height={20} borderRadius={8} style={styles.skeletonMargin16} />
        <SkeletonBox width={350} height={60} borderRadius={12} style={styles.skeletonMargin12} />
        <SkeletonBox width={280} height={60} borderRadius={12} style={styles.skeletonMargin12} />
        <SkeletonBox width={350} height={60} borderRadius={12} style={styles.skeletonMargin12} />
        <SkeletonBox width={245} height={60} borderRadius={12} />
      </View>
    );
  }

  if (!config) {
    return (
      <View style={[styles.errorOuterContainer, { backgroundColor: theme.backgroundColor }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.textColor, fontSize: fontSizes.base }]}>
            El soporte al cliente no está disponible
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAwareChat
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item) => item.id}
      onContentSizeChange={scrollToBottom}
      flatListRef={flatListRef}
      inputValue={inputText}
      onChangeText={setInputText}
      onSend={sendMessage}
      inputRef={textInputRef}
      placeholder="Escribe tu mensaje..."
      sendDisabled={!inputText.trim() || sending}
      sendButtonContent={
        sending ? (
          <Text style={[styles.sendButtonText, { fontSize: fontSizes.lg }]}>...</Text>
        ) : (
          <Text style={[styles.sendButtonText, { fontSize: fontSizes.lg }]}>↑</Text>
        )
      }
      backgroundColor={theme.backgroundColor}
      inputBackgroundColor={theme.surfaceColor}
      textColor={theme.textColor}
      borderColor={theme.borderColor}
      focusBorderColor={theme.borderColor}
      placeholderColor={theme.placeholderColor}
      sendButtonColor={inputText.trim() ? theme.primaryColor : theme.borderColor}
      sendButtonTextColor={theme.textColor}
      additionalContent={
        <LoginModal
          visible={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
          title="Inicia sesión para recibir soporte"
          message="Inicia sesión para comenzar una conversación con nuestro equipo de soporte"
        />
      }
    />
  );
};

const styles = StyleSheet.create({
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
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    padding: 16,
  },
  skeletonMargin16: {
    marginBottom: 16,
  },
  skeletonMargin12: {
    marginBottom: 12,
  },
  errorOuterContainer: {
    flex: 1,
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
