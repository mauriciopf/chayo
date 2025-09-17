import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useAppConfig } from '../hooks/useAppConfig';
import { useThemedStyles } from '../context/ThemeContext';
import { ChatScreen } from '../screens/ChatScreen';
import { AppointmentsScreen } from '../screens/AppointmentsScreen';
import { PaymentsScreen } from '../screens/PaymentsScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { FAQsScreen } from '../screens/FAQsScreen';
import { IntakeFormsScreen } from '../screens/IntakeFormsScreen';
import { ProductsScreen } from '../screens/ProductsScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import LoadingScreen from '../components/LoadingScreen';
import Icon from 'react-native-vector-icons/Feather';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

interface BusinessTabNavigatorProps {
  businessName: string;
  onBackToMarketplace: () => void;
}

// Icon mapping for tab icons - Feather outline icons
const getTabIconName = (iconName: string) => {
  const iconMap: Record<string, string> = {
    'message-circle': 'message-circle',
    'headphones': 'headphones',
    'calendar': 'calendar',
    'credit-card': 'credit-card',
    'file-text': 'file-text',
    'help-circle': 'help-circle',
    'clipboard': 'clipboard',
    'shopping-bag': 'shopping-bag',
  };
  return iconMap[iconName] || 'circle';
};

// Tool screen mapping
const getToolScreen = (tool: string) => {
  const screenMap: Record<string, React.ComponentType<any>> = {
    chat: ChatScreen,
    appointments: AppointmentsScreen,
    payments: PaymentsScreen,
    documents: DocumentsScreen,
    faqs: FAQsScreen,
    intake_forms: IntakeFormsScreen,
    products: ProductsScreen,
  };
  return screenMap[tool] || ChatScreen;
};

// Generate tabs based on enabled tools
const generateTabs = (enabledTools: string[], businessName: string, onBackToMarketplace: () => void) => {
  const toolConfigs = [
    { name: 'chat', label: 'Chat', icon: 'message-circle' },
    { name: 'products', label: 'Products', icon: 'shopping-bag' },
    { name: 'appointments', label: 'Appointments', icon: 'calendar' },
    { name: 'payments', label: 'Payments', icon: 'credit-card' },
    { name: 'documents', label: 'Documents', icon: 'file-text' },
    { name: 'faqs', label: 'FAQs', icon: 'help-circle' },
    { name: 'intake_forms', label: 'Forms', icon: 'clipboard' },
  ];

  // Always include chat, then filter other enabled tools
  const enabledToolsWithChat = ['chat', ...enabledTools];
  
  return toolConfigs
    .filter(tool => enabledToolsWithChat.includes(tool.name))
    .map(tool => ({
      ...tool,
      businessName,
      onBackToMarketplace,
    }));
};

function MainTabNavigator({ businessName, onBackToMarketplace }: BusinessTabNavigatorProps) {
  const { config } = useAppConfig();
  const { theme } = useThemedStyles();

  // Debug: Log actual theme values being used
  console.log('🎨 BusinessTabNavigator theme:', {
    secondaryColor: theme.secondaryColor,
    primaryColor: theme.primaryColor,
    backgroundColor: theme.backgroundColor,
  });

  if (!config) {
    return (
      <LoadingScreen />
    );
  }

  const tabs = generateTabs(config.enabledTools, businessName, onBackToMarketplace);

  const renderTabIcon = ({ route, color }: any) => {
    const tab = tabs.find(t => t.name === route.name);
    const iconName = getTabIconName(tab?.icon || 'circle');
    return <Icon name={iconName} size={24} color={color} />;
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => renderTabIcon({ route, focused, color }),
        tabBarActiveTintColor: theme.primaryColor,
        tabBarInactiveTintColor: theme.textColor + '60',
        tabBarStyle: {
          backgroundColor: theme.secondaryColor,
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? 34 : 8, // Proper safe area
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 60, // Standard tab bar height
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: -2, // Bring labels closer to icons
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === 'ios' ? 4 : 0, // Adjust icon position
        },
        headerShown: false,
      })}
    >
      {tabs.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={getToolScreen(tab.name)}
          options={{
            title: tab.label,
            tabBarLabel: tab.label,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function BusinessTabNavigator({ businessName, onBackToMarketplace }: BusinessTabNavigatorProps) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main">
        {() => <MainTabNavigator businessName={businessName} onBackToMarketplace={onBackToMarketplace} />}
      </Stack.Screen>
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  );
}
