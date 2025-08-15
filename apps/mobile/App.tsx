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

// For now, we'll use a demo organization slug
// In production, this would come from deep links, QR codes, or user login
const DEMO_ORG_SLUG = 'demo-business';

function App(): React.JSX.Element {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [appReady, setAppReady] = useState(false);

  // Check for OTA updates on app start
  useEffect(() => {
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
                  }
                }
              ]
            );
          }
        }
      } catch (error) {
        console.log('Error checking for updates:', error);
      } finally {
        setAppReady(true);
      }
    }

    initializeApp();
  }, []);

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

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppConfigProvider organizationSlug={DEMO_ORG_SLUG}>
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