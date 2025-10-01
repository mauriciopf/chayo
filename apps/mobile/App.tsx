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
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// Conditional import for expo-updates (only available in Expo-managed workflow)
let Updates: any = null;
try {
  Updates = require('expo-updates');
} catch (error) {
  // expo-updates not available in React Native CLI
  console.log('expo-updates not available, OTA updates disabled');
}
import { AuthProvider } from './src/context/AuthContext';
import AuthErrorBoundary from './src/components/AuthErrorBoundary';
import { ThemeProvider } from './src/context/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MarketplaceScreen from './src/screens/MarketplaceScreen';
import BusinessDetailScreen from './src/screens/BusinessDetailScreen';
import { RootStackParamList } from './src/types/navigation';

// Initialize i18n
import './src/i18n';

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [appReady, setAppReady] = useState(false);


  // Simple app initialization for marketplace
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
                  },
                },
              ]
            );
          }
        }
      } catch (error) {
        console.error('Error during app initialization:', error);
      } finally {
        setAppReady(true);
      }
    }

    initializeApp();
  }, []);


  if (!appReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.brandText}>CHAYO</Text>
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // Show marketplace app
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <AuthErrorBoundary>
        <AuthProvider>
          <ThemeProvider>
            <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Marketplace"
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen 
                name="Marketplace" 
                component={MarketplaceScreen}
                options={{
                  title: 'Discover Businesses',
                }}
              />
              <Stack.Screen 
                name="BusinessDetail" 
                component={BusinessDetailScreen}
                options={{
                  title: 'Business',
                  animation: 'slide_from_right',
                }}
              />
            </Stack.Navigator>
            </NavigationContainer>
          </ThemeProvider>
        </AuthProvider>
      </AuthErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  brandText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 30,
    letterSpacing: 2,
  },
  loader: {
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.7,
  },
});

export default App;
