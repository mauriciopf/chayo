import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationConfigGenerator } from '@chayo/config';
import { useAppConfig } from '../hooks/useAppConfig';
import { ChatScreen } from '../screens/ChatScreen';
import { AppointmentsScreen } from '../screens/AppointmentsScreen';
import { PaymentsScreen } from '../screens/PaymentsScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { FAQsScreen } from '../screens/FAQsScreen';
import { WhatsAppScreen } from '../screens/WhatsAppScreen';

const Tab = createBottomTabNavigator();

// Icon mapping for tab icons (you can replace with actual icons later)
const getTabIcon = (iconName: string) => {
  const iconMap: Record<string, string> = {
    'message-circle': '💬',
    'calendar': '📅',
    'credit-card': '💳',
    'file-text': '📄',
    'help-circle': '❓',
    'message-square': '📱',
  };
  return iconMap[iconName] || '📱';
};

// Tool-specific screen mapping
const getToolScreen = (toolName: string) => {
  const screenMap = {
    'Appointments': AppointmentsScreen,
    'Payments': PaymentsScreen,
    'Documents': DocumentsScreen,
    'FAQs': FAQsScreen,
    'WhatsApp': WhatsAppScreen,
  };
  return screenMap[toolName as keyof typeof screenMap];
};

const LoadingScreen = () => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.loadingText}>
      Cargando configuración...
    </Text>
  </View>
);

const ErrorScreen = ({ error }: { error: string }) => (
  <View style={styles.centerContainer}>
    <Text style={styles.errorTitle}>
      Error de Configuración
    </Text>
    <Text style={styles.errorText}>
      {error}
    </Text>
  </View>
);

export const AppNavigator = () => {
  const { config, urlGenerator, loading, error } = useAppConfig();

  if (loading) {
    return (
      <NavigationContainer>
        <Tab.Navigator screenOptions={{ headerShown: false }}>
          <Tab.Screen name="Loading" component={LoadingScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    );
  }

  if (error || !config || !urlGenerator) {
    return (
      <NavigationContainer>
        <Tab.Navigator screenOptions={{ headerShown: false }}>
          <Tab.Screen 
            name="Error" 
            component={() => <ErrorScreen error={error || 'Configuration not available'} />}
          />
        </Tab.Navigator>
      </NavigationContainer>
    );
  }

  // Generate navigation configuration
  const navigationGenerator = new NavigationConfigGenerator(config, urlGenerator);
  const tabs = navigationGenerator.getEnabledTabs();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: config.theme.primaryColor,
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E0E0E0',
            borderTopWidth: 1,
          },
        }}
      >
        {tabs.map((tab) => {
          let ScreenComponent;
          
          if (tab.component === 'native-chat') {
            ScreenComponent = ChatScreen;
          } else {
            // For WebView screens, get the specific tool screen
            ScreenComponent = getToolScreen(tab.name) || View;
          }

          return (
            <Tab.Screen
              key={tab.name}
              name={tab.name}
              component={ScreenComponent}
              options={{
                tabBarLabel: tab.label,
                tabBarIcon: ({ focused, color, size }) => (
                  <Text style={{ fontSize: size, color }}>
                    {getTabIcon(tab.icon)}
                  </Text>
                ),
              }}
            />
          );
        })}
      </Tab.Navigator>
    </NavigationContainer>
  );
};

// Export as default to maintain compatibility
export default AppNavigator;

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorTitle: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});