import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { thinkingMessageService, ThinkingContext, OnboardingProgressData } from '../services/ThinkingMessageService';
import { useTranslation } from '../hooks/useTranslation';
import { useThemedStyles } from '../context/ThemeContext';

interface ThinkingMessageProps {
  context?: ThinkingContext;
  instanceId?: string;
  onboardingProgress?: OnboardingProgressData;
  organizationId?: string;
  visible?: boolean;
  style?: any;
}

export const ThinkingMessage: React.FC<ThinkingMessageProps> = ({
  context = 'default',
  instanceId = 'default',
  onboardingProgress,
  organizationId,
  visible = true,
  style,
}) => {
  const { t } = useTranslation();
  const { fontSizes } = useThemedStyles();
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [messageIndex, setMessageIndex] = useState<number>(0);
  const [totalMessages, setTotalMessages] = useState<number>(0);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;

    // Create or get existing message stream
    const messageStream = thinkingMessageService.getOrCreateMessageStream(
      context,
      instanceId,
      onboardingProgress,
      organizationId
    );

    // Set up message change callback
    messageStream.onMessageChange((message, index, total) => {
      setCurrentMessage(message);
      setMessageIndex(index);
      setTotalMessages(total);
      
      // Animate message change
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Start the message stream
    messageStream.start();

    // Initial fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Cleanup on unmount
    return () => {
      messageStream.stop();
      thinkingMessageService.cleanup(instanceId);
    };
  }, [context, instanceId, onboardingProgress, organizationId, visible, fadeAnim]);

  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.messageContainer}>
        <View style={styles.iconContainer}>
          <ActivityIndicator 
            size="small" 
            color="#8E8E93" 
            style={styles.spinner}
          />
        </View>
        
        <Animated.View 
          style={[
            styles.textContainer,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={[styles.messageText, { fontSize: fontSizes.base }]}>
            {currentMessage}
          </Text>
          
          {totalMessages > 1 && (
            <View style={styles.progressIndicator}>
              {Array.from({ length: totalMessages }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index === messageIndex && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2C2C2E',
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  spinner: {
    width: 16,
    height: 16,
  },
  textContainer: {
    flex: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  progressIndicator: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3A3A3C',
    marginRight: 4,
  },
  progressDotActive: {
    backgroundColor: '#2F5D62',
  },
});

export default ThinkingMessage;
