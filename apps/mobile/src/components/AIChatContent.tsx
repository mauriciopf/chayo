import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppConfig } from '../hooks/useAppConfig';
import { useThemedStyles } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { SkeletonBox } from './SkeletonLoader';
import { KeyboardAwareChat } from './KeyboardAwareChat';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

export const AIChatContent: React.FC = () => {
  const { config } = useAppConfig();
  const { theme, fontSizes, themedStyles } = useThemedStyles();
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
        text: t('chat.emptyTitle', { businessName: config.businessName }) + ' ' + t('chat.emptySubtitle'),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [config, t]);

  const sendMessage = async () => {
    if (!inputText.trim() || isTyping) {return;}

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
      const response = await fetch(`${config?.apiBaseUrl}/api/client-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText.trim(),
          organizationId: config?.organizationId,
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
            borderColor: item.isUser ? theme.primaryColor : '#2F5D62',
          },
        ]}
      >
        {item.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2F5D62" />
            <Text style={[styles.loadingText, { color: theme.placeholderColor, fontSize: fontSizes.sm }]}>
              {t('chat.thinking')}
            </Text>
          </View>
        ) : (
          <Text
            style={[
              styles.messageText,
              { color: item.isUser ? '#FFFFFF' : theme.textColor, fontSize: fontSizes.base },
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
      <View style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
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
      placeholder={t('chat.placeholder')}
      sendDisabled={!inputText.trim() || isTyping}
      sendButtonContent={
        <Text
          style={[
            styles.sendButtonText,
            {
              color: inputText.trim() ? '#2F5D62' : theme.placeholderColor,
              fontSize: fontSizes.base,
            },
          ]}
        >
          {t('chat.send')}
        </Text>
      }
      backgroundColor={theme.backgroundColor}
      inputBackgroundColor={theme.surfaceColor}
      textColor={theme.textColor}
      borderColor={theme.borderColor}
      focusBorderColor="#2F5D62"
      placeholderColor={theme.placeholderColor}
      sendButtonColor={inputText.trim() ? '#2F5D62' : theme.borderColor}
      sendButtonTextColor={inputText.trim() ? '#2F5D62' : theme.placeholderColor}
    />
  );
};

const styles = StyleSheet.create({
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
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  skeletonMessagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 72,
  },
  skeletonMessageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
});
