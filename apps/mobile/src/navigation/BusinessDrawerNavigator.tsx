import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useAppConfig } from '../hooks/useAppConfig';
import { useThemedStyles } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/Feather';
import { DrawerHeader } from '../components/DrawerHeader';
import { useKeyboardVisibility } from '../screens/BusinessDetailScreen';

// Main screen header component (with hamburger menu for drawer)
interface MainScreenHeaderProps {
  navigation: any;
  title: string;
}

function MainScreenHeader({ navigation, title }: MainScreenHeaderProps) {
  const { theme, fontSizes } = useThemedStyles();
  const defaultHeaderOpacity = React.useRef(new Animated.Value(1));
  const defaultHeaderTranslateY = React.useRef(new Animated.Value(0));
  const keyboardContext = useKeyboardVisibility();
  const headerOpacity = keyboardContext?.headerOpacity || defaultHeaderOpacity.current;
  const headerTranslateY = keyboardContext?.headerTranslateY || defaultHeaderTranslateY.current;
  const isKeyboardVisible = keyboardContext?.isKeyboardVisible || false;
  const setHeaderHeight = keyboardContext?.setHeaderHeight;

  const handleLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (setHeaderHeight) {
      // Add tab bar height (56px) to the main header height
      setHeaderHeight(height + 56);
    }
  };

  return (
    <Animated.View 
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 54,
        paddingBottom: 16,
        backgroundColor: theme.backgroundColor,
        borderBottomWidth: 1,
        borderBottomColor: theme.borderColor,
        opacity: headerOpacity,
        transform: [{ translateY: headerTranslateY }],
      }}
      onLayout={handleLayout}
    >
      <TouchableOpacity
        onPress={() => navigation.openDrawer()}
        style={{ padding: 8, marginRight: 12 }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        disabled={isKeyboardVisible}
      >
        <Icon name="menu" size={24} color={theme.textColor} />
      </TouchableOpacity>
      <Text style={{
        fontWeight: '700',
        flex: 1,
        color: theme.textColor,
        fontSize: fontSizes.xl,
      }}>
        {title}
      </Text>
    </Animated.View>
  );
}

// Nested screen header component (for detail screens with back button)
interface NestedScreenHeaderProps {
  navigation: any;
  title: string;
}

function NestedScreenHeader({ navigation, title }: NestedScreenHeaderProps) {
  const { theme, fontSizes } = useThemedStyles();
  
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 54,
      paddingBottom: 16,
      backgroundColor: theme.backgroundColor,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    }}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ padding: 8, marginRight: 12 }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="arrow-left" size={24} color={theme.textColor} />
      </TouchableOpacity>
      <Text style={{
        fontWeight: '700',
        flex: 1,
        color: theme.textColor,
        fontSize: fontSizes.xl,
      }}>
        {title}
      </Text>
    </View>
  );
}

// Import screens
import { ChatScreen } from '../screens/ChatScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PaymentsScreen } from '../screens/PaymentsScreen';
import { FAQsScreen } from '../screens/FAQsScreen';
import { ProductsScreen } from '../screens/ProductsScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { DocumentDetailScreen } from '../screens/DocumentDetailScreen';
import { FormDetailScreen } from '../screens/FormDetailScreen';
import { UnifiedDocumentsSection } from '../components/UnifiedDocumentsSection';
import { CustomerSupportScreen } from '../screens/CustomerSupportScreen';
import { ReservationsScreen } from '../screens/ReservationsScreen';
import { ReservationCalendarScreen } from '../screens/ReservationCalendarScreen';
import { ReservationTimeSelectionScreen } from '../screens/ReservationTimeSelectionScreen';
import { ReservationBookingScreen } from '../screens/ReservationBookingScreen';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

interface BusinessDrawerNavigatorProps {
  businessName: string;
  onBackToMarketplace: () => void;
}

// Helper function to map route names to display titles
const getHeaderTitle = (routeName: string | undefined, businessName: string): string => {
  if (!routeName || routeName === 'Chat') {
    return businessName; // Chat shows business name
  }

  const titleMap: Record<string, string> = {
    'Products': 'Productos',
    'Reservations': 'Reservaciones',
    'Documents': 'Documentos',
    'FAQs': 'Preguntas Frecuentes',
    'Payments': 'Pagos',
    'CustomerSupport': 'Soporte al Cliente',
    'Profile': 'Perfil',
  };

  return titleMap[routeName] || businessName;
};

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
  { name: 'Reservations', label: 'Reservaciones', icon: 'calendar', component: ReservationsScreen, systemName: 'reservations' },
  { name: 'Documents', label: 'Documentos', icon: 'file-text', component: UnifiedDocumentsSection, systemName: 'documents_unified' },
  { name: 'FAQs', label: 'Preguntas', icon: 'help-circle', component: FAQsScreen, systemName: 'faqs' },
  { name: 'Payments', label: 'Pagos', icon: 'credit-card', component: PaymentsScreen, systemName: 'payments' },
  { name: 'CustomerSupport', label: 'Soporte', icon: 'headphones', component: CustomerSupportScreen, systemName: 'customer_support' },
];

// Custom drawer content
function CustomDrawerContent(props: any) {
  const { theme, fontSizes } = useThemedStyles();
  const { user } = useAuth();
  const { onBackToMarketplace } = props;

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

      {/* Back to Marketplace button */}
      <TouchableOpacity
        style={[styles.backToMarketplaceButton, { borderBottomColor: theme.borderColor }]}
        onPress={onBackToMarketplace}
      >
        <Icon name="arrow-left" size={20} color={theme.primaryColor} />
        <Text style={[styles.backToMarketplaceText, { color: theme.primaryColor, fontSize: fontSizes.base }]}>
          Volver al Marketplace
        </Text>
      </TouchableOpacity>

      {/* Drawer items */}
      <View style={styles.drawerItems}>
        <DrawerItemList {...props} />
      </View>
    </DrawerContentScrollView>
  );
}

// Stack navigator for each tool (to handle detail screens)
function ChatStack({ businessName }: { businessName: string }) {
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: '#1A1A1A' },
      }}
    >
      <Stack.Screen 
        name="ChatMain" 
        component={ChatScreen}
        options={{
          headerShown: true,
          header: ({ navigation }) => <MainScreenHeader navigation={navigation} title={businessName} />,
        }}
      />
    </Stack.Navigator>
  );
}

function ProductsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProductsMain" 
        component={ProductsScreen}
        options={{
          headerShown: true,
          header: ({ navigation }) => <MainScreenHeader navigation={navigation} title="Productos" />,
        }}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
        options={{
          headerShown: true,
          header: ({ navigation }) => <NestedScreenHeader navigation={navigation} title="Detalle del Producto" />,
        }}
      />
      <Stack.Screen 
        name="ReservationCalendar" 
        component={ReservationCalendarScreen}
        options={{
          headerShown: true,
          header: ({ navigation }) => <NestedScreenHeader navigation={navigation} title="Seleccionar Fecha" />,
        }}
      />
      <Stack.Screen 
        name="ReservationTimeSelection" 
        component={ReservationTimeSelectionScreen}
        options={{
          headerShown: true,
          header: ({ navigation }) => <NestedScreenHeader navigation={navigation} title="Seleccionar Hora" />,
        }}
      />
      <Stack.Screen 
        name="ReservationBooking" 
        component={ReservationBookingScreen}
        options={{
          headerShown: true,
          header: ({ navigation }) => <NestedScreenHeader navigation={navigation} title="Confirmar Reservación" />,
        }}
      />
    </Stack.Navigator>
  );
}

function ReservationsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ReservationsMain" 
        component={ReservationsScreen}
        options={{
          headerShown: true,
          header: ({ navigation }) => <MainScreenHeader navigation={navigation} title="Reservaciones" />,
        }}
      />
    </Stack.Navigator>
  );
}

function DocumentsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="DocumentsMain" 
        component={UnifiedDocumentsSection}
        options={{
          headerShown: true,
          header: ({ navigation }) => <MainScreenHeader navigation={navigation} title="Documentos" />,
        }}
      />
      <Stack.Screen 
        name="DocumentDetail" 
        component={DocumentDetailScreen}
        options={{
          headerShown: true,
          header: ({ navigation }) => <NestedScreenHeader navigation={navigation} title="Detalle del Documento" />,
        }}
      />
      <Stack.Screen 
        name="FormDetail" 
        component={FormDetailScreen}
        options={{
          headerShown: true,
          header: ({ navigation }) => <NestedScreenHeader navigation={navigation} title="Formulario" />,
        }}
      />
    </Stack.Navigator>
  );
}

function FAQsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="FAQsMain" 
        component={FAQsScreen}
        options={{
          headerShown: true,
          header: ({ navigation }) => <MainScreenHeader navigation={navigation} title="Preguntas Frecuentes" />,
        }}
      />
    </Stack.Navigator>
  );
}

function PaymentsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="PaymentsMain" 
        component={PaymentsScreen}
        options={{
          headerShown: true,
          header: ({ navigation }) => <MainScreenHeader navigation={navigation} title="Pagos" />,
        }}
      />
    </Stack.Navigator>
  );
}

function CustomerSupportStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="CustomerSupportMain" 
        component={CustomerSupportScreen}
        options={{
          headerShown: true,
          header: ({ navigation }) => <MainScreenHeader navigation={navigation} title="Soporte al Cliente" />,
        }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{
          headerShown: true,
          header: ({ navigation }) => <MainScreenHeader navigation={navigation} title="Perfil" />,
        }}
      />
    </Stack.Navigator>
  );
}

// Map tool to stack component
const getToolStack = (toolName: string) => {
  const stackMap: Record<string, React.ComponentType<any>> = {
    Chat: ChatStack,
    Products: ProductsStack,
    Reservations: ReservationsStack,
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

  // Create a wrapper for ChatStack with businessName
  const ChatStackWithProps = React.useMemo(
    () => (props: any) => <ChatStack {...props} businessName={businessName} />,
    [businessName]
  );

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

  // Memoize screen options to avoid recreating on every render
  const screenOptions = React.useMemo(() => ({ navigation, route }: any) => ({
    headerShown: false, // Hide drawer header - each stack will manage its own header
    drawerActiveBackgroundColor: `${theme.primaryColor}20`,
    drawerActiveTintColor: theme.primaryColor,
    drawerInactiveTintColor: theme.placeholderColor,
    drawerLabelStyle: {
      fontSize: fontSizes.base,
      fontWeight: '500' as const,
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
  }), [theme, fontSizes]);

  return (
    <Drawer.Navigator
      initialRouteName="Chat"
      drawerContent={(props) => <CustomDrawerContent {...props} onBackToMarketplace={onBackToMarketplace} />}
      screenOptions={screenOptions}
    >
      {sortedTools.map(tool => {
        const StackComponent = tool.name === 'Chat' ? ChatStackWithProps : getToolStack(tool.name);
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
            marginTop: 'auto',
          },
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
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
  backToMarketplaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 12,
  },
  backToMarketplaceText: {
    fontWeight: '600',
  },
});


