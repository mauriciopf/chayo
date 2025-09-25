import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useAppConfig } from '../hooks/useAppConfig';
import { useThemedStyles } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { SkeletonBox } from './SkeletonLoader';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

export const AIChatContent: React.FC = () => {
  const { config } = useAppConfig();
  const { theme, themedStyles } = useThemedStyles();
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);

  // Welcome message
  useEffect(() => {
    if (config) {
      const welcomeMessage: Message = {
        id: 'welcome',
        text: t('chat.emptyTitle') + ' ' + t('chat.emptySubtitle'),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [config, t]);

  const sendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      text: '',
      isUser: false,
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputText('');
    setIsTyping(true);
    
    // Keep input focused after sending message
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/client-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText.trim(),
          organizationId: config.organizationId,
          locale: i18n.language, // Use current language
          messages: messages.filter(m => !m.isLoading).map(m => ({
            role: m.isUser ? 'user' : 'assistant',
            content: m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        text: data.response || t('errors.serverError'),
        isUser: false,
        timestamp: new Date(),
      };

      // Remove loading message and add assistant response
      setMessages(prev => [
        ...prev.filter(m => !m.isLoading),
        assistantMessage,
      ]);

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: t('errors.networkError'),
        isUser: false,
        timestamp: new Date(),
      };

      // Remove loading message and add error message
      setMessages(prev => [
        ...prev.filter(m => !m.isLoading),
        errorMessage,
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          {
            backgroundColor: item.isUser ? theme.primaryColor : theme.surfaceColor,
            borderColor: theme.borderColor,
          },
        ]}
      >
        {item.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.primaryColor} />
            <Text style={[styles.loadingText, { color: theme.placeholderColor }]}>
              {t('chat.thinking')}
            </Text>
          </View>
        ) : (
          <Text
            style={[
              styles.messageText,
              { color: item.isUser ? '#FFFFFF' : theme.textColor },
            ]}
          >
            {item.text}
          </Text>
        )}
      </View>
    </View>
  );

  if (!config) {
    return (
      <View style={[styles.container, themedStyles.container]}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.chatContainer, { paddingBottom: 100 }]}>
            {/* Skeleton for chat messages */}
            <View style={styles.skeletonMessagesContainer}>
              {/* AI welcome message skeleton */}
              <View style={[styles.messageContainer, styles.assistantMessage]}>
                <View style={styles.skeletonMessageBubble}>
                  <SkeletonBox width={200} height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                  <SkeletonBox width={150} height={16} borderRadius={4} />
                </View>
              </View>
              
              {/* User message skeleton */}
              <View style={[styles.messageContainer, styles.userMessage]}>
                <View style={styles.skeletonMessageBubble}>
                  <SkeletonBox width={120} height={16} borderRadius={4} />
                </View>
              </View>
              
              {/* AI response skeleton */}
              <View style={[styles.messageContainer, styles.assistantMessage]}>
                <View style={styles.skeletonMessageBubble}>
                  <SkeletonBox width={180} height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                  <SkeletonBox width={220} height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                  <SkeletonBox width={100} height={16} borderRadius={4} />
                </View>
              </View>
              
              {/* Another user message skeleton */}
              <View style={[styles.messageContainer, styles.userMessage]}>
                <View style={styles.skeletonMessageBubble}>
                  <SkeletonBox width={90} height={16} borderRadius={4} />
                </View>
              </View>
            </View>

            {/* Skeleton for input area */}
            <View style={[styles.inputContainer, { backgroundColor: theme.backgroundColor, borderTopColor: theme.borderColor }]}>
              <SkeletonBox width="75%" height={44} borderRadius={22} style={{ marginRight: 12 }} />
              <SkeletonBox width={60} height={44} borderRadius={22} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={[styles.container, themedStyles.container]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.chatContainer, { paddingBottom: 100 }]}>
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
          />

          <View style={[styles.inputContainer, { backgroundColor: theme.backgroundColor, borderTopColor: theme.borderColor }]}>
            <TextInput
              ref={textInputRef}
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.surfaceColor,
                  color: theme.textColor,
                  borderColor: theme.borderColor,
                },
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder={t('chat.placeholder')}
              placeholderTextColor={theme.placeholderColor}
              multiline
              maxLength={1000}
              returnKeyType="done"
              onSubmitEditing={() => textInputRef.current?.blur()}
              blurOnSubmit={false}
              enablesReturnKeyAutomatically={false}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim() ? theme.primaryColor : theme.surfaceColor,
                },
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isTyping}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.sendButtonText,
                  {
                    color: inputText.trim() ? '#FFFFFF' : theme.placeholderColor,
                  },
                ]}
              >
                {t('chat.send')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContainer: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  skeletonMessagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  skeletonMessageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
});
