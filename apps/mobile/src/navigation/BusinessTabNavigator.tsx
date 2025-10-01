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
import { DocumentDetailScreen } from '../screens/DocumentDetailScreen';
import { FormDetailScreen } from '../screens/FormDetailScreen';
import { AppointmentTimeSelectionScreen } from '../screens/AppointmentTimeSelectionScreen';
import { AppointmentBookingScreen } from '../screens/AppointmentBookingScreen';
import { HubScreen } from '../screens/HubScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import Icon from 'react-native-vector-icons/Feather';

const Tab = createBottomTabNavigator();
const HubStack = createNativeStackNavigator();

interface BusinessTabNavigatorProps {
  businessName: string;
  onBackToMarketplace: () => void;
}

// Icon mapping for tab icons - Feather outline icons
const getTabIconName = (iconName: string) => {
  const iconMap: Record<string, string> = {
    'message-circle': 'message-circle',
    'grid': 'grid',
    'user': 'user',
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

// Tool screen mapping - keep original logic for dynamic tools
const getToolScreen = (tool: string) => {
  const screenMap: Record<string, React.ComponentType<any>> = {
    chat: ChatScreen,
    hub: HubStackNavigator, // Hub with inner navigation
    profile: ProfileScreen, // Profile screen
    appointments: AppointmentsScreen,
    payments: PaymentsScreen,
    documents: DocumentsScreen,
    faqs: FAQsScreen,
    intake_forms: IntakeFormsScreen,
    products: ProductsScreen,
  };
  return screenMap[tool] || ChatScreen;
};

// Hub Stack Navigator - handles inner navigation for ALL tools
function HubStackNavigator({ businessName, onBackToMarketplace, enabledTools }: { businessName: string; onBackToMarketplace: () => void; enabledTools: string[] }) {
  return (
    <HubStack.Navigator screenOptions={{ headerShown: false }}>
      <HubStack.Screen name="HubMain">
        {() => (
          <HubScreen
            businessName={businessName}
            onBackToMarketplace={onBackToMarketplace}
            enabledTools={enabledTools}
          />
        )}
      </HubStack.Screen>

      {/* Universal Detail Screens - All tool detail screens */}
      <HubStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <HubStack.Screen name="DocumentDetail" component={DocumentDetailScreen} />
      <HubStack.Screen name="FormDetail" component={FormDetailScreen} />
      <HubStack.Screen name="AppointmentTimeSelection" component={AppointmentTimeSelectionScreen} />
      <HubStack.Screen name="AppointmentBooking" component={AppointmentBookingScreen} />
    </HubStack.Navigator>
  );
}

// Generate simplified tabs - Chat, Hub, and Profile
const generateTabs = (enabledTools: string[], businessName: string, onBackToMarketplace: () => void) => {
  return [
    { name: 'chat', label: 'Chat', icon: 'message-circle', businessName, onBackToMarketplace },
    { name: 'hub', label: 'Hub', icon: 'grid', businessName, onBackToMarketplace, enabledTools },
    { name: 'profile', label: 'Profile', icon: 'user', businessName, onBackToMarketplace },
  ];
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

  // Always show the tab navigator, even without config
  // Individual screens will handle their own loading states

  const tabs = generateTabs(config?.enabledTools || [], businessName, onBackToMarketplace);

  const renderTabIcon = ({ route, color, focused }: any) => {
    const tab = tabs.find(t => t.name === route.name);
    const iconName = getTabIconName(tab?.icon || 'circle');

    return (
      <Icon
        name={iconName}
        size={focused ? 26 : 24} // Slightly larger when active
        color={color}
        style={{
          textShadowColor: focused ? '#D4A574' : 'transparent', // Warm gold glow when active
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: focused ? 8 : 0,
        }}
      />
    );
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => renderTabIcon({ route, focused, color }),
        tabBarActiveTintColor: '#F4E4BC', // Warm cream for active icons
        tabBarInactiveTintColor: 'rgba(244, 228, 188, 0.5)', // Muted cream for inactive
        tabBarStyle: {
          backgroundColor: '#1A1A1A', // Deep charcoal background
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? 34 : 12,
          paddingTop: 12,
          paddingHorizontal: 20, // Add horizontal padding for organic feel
          height: Platform.OS === 'ios' ? 88 : 64, // Standard height without curves
          shadowColor: '#D4A574', // Warm gold shadow
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto', // Clean, readable font
          letterSpacing: 0.5, // Slightly spaced for elegance
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === 'ios' ? 2 : 0,
          marginBottom: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
          borderRadius: 16, // Organic pill shape for each tab item
          marginHorizontal: 2,
        },
        headerShown: false,
      })}
    >
      {tabs.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarLabel: tab.label,
          }}
        >
          {() => {
            const ScreenComponent = getToolScreen(tab.name);
            // Pass dynamic enabled tools to Hub stack navigator
            if (tab.name === 'hub') {
              return (
                <ScreenComponent
                  businessName={tab.businessName}
                  onBackToMarketplace={tab.onBackToMarketplace}
                  enabledTools={config?.enabledTools || []}
                />
              );
            }
            // For other screens, use default props
            return <ScreenComponent />;
          }}
        </Tab.Screen>
      ))}
    </Tab.Navigator>
  );
}

export default function BusinessTabNavigator({ businessName, onBackToMarketplace }: BusinessTabNavigatorProps) {
  return (
    <MainTabNavigator businessName={businessName} onBackToMarketplace={onBackToMarketplace} />
  );
}
