import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useAppConfig } from '../hooks/useAppConfig';
import { useThemedStyles } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

export const ChatScreen: React.FC = () => {
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

  // Auto-focus input when screen loads and keep keyboard open
  useEffect(() => {
    const timer = setTimeout(() => {
      textInputRef.current?.focus();
    }, 500); // Small delay to ensure screen is fully loaded

    return () => clearTimeout(timer);
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim() || !config) return;

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

      Alert.alert(
        t('common.error'),
        t('errors.networkError'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsTyping(false);
      // Refocus input after response or error
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isLoading) {
      return (
        <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
          <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: theme.surfaceColor, borderColor: theme.borderColor }]}>
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color={theme.placeholderColor} />
              <Text style={[styles.typingText, { color: theme.placeholderColor }]}>{t('chat.typing')}</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          item.isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            item.isUser 
              ? [styles.userBubble, { backgroundColor: theme.primaryColor }]
              : [styles.assistantBubble, { backgroundColor: theme.surfaceColor, borderColor: theme.borderColor }],
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: theme.textColor },
              item.isUser ? styles.userMessageText : styles.assistantMessageText,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    // Auto-scroll when new messages are added
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  if (!config) {
    return (
      <SafeAreaView style={[styles.loadingContainer, themedStyles.container]}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
        <Text style={[styles.loadingText, themedStyles.primaryText]}>{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
            style={[styles.textInput, { backgroundColor: theme.surfaceColor, color: theme.textColor, borderColor: theme.borderColor }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={theme.placeholderColor}
            multiline
            maxLength={1000}
            editable={!isTyping}
            keyboardAppearance="dark"
            blurOnSubmit={false}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() ? theme.primaryColor : theme.borderColor },
              (!inputText.trim() || isTyping) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isTyping}
          >
            <Text style={styles.sendButtonText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // 🎨 ChatGPT-style Dark Theme
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 20,
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 8,
    maxWidth: '85%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  assistantMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    borderBottomLeftRadius: 6,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  userMessageText: {
    color: '#FFFFFF', // Always white on user bubbles for contrast
  },
  assistantMessageText: {
    // Color will be set dynamically
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    marginLeft: 8,
    fontSize: 14,
    fontStyle: 'italic',
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
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});