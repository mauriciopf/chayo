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
import { useThemedStyles } from '../context/ThemeContext';
import BusinessDrawerNavigator from '../navigation/BusinessDrawerNavigator';
import { supabase } from '../services/authService';

// Keyboard visibility context
const KeyboardVisibilityContext = createContext({
  isKeyboardVisible: false,
  keyboardHeight: 0,
  headerOpacity: new Animated.Value(1),
  headerTranslateY: new Animated.Value(0),
  headerHeight: 0,
  setHeaderHeight: (_height: number) => {},
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
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

    const handleKeyboardShow = (event: any) => {
      const height = event?.endCoordinates?.height || 0;
      setKeyboardHeight(height);

      // Delay state update to prevent immediate re-render that closes keyboard
      setTimeout(() => {
        setIsKeyboardVisible(true);
      }, 100);

      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: -(headerHeight || 130),
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const handleKeyboardHide = () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 250,
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
  }, [headerOpacity, headerTranslateY, headerHeight]);

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
    <KeyboardVisibilityContext.Provider value={{ isKeyboardVisible, keyboardHeight, headerOpacity, headerTranslateY, headerHeight, setHeaderHeight }}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

        {/* Business App Content - Loads app-config for selected business */}
        <AppConfigProvider organizationId={organizationId} organizationSlug={organizationData?.slug || ''}>
          <View style={styles.appContainer}>
            <BusinessDrawerNavigator
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
