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
import AppNavigator from './src/navigation/AppNavigator';
import { OnboardingChatScreen } from './src/screens/OnboardingChatScreen';
import { StorageService } from './src/services/StorageService';
import { DeepLinkService } from './src/services/DeepLinkService';

function App(): React.JSX.Element {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [appConfig, setAppConfig] = useState<any | null>(null);

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

        // Load stored credentials and config
        const storedOrgId = await StorageService.getOrganizationId();
        const storedConfig = await StorageService.getAppConfig();

        if (storedOrgId && storedConfig) {
          setOrganizationId(storedOrgId);
          setAppConfig(storedConfig);
        } else {
          // No stored organization ID or config, show onboarding
          setShowSlugEntry(true);
        }

        // Set up deep link handling
        cleanupDeepLinks = DeepLinkService.setupDeepLinkListener(
          async (slug: string) => {
            // Handle organization slug from deep link - need to fetch organizationId
            // For now, we'll let the onboarding flow handle this
            setShowSlugEntry(true);
          }
        );

      } catch (error) {
        console.log('Error during app initialization:', error);
        // If there's an error loading stored data, show slug entry
        setShowSlugEntry(true);
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

  // Handle organization ID from onboarding chat
  const handleSlugValidated = async (organizationId: string) => {
    try {
      // Reload the stored config after validation
      const storedConfig = await StorageService.getAppConfig();
      setOrganizationId(organizationId);
      setAppConfig(storedConfig);
      setShowSlugEntry(false);
    } catch (error) {
      console.error('Error handling validated organization:', error);
      Alert.alert('Error', 'No se pudo completar la configuración. Intenta de nuevo.');
    }
  };

  if (!appReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppConfigProvider
        storedConfig={appConfig}
        organizationId={organizationId || undefined}
      >
        <AppNavigator />
      </AppConfigProvider>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default App;