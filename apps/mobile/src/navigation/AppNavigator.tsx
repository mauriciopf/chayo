import React, { useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationConfigGenerator } from '@chayo/config';
import { useAppConfig } from '../hooks/useAppConfig';
import { useThemedStyles } from '../context/ThemeContext';
import { ChatScreen } from '../screens/ChatScreen';
import { AppointmentsScreen } from '../screens/AppointmentsScreen';
import { PaymentsScreen } from '../screens/PaymentsScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { FAQsScreen } from '../screens/FAQsScreen';
import { IntakeFormsScreen } from '../screens/IntakeFormsScreen';
import Icon from 'react-native-vector-icons/Feather';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Icon mapping for tab icons - Feather outline icons
const getTabIconName = (iconName: string) => {
  const iconMap: Record<string, string> = {
    'message-circle': 'message-circle', // Chat bubble outline
    'calendar': 'calendar', // Calendar outline
    'credit-card': 'credit-card', // Credit card outline
    'file-text': 'file-text', // Document outline
    'help-circle': 'help-circle', // Help circle outline
    'clipboard': 'clipboard', // Intake forms clipboard
  };
  return iconMap[iconName] || 'message-circle';
};

// Fallback screen component for unknown tools
const FallbackScreen = () => {
  const { themedStyles } = useThemedStyles();
  return (
    <View style={[styles.centerContainer, themedStyles.container]}>
      <Text style={[styles.errorText, themedStyles.secondaryText]}>Tool not implemented yet</Text>
    </View>
  );
};

// Tool-specific screen mapping
const getToolScreen = (toolName: string) => {
  const screenMap = {
    'Appointments': AppointmentsScreen,
    'Payments': PaymentsScreen,
    'Documents': DocumentsScreen,
    'FAQs': FAQsScreen,
    'Intake Forms': IntakeFormsScreen,
  };
  return screenMap[toolName as keyof typeof screenMap];
};

const LoadingScreen = () => {
  const { theme, themedStyles } = useThemedStyles();
  return (
    <View style={[styles.centerContainer, themedStyles.container]}>
      <ActivityIndicator size="large" color={theme.primaryColor} />
      <Text style={[styles.loadingText, themedStyles.primaryText]}>
        Loading configuration...
      </Text>
    </View>
  );
};

const ErrorScreen = ({ error }: { error: string }) => {
  const { theme, themedStyles } = useThemedStyles();
  return (
    <View style={[styles.centerContainer, themedStyles.container]}>
      <Text style={[styles.errorTitle, { color: theme.errorColor }]}>
        Configuration Error
      </Text>
      <Text style={[styles.errorText, themedStyles.secondaryText]}>
        {error}
      </Text>
    </View>
  );
};

// Create a proper component for the error screen to avoid inline functions
const ErrorScreenWrapper = () => {
  const { error } = useAppConfig();
  return <ErrorScreen error={error || 'Configuration not available'} />;
};

// Tab Icon Component
const TabIcon: React.FC<{ iconName: string; color: string; size: number }> = ({ iconName, color, size }) => (
  <Icon name={iconName} size={size} color={color} />
);

// Main Tab Navigator Component
const MainTabNavigator = () => {
  const { config, urlGenerator } = useAppConfig();
  const { theme } = useThemedStyles();

  // Create tab icon renderer
  const renderTabIcon = useCallback((iconName: string) => ({ focused: _focused, color, size }: any) => (
    <TabIcon iconName={iconName} color={color} size={size} />
  ), []);

  if (!config || !urlGenerator) {
    return <ErrorScreenWrapper />;
  }

  // Generate navigation configuration
  const navigationGenerator = new NavigationConfigGenerator(config, urlGenerator);
  const tabs = navigationGenerator.getEnabledTabs();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF', // Always white for active icons
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)', // White with opacity for inactive
        tabBarStyle: {
          backgroundColor: theme.secondaryColor, // Use secondary color for tab bar
          borderTopColor: 'transparent', // Remove border for cleaner look
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? 34 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: -2,
          color: '#FFFFFF', // Ensure labels are always white
        },
      }}
    >
      {tabs.map((tab) => {
        let ScreenComponent;

        if (tab.component === 'native-chat') {
          ScreenComponent = ChatScreen;
        } else {
          // For WebView screens, get the specific tool screen
          ScreenComponent = getToolScreen(tab.name) || FallbackScreen;
        }

        return (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={ScreenComponent}
            options={{
              tabBarLabel: tab.label,
              tabBarIcon: renderTabIcon(getTabIconName(tab.icon)),
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { loading, error } = useAppConfig();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {loading ? (
          <Stack.Screen name="Loading" component={LoadingScreen} />
        ) : error ? (
          <Stack.Screen name="Error" component={ErrorScreenWrapper} />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
});
