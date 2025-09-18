import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppConfig } from '../hooks/useAppConfig';
import { useThemedStyles } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { TopTabBar } from '../components/TopTabBar';
import { AIChatContent } from '../components/AIChatContent';
import { CustomerSupportScreen } from './CustomerSupportScreen';

export const ChatScreen: React.FC = () => {
  const { config } = useAppConfig();
  const { themedStyles } = useThemedStyles();
  const { t } = useTranslation();

  // Build tabs based on enabled tools
  const tabs = [
    {
      key: 'ai-chat',
      title: t('chat.aiTab') || 'AI Chat',
      component: <AIChatContent />,
    },
  ];

  // Debug: Log enabled tools
  console.log('🔧 ChatScreen - Enabled tools:', config?.enabledTools);
  console.log('🔧 ChatScreen - Customer support enabled?', config?.enabledTools?.includes('customer_support'));

  // Only add Customer Support tab if it's enabled in the config
  // TEMPORARY: Always show for testing
  if (config?.enabledTools?.includes('customer_support') || true) {
    tabs.push({
      key: 'customer-support',
      title: t('chat.supportTab') || 'Customer Support',
      component: <CustomerSupportScreen />,
    });
  }

  return (
    <View style={[styles.container, themedStyles.container]}>
      <TopTabBar tabs={tabs} initialTab="ai-chat" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
