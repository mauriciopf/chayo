/**
 * Chayo Mobile App
 * Business ALL-App with OTA Updates and Dynamic Configuration
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  Alert,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
// Conditional import for expo-updates (only available in Expo-managed workflow)
let Updates: any = null;
try {
  Updates = require('expo-updates');
} catch (error) {
  // expo-updates not available in React Native CLI
  console.log('expo-updates not available, OTA updates disabled');
}
import { AppConfigProvider } from './src/context/AppConfigContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { OnboardingChatScreen } from './src/screens/OnboardingChatScreen';
import { StorageService } from './src/services/StorageService';
import { DeepLinkService } from './src/services/DeepLinkService';
import { demoModeService } from './src/services/DemoModeService';
import { WelcomeModal } from './src/components';

// Initialize i18n
import './src/i18n';

function App(): React.JSX.Element {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showSlugEntry, setShowSlugEntry] = useState(false);


  // Check for OTA updates and load stored credentials on app start
  useEffect(() => {
    let cleanupDeepLinks: (() => void) | null = null;

    async function initializeApp() {
      try {
        // Check for updates in production (only if Updates is available)
        if (!__DEV__ && Updates) {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            setIsUpdateAvailable(true);
            Alert.alert(
              'Update Available',
              'A new version of the app is available. Would you like to update now?',
              [
                { text: 'Later', style: 'cancel' },
                {
                  text: 'Update',
                  onPress: async () => {
                    try {
                      await Updates.fetchUpdateAsync();
                      await Updates.reloadAsync();
                    } catch (error) {
                      Alert.alert('Update Failed', 'Please try again later.');
                    }
                  },
                },
              ]
            );
          }
        }

        // Set up deep link handling (takes precedence over everything)
        cleanupDeepLinks = DeepLinkService.setupDeepLinkListener(
          async (orgId: string) => {
            try {
              // Deep link detected - this completely overrides demo mode and welcome modal
              console.log('Deep link detected, switching to real organization:', orgId);
              await demoModeService.setRealOrganization(orgId);
              setOrganizationId(orgId);
              setShowWelcomeModal(false);
              setShowSlugEntry(false);
            } catch (error) {
              console.error('Error handling deep link:', error);
              // If deep link fails, fall back to normal flow
              setShowSlugEntry(true);
              setShowWelcomeModal(false);
            }
          }
        );

        // Check stored organization ID
        const storedOrgId = await StorageService.getOrganizationId();

        if (storedOrgId) {
          // User already has an organization - load it directly
          setOrganizationId(storedOrgId);

          // Check if we should still show welcome (for demo users)
          const shouldShowWelcome = await demoModeService.shouldShowWelcome();
          if (shouldShowWelcome) {
            setShowWelcomeModal(true);
          }
        } else {
          // No organization stored - check if we should show welcome
          const shouldShowWelcome = await demoModeService.shouldShowWelcome();

          if (shouldShowWelcome) {
            // First time user - show welcome modal
            setShowWelcomeModal(true);
          } else {
            // User has seen welcome but no org stored - show onboarding
            setShowSlugEntry(true);
          }
        }

      } catch (error) {
        console.error('Error during app initialization:', error);
        // If there's an error loading stored data, show slug entry as fallback
        setShowSlugEntry(true);
        setShowWelcomeModal(false);
      } finally {
        setAppReady(true);
      }
    }

    initializeApp();

    // Cleanup function
    return () => {
      if (cleanupDeepLinks) {
        cleanupDeepLinks();
      }
    };
  }, []);

  // Handle demo mode selection from welcome modal
  const handleTryDemo = async () => {
    try {
      console.log('User selected demo mode');
      await demoModeService.enableDemoMode();
      const demoState = await demoModeService.getDemoModeState();
      setOrganizationId(demoState.organizationId);
      setShowWelcomeModal(false);
      console.log('Demo mode enabled successfully');
    } catch (error) {
      console.error('Error enabling demo mode:', error);
      Alert.alert(
        'Error',
        'Could not start demo mode. Please try entering your business code instead.',
        [
          { text: 'OK', onPress: () => {
            setShowWelcomeModal(false);
            setShowSlugEntry(true);
          }},
        ]
      );
    }
  };

  // Handle enter code selection from welcome modal
  const handleEnterCode = () => {
    console.log('User selected enter business code');
    setShowWelcomeModal(false);
    setShowSlugEntry(true);
  };

  // Handle organization ID from onboarding chat
  const handleSlugValidated = async (orgId: string) => {
    try {
      await demoModeService.setRealOrganization(orgId);
      setOrganizationId(orgId);
      setShowSlugEntry(false);
    } catch (error) {
      console.error('Error handling validated organization:', error);
      Alert.alert('Error', 'No se pudo completar la configuración. Intenta de nuevo.');
    }
  };

  if (!appReady) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />
        <ActivityIndicator size="large" color="#0A84FF" />
        <Text style={styles.loadingText}>
          {isUpdateAvailable ? 'Updating app...' : 'Loading Chayo...'}
        </Text>
      </View>
    );
  }

  // Show onboarding chat if no credentials are stored
  if (showSlugEntry) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />
        <OnboardingChatScreen onSlugValidated={handleSlugValidated} />
      </>
    );
  }

  // Show main app with organization config
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />
      <AppConfigProvider organizationId={organizationId || undefined}>
        <ThemeProvider>
          <AppNavigator />
          
          {/* Welcome Modal - Now inside ThemeProvider */}
          <WelcomeModal
            visible={showWelcomeModal}
            onTryDemo={handleTryDemo}
            onEnterCode={handleEnterCode}
          />
        </ThemeProvider>
      </AppConfigProvider>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default App;
