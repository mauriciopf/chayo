import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Keyboard,
  Platform,
  EmitterSubscription,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AppConfigProvider } from '../context/AppConfigContext';
import { NavigationProvider } from '../context/NavigationContext';
import { SmartHeader } from '../components/SmartHeader';
import { useThemedStyles } from '../context/ThemeContext';
import BusinessTabNavigator from '../navigation/BusinessTabNavigator';
import { supabase } from '../services/authService';

// Keyboard visibility context
const KeyboardVisibilityContext = createContext({
  isKeyboardVisible: false,
  headerOpacity: new Animated.Value(1),
  headerTranslateY: new Animated.Value(0),
});

export const useKeyboardVisibility = () => useContext(KeyboardVisibilityContext);

interface BusinessDetailScreenProps {
  organizationId: string;
}

interface OrganizationData {
  id: string;
  name: string;
  slug: string;
}

// Inner component that uses the navigation context
function BusinessDetailContent() {
  const route = useRoute();
  const navigation = useNavigation();
  const { fontSizes } = useThemedStyles();
  const { organizationId } = route.params as BusinessDetailScreenProps;
  const [_isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null);
  
  // Keyboard visibility state
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const headerOpacity = useState(new Animated.Value(1))[0];
  const headerTranslateY = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Load business configuration
    const loadBusinessConfig = async () => {
      try {
        setIsLoadingConfig(true);
        setConfigError(null);

        // Fetch organization data
        const { data: businessData, error } = await supabase
          .from('organizations')
          .select('id, name, slug')
          .eq('id', organizationId)
          .single();

        if (error || !businessData) {
          throw new Error('Business not found');
        }

        setOrganizationData(businessData);

        // Small delay to show the beautiful loading animation
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsLoadingConfig(false);
      } catch (error) {
        console.error('Error loading business config:', error);
        setConfigError('Unable to load business configuration');
        setIsLoadingConfig(false);
      }
    };

    loadBusinessConfig();
  }, [organizationId]);

  // Keyboard listeners
  useEffect(() => {
    let keyboardWillShowListener: EmitterSubscription;
    let keyboardWillHideListener: EmitterSubscription;
    let keyboardDidShowListener: EmitterSubscription;
    let keyboardDidHideListener: EmitterSubscription;

    const handleKeyboardShow = () => {
      // Delay state update to prevent immediate re-render that closes keyboard
      setTimeout(() => {
        setIsKeyboardVisible(true);
      }, 100);
      
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? 250 : 0,
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: -100,
          duration: Platform.OS === 'ios' ? 250 : 0,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const handleKeyboardHide = () => {
      setIsKeyboardVisible(false);
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: Platform.OS === 'ios' ? 250 : 0,
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? 250 : 0,
          useNativeDriver: true,
        }),
      ]).start();
    };

    if (Platform.OS === 'ios') {
      keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', handleKeyboardShow);
      keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', handleKeyboardHide);
    } else {
      keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', handleKeyboardShow);
      keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', handleKeyboardHide);
    }

    return () => {
      if (Platform.OS === 'ios') {
        keyboardWillShowListener?.remove();
        keyboardWillHideListener?.remove();
      } else {
        keyboardDidShowListener?.remove();
        keyboardDidHideListener?.remove();
      }
    };
  }, [headerOpacity, headerTranslateY]);

  const handleBackToMarketplace = () => {
    navigation.navigate('Marketplace');
  };

  // Always show the business detail UI
  // Individual components will handle their own loading states

  // Show error screen if config failed to load
  if (configError) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />
        <View style={styles.errorContainer}>
          <TouchableOpacity style={styles.retryButton} onPress={handleBackToMarketplace}>
            <Text style={[styles.retryButtonText, { fontSize: fontSizes.base }]}>← Back to Marketplace</Text>
          </TouchableOpacity>
          <Text style={[styles.errorText, { fontSize: fontSizes.base }]}>{configError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleBackToMarketplace}>
            <Text style={[styles.retryButtonText, { fontSize: fontSizes.base }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardVisibilityContext.Provider value={{ isKeyboardVisible, headerOpacity, headerTranslateY }}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

        {/* Business App Content - Loads app-config for selected business */}
        <AppConfigProvider organizationId={organizationId} organizationSlug={organizationData?.slug || ''}>
          {/* Animated Smart Header */}
          {!isKeyboardVisible && (
            <Animated.View
              style={{
                opacity: headerOpacity,
                transform: [{ translateY: headerTranslateY }],
              }}
            >
              <SmartHeader
                businessName={organizationData?.name || 'Loading...'}
                onBackToMarketplace={handleBackToMarketplace}
              />
            </Animated.View>
          )}

          <View style={styles.appContainer}>
            <BusinessTabNavigator
              businessName={organizationData?.name || 'Loading...'}
              onBackToMarketplace={handleBackToMarketplace}
            />
          </View>
        </AppConfigProvider>
      </View>
    </KeyboardVisibilityContext.Provider>
  );
}

// Main component that provides navigation context
export default function BusinessDetailScreen() {
  return (
    <NavigationProvider>
      <BusinessDetailContent />
    </NavigationProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A', // Match NavigationHeader background for smooth animation
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A', // Match theme for smooth transition
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#1C1C1E',
  },
  errorText: {
    fontSize: 18,
    color: '#FF453A',
    textAlign: 'center',
    marginVertical: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
