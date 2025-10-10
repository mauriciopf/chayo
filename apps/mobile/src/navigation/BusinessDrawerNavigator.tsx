import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppConfig } from '../hooks/useAppConfig';
import { useThemedStyles } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/Feather';

// Import screens
import { ChatScreen } from '../screens/ChatScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AppointmentsScreen } from '../screens/AppointmentsScreen';
import { PaymentsScreen } from '../screens/PaymentsScreen';
import { FAQsScreen } from '../screens/FAQsScreen';
import { ProductsScreen } from '../screens/ProductsScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { DocumentDetailScreen } from '../screens/DocumentDetailScreen';
import { FormDetailScreen } from '../screens/FormDetailScreen';
import { AppointmentTimeSelectionScreen } from '../screens/AppointmentTimeSelectionScreen';
import { AppointmentBookingScreen } from '../screens/AppointmentBookingScreen';
import { UnifiedDocumentsSection } from '../components/UnifiedDocumentsSection';
import { CustomerSupportScreen } from '../screens/CustomerSupportScreen';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

interface BusinessDrawerNavigatorProps {
  businessName: string;
  onBackToMarketplace: () => void;
}

// Custom header component with hamburger menu
function CustomDrawerHeader({ navigation, title, onBackToMarketplace }: any) {
  const { theme, fontSizes } = useThemedStyles();

  return (
    <View style={[styles.header, { backgroundColor: theme.backgroundColor, borderBottomColor: theme.borderColor }]}>
      {/* Back button */}
      <TouchableOpacity onPress={onBackToMarketplace} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Icon name="arrow-left" size={24} color={theme.textColor} />
      </TouchableOpacity>

      {/* Title */}
      <Text style={[styles.headerTitle, { color: theme.textColor, fontSize: fontSizes.xl }]} numberOfLines={1}>
        {title}
      </Text>

      {/* Hamburger menu button */}
      <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.hamburgerButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Icon name="menu" size={24} color={theme.textColor} />
      </TouchableOpacity>
    </View>
  );
}

// Tool configuration with icons
interface ToolConfig {
  name: string;
  label: string;
  icon: string;
  component: React.ComponentType<any>;
  systemName?: string; // For mapping to enabledTools array
}

const toolConfigs: ToolConfig[] = [
  { name: 'Chat', label: 'Chat', icon: 'message-circle', component: ChatScreen, systemName: 'chat' },
  { name: 'Products', label: 'Productos', icon: 'shopping-bag', component: ProductsScreen, systemName: 'products' },
  { name: 'Appointments', label: 'Citas', icon: 'calendar', component: AppointmentsScreen, systemName: 'appointments' },
  { name: 'Documents', label: 'Documentos', icon: 'file-text', component: UnifiedDocumentsSection, systemName: 'documents_unified' },
  { name: 'FAQs', label: 'Preguntas', icon: 'help-circle', component: FAQsScreen, systemName: 'faqs' },
  { name: 'Payments', label: 'Pagos', icon: 'credit-card', component: PaymentsScreen, systemName: 'payments' },
  { name: 'CustomerSupport', label: 'Soporte', icon: 'headphones', component: CustomerSupportScreen, systemName: 'customer_support' },
];

// Custom drawer content
function CustomDrawerContent(props: any) {
  const { theme, fontSizes } = useThemedStyles();
  const { user } = useAuth();

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContent}
      style={{ backgroundColor: theme.backgroundColor }}
    >
      {/* Header with user info */}
      <View style={[styles.drawerHeader, { borderBottomColor: theme.borderColor }]}>
        <View style={[styles.avatarCircle, { backgroundColor: theme.primaryColor }]}>
          <Text style={[styles.avatarText, { fontSize: fontSizes.xl }]}>
            {user?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={[styles.userName, { color: theme.textColor, fontSize: fontSizes.lg }]}>
          {user?.fullName || user?.email?.split('@')[0] || 'Usuario'}
        </Text>
        <Text style={[styles.userEmail, { color: theme.placeholderColor, fontSize: fontSizes.sm }]}>
          {user?.email || ''}
        </Text>
      </View>

      {/* Drawer items */}
      <View style={styles.drawerItems}>
        <DrawerItemList {...props} />
      </View>
    </DrawerContentScrollView>
  );
}

// Stack navigator for each tool (to handle detail screens)
function ChatStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatMain" component={ChatScreen} />
    </Stack.Navigator>
  );
}

function ProductsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductsMain" component={ProductsScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  );
}

function AppointmentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AppointmentsMain" component={AppointmentsScreen} />
      <Stack.Screen name="AppointmentTimeSelection" component={AppointmentTimeSelectionScreen} />
      <Stack.Screen name="AppointmentBooking" component={AppointmentBookingScreen} />
    </Stack.Navigator>
  );
}

function DocumentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DocumentsMain" component={UnifiedDocumentsSection} />
      <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} />
      <Stack.Screen name="FormDetail" component={FormDetailScreen} />
    </Stack.Navigator>
  );
}

function FAQsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FAQsMain" component={FAQsScreen} />
    </Stack.Navigator>
  );
}

function PaymentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PaymentsMain" component={PaymentsScreen} />
    </Stack.Navigator>
  );
}

function CustomerSupportStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerSupportMain" component={CustomerSupportScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// Map tool to stack component
const getToolStack = (toolName: string) => {
  const stackMap: Record<string, React.ComponentType<any>> = {
    Chat: ChatStack,
    Products: ProductsStack,
    Appointments: AppointmentsStack,
    Documents: DocumentsStack,
    FAQs: FAQsStack,
    Payments: PaymentsStack,
    CustomerSupport: CustomerSupportStack,
    Profile: ProfileStack,
  };
  return stackMap[toolName] || ChatStack;
};

export default function BusinessDrawerNavigator({ businessName, onBackToMarketplace }: BusinessDrawerNavigatorProps) {
  const { config } = useAppConfig();
  const { theme, fontSizes } = useThemedStyles();

  // Filter enabled tools based on config
  const enabledTools = config?.enabledTools || [];

  // Always show Chat first, then enabled tools, Profile always last
  const availableTools = toolConfigs.filter(tool => {
    // Chat is always first
    if (tool.systemName === 'chat') {return true;}

    // Profile is handled separately (always at the end)
    if (tool.name === 'Profile') {return false;}

    // Check if tool is enabled
    if (tool.systemName === 'documents_unified') {
      return enabledTools.includes('documents') || enabledTools.includes('intake_forms');
    }

    return enabledTools.includes(tool.systemName || tool.name.toLowerCase());
  });

  // Ensure Chat is first
  const sortedTools = [
    availableTools.find(t => t.systemName === 'chat')!,
    ...availableTools.filter(t => t.systemName !== 'chat'),
  ].filter(Boolean);

  return (
    <Drawer.Navigator
      initialRouteName="Chat"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        header: () => (
          <CustomDrawerHeader
            navigation={navigation}
            title={businessName}
            onBackToMarketplace={onBackToMarketplace}
          />
        ),
        drawerActiveBackgroundColor: `${theme.primaryColor}20`,
        drawerActiveTintColor: theme.primaryColor,
        drawerInactiveTintColor: theme.placeholderColor,
        drawerLabelStyle: {
          fontSize: fontSizes.base,
          fontWeight: '500',
        },
        drawerItemStyle: {
          borderRadius: 8,
          marginHorizontal: 8,
          marginVertical: 2,
        },
        drawerStyle: {
          backgroundColor: theme.backgroundColor,
          width: 280,
        },
      })}
    >
      {sortedTools.map(tool => {
        const StackComponent = getToolStack(tool.name);
        return (
          <Drawer.Screen
            key={tool.name}
            name={tool.name}
            component={StackComponent}
            options={{
              drawerLabel: tool.label,
              drawerIcon: ({ color, size }) => (
                <Icon name={tool.icon} size={size} color={color} />
              ),
            }}
          />
        );
      })}

      {/* Profile is always last */}
      <Drawer.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          drawerLabel: 'Perfil',
          drawerIcon: ({ color, size }) => (
            <Icon name="user" size={size} color={color} />
          ),
          drawerItemStyle: {
            marginTop: 'auto', // Push to bottom
          },
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontWeight: '700',
    textAlign: 'center',
  },
  hamburgerButton: {
    padding: 8,
    marginLeft: 8,
  },
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  userName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
  },
  drawerItems: {
    flex: 1,
    paddingTop: 8,
  },
});

