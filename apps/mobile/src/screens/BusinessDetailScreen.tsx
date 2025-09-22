import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AppConfigProvider } from '../context/AppConfigContext';
import { ThemeProvider } from '../context/ThemeContext';
import { NavigationProvider } from '../context/NavigationContext';
import { SmartHeader } from '../components/SmartHeader';
import BusinessTabNavigator from '../navigation/BusinessTabNavigator';
import LoadingScreen from '../components/LoadingScreen';
import { supabase } from '../services/authService';

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
  const { organizationId } = route.params as BusinessDetailScreenProps;
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null);

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

  const handleBackToMarketplace = () => {
    navigation.navigate('Marketplace');
  };

  // Show loading screen while loading config or if no organization data
  if (isLoadingConfig || !organizationData) {
    return (
      <LoadingScreen />
    );
  }

  // Show error screen if config failed to load
  if (configError) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />
        <View style={styles.errorContainer}>
          <TouchableOpacity style={styles.retryButton} onPress={handleBackToMarketplace}>
            <Text style={styles.retryButtonText}>← Back to Marketplace</Text>
          </TouchableOpacity>
          <Text style={styles.errorText}>{configError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleBackToMarketplace}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />
      
      {/* Business App Content - Loads app-config for selected business */}
      <AppConfigProvider organizationId={organizationId} organizationSlug={organizationData.slug}>
        <ThemeProvider>
          {/* Smart Header - automatically switches between business and nested headers */}
          <SmartHeader
            businessName={organizationData.name}
            onBackToMarketplace={handleBackToMarketplace}
          />
          
          <View style={styles.appContainer}>
            <BusinessTabNavigator 
              businessName={organizationData.name}
              onBackToMarketplace={handleBackToMarketplace}
            />
          </View>
        </ThemeProvider>
      </AppConfigProvider>
    </View>
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
    backgroundColor: '#000000',
  },
  appContainer: {
    flex: 1,
    marginTop: 0,
    paddingTop: 0,
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
