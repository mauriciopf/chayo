import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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
import { useKeyboardVisibility } from '../screens/BusinessDetailScreen';

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
  const keyboardContext = useKeyboardVisibility();
  const isKeyboardVisible = keyboardContext?.isKeyboardVisible || false;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
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
      <KeyboardAvoidingView
        style={[
          styles.container,
          { backgroundColor: theme.backgroundColor }
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
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

        {/* Input Container */}
        <View style={[styles.inputContainer, { backgroundColor: theme.backgroundColor, borderTopColor: theme.borderColor }]}>
          <TextInput
            ref={textInputRef}
            style={[
              styles.textInput,
              {
                backgroundColor: theme.surfaceColor,
                color: theme.textColor,
                borderColor: isInputFocused ? '#2F5D62' : theme.borderColor,
                borderWidth: isInputFocused ? 2 : 1,
                fontSize: fontSizes.base,
              },
            ]}
            value={inputText}
            onChangeText={setInputText}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={theme.placeholderColor}
            multiline
            maxLength={1000}
            returnKeyType="default"
            blurOnSubmit={false}
            enablesReturnKeyAutomatically={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: theme.surfaceColor,
                borderColor: inputText.trim() ? '#2F5D62' : theme.borderColor,
                borderWidth: 2,
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
                  color: inputText.trim() ? '#2F5D62' : theme.placeholderColor,
                  fontSize: fontSizes.base,
                },
              ]}
            >
              {t('chat.send')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.backgroundColor,
          paddingTop: isKeyboardVisible ? 0 : undefined, // Remove top padding when keyboard is visible to let SafeAreaView handle it
        }
      ]} 
      edges={isKeyboardVisible ? ['top'] : []} // Only apply safe area to top when keyboard visible
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? (isKeyboardVisible ? 0 : 90) : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={[
            styles.messagesContainer,
            { paddingTop: isKeyboardVisible ? 16 : 72 } // Space for tab bar when visible
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />

        {/* Input Container */}
        <View style={[styles.inputContainer, { backgroundColor: theme.backgroundColor, borderTopColor: theme.borderColor }]}>
          <TextInput
            ref={textInputRef}
            style={[
              styles.textInput,
              {
                backgroundColor: theme.surfaceColor,
                color: theme.textColor,
                borderColor: isInputFocused ? '#2F5D62' : theme.borderColor,
                borderWidth: isInputFocused ? 2 : 1,
                fontSize: fontSizes.base,
              },
            ]}
            value={inputText}
            onChangeText={setInputText}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={theme.placeholderColor}
            multiline
            maxLength={1000}
            returnKeyType="default"
            blurOnSubmit={false}
            enablesReturnKeyAutomatically={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: theme.surfaceColor,
                borderColor: inputText.trim() ? '#2F5D62' : theme.borderColor,
                borderWidth: 2,
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
                  color: inputText.trim() ? '#2F5D62' : theme.placeholderColor,
                  fontSize: fontSizes.base,
                },
              ]}
            >
            {t('chat.send')}
          </Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContainer: {
    paddingTop: 16, // Removed fixed padding - will be dynamic
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
