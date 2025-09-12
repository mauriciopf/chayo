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
  KeyboardAvoidingView,
} from 'react-native';
import { useSlugValidation } from '../hooks/useSlugValidation';
import { ThinkingMessage } from '../components/ThinkingMessage';
import { StorageService } from '../services/StorageService';
import { useTranslation } from '../hooks/useTranslation';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
  isError?: boolean;
}

interface OnboardingChatScreenProps {
  onSlugValidated: (organizationId: string) => void;
}

export const OnboardingChatScreen: React.FC<OnboardingChatScreenProps> = ({
  onSlugValidated,
}) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentStep, setCurrentStep] = useState<'welcome' | 'awaiting_code' | 'validating' | 'success'>('welcome');
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);

  const { isValidating, validateSlug } = useSlugValidation(organizationId || undefined);

  // Load organization ID on mount
  useEffect(() => {
    const loadOrganizationId = async () => {
      const storedOrgId = await StorageService.getOrganizationId();
      if (storedOrgId) {
        setOrganizationId(storedOrgId);
      }
    };
    loadOrganizationId();
  }, []);

  // Welcome flow
  useEffect(() => {
    const initializeChat = async () => {
      // Welcome message
      const welcomeMessage: Message = {
        id: 'welcome-1',
        text: '¡Hola! 👋 Soy tu asistente de Chayo AI.',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages([welcomeMessage]);

      // Second message
      const codeRequestMessage: Message = {
        id: 'welcome-2',
        text: 'Para comenzar, necesito que compartas el código de tu negocio. ¿Podrías escribirlo aquí? 🏢',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages([welcomeMessage, codeRequestMessage]);
      setCurrentStep('awaiting_code');

      // Note: User can tap input to enter business code when ready
    };

    initializeChat();
  }, []);



  const sendMessage = async () => {
    if (!inputText.trim() || isValidating) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputText.trim();
    setInputText('');

    if (currentStep === 'awaiting_code') {
      setCurrentStep('validating');

      // Generate consistent session ID
      const sessionId = `slug-validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setCurrentSessionId(sessionId);

      try {
        // Use our hook to handle all slug validation logic
        const result = await validateSlug(messageText, sessionId, organizationId || undefined);

      if (!result.isBusinessSlug) {
        // Clear session ID and hide thinking message
        setCurrentSessionId(null);

        // Conversational response
        const conversationalMessage: Message = {
          id: `conversation-${Date.now()}`,
          text: result.suggestedResponse || 'Por favor, escribe el código de tu negocio.',
          isUser: false,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, conversationalMessage]);
        setCurrentStep('awaiting_code');
        textInputRef.current?.focus();
        return;
      }

      // Business slug detected and validated
      if (result.validationResult?.isValid && result.validationResult.organizationId) {
        // Clear session ID and hide thinking message
        setCurrentSessionId(null);

        // Success message
        const successMessage: Message = {
          id: `success-${Date.now()}`,
          text: `¡Perfecto! 🎉 Conectando con ${result.validationResult.businessName}...`,
          isUser: false,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, successMessage]);
        setCurrentStep('success');

        // Update local organizationId state
        if (result.validationResult.organizationId) {
          setOrganizationId(result.validationResult.organizationId);
        }

        // Transition to main app (organizationId already saved by hook)
        onSlugValidated(result.validationResult.organizationId);
      } else {
        // Clear session ID and hide thinking message
        setCurrentSessionId(null);

        // Validation failed
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          text: result.validationResult?.error || 'Código inválido. ¿Podrías intentar de nuevo?',
          isUser: false,
          timestamp: new Date(),
          isError: true,
        };

        setMessages(prev => [...prev, errorMessage]);
        setCurrentStep('awaiting_code');
        textInputRef.current?.focus();
      }
      } catch (error) {
        // Clear session ID and hide thinking message on error
        setCurrentSessionId(null);

        console.error('Validation error:', error);
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          text: 'Hubo un problema inesperado. ¿Podrías intentar de nuevo?',
          isUser: false,
          timestamp: new Date(),
          isError: true,
        };

        setMessages(prev => [...prev, errorMessage]);
        setCurrentStep('awaiting_code');
        textInputRef.current?.focus();
      }
    }
  };

  // Cleanup thinking streams on unmount or when sessionId changes
  useEffect(() => {
    return () => {
      // Clear any active session when component unmounts
      if (currentSessionId) {
        setCurrentSessionId(null);
      }
    };
  }, [currentSessionId]);

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isLoading) {
      // This is now handled by ThinkingMessage component
      return null;
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
            item.isUser ? styles.userBubble : styles.assistantBubble,
            item.isError && styles.errorBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              item.isUser ? styles.userMessageText : styles.assistantMessageText,
              item.isError && styles.errorMessageText,
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

  const isInputDisabled = currentStep === 'validating' || currentStep === 'success' || isValidating;
  const placeholder = currentStep === 'awaiting_code'
    ? 'Escribe tu código de 6 dígitos...'
    : 'Escribe tu mensaje...';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chayo AI</Text>
          <Text style={styles.headerSubtitle}>Configuración inicial</Text>
        </View>

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

        {/* Show ThinkingMessage during validation */}
        {currentStep === 'validating' && currentSessionId && (
          <ThinkingMessage
            context="slug_validation"
            instanceId={currentSessionId}
            organizationId={organizationId || undefined}
            visible={true}
            style={styles.thinkingMessageContainer}
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            ref={textInputRef}
            style={[styles.textInput, isInputDisabled && styles.textInputDisabled]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={placeholder}
            placeholderTextColor="#8E8E93"
            multiline={false}
            maxLength={100}
            editable={!isInputDisabled}
            keyboardAppearance="dark"
            blurOnSubmit={false}
            returnKeyType="send"
            keyboardType={currentStep === 'awaiting_code' ? 'numeric' : 'default'}
            onSubmitEditing={sendMessage}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isInputDisabled) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isInputDisabled}
          >
            <Text style={styles.sendButtonText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // 🎨 ChatGPT-style Dark Theme (matching ChatScreen)
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
    backgroundColor: '#1C1C1E',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 2,
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
    backgroundColor: '#0A84FF',
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: '#2C2C2E',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  errorBubble: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF6B6B',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantMessageText: {
    color: '#FFFFFF',
  },
  errorMessageText: {
    color: '#FFFFFF',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1C1C1E',
    borderTopWidth: 1,
    borderTopColor: '#3A3A3C',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#3A3A3C',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    marginRight: 12,
    backgroundColor: '#2C2C2E',
    color: '#FFFFFF',
    textAlignVertical: 'center',
  },
  textInputDisabled: {
    opacity: 0.6,
  },
  sendButton: {
    backgroundColor: '#0A84FF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0A84FF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#3A3A3C',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  thinkingMessageContainer: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
});
