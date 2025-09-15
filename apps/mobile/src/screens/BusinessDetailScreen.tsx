import React from 'react';
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
import BusinessTabNavigator from '../navigation/BusinessTabNavigator';

interface Business {
  id: string;
  name: string;
  slug: string;
  category: string;
  representative_image_url?: string;
  description?: string;
  rating: number;
  review_count: number;
  mobile_app_code: string;
}

interface BusinessDetailScreenProps {
  business: Business;
  organizationId: string;
}

export default function BusinessDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { business, organizationId } = route.params as BusinessDetailScreenProps;

  const handleBackToMarketplace = () => {
    navigation.navigate('Marketplace');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />
      
      {/* Business Header with Back Button */}
      <View style={styles.businessHeader}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToMarketplace}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.businessInfo}>
          <Text style={styles.businessName}>{business.name}</Text>
          <Text style={styles.businessCategory}>
            {getCategoryIcon(business.category)} {getCategoryLabel(business.category)}
          </Text>
        </View>
      </View>

      {/* Business App Content - Loads app-config for selected business */}
      <View style={styles.appContainer}>
        <AppConfigProvider organizationId={organizationId}>
          <ThemeProvider>
            <BusinessTabNavigator 
              businessName={business.name}
              onBackToMarketplace={handleBackToMarketplace}
            />
          </ThemeProvider>
        </AppConfigProvider>
      </View>
    </SafeAreaView>
  );
}

// Helper functions for category display
const getCategoryIcon = (category: string): string => {
  const categoryMap: { [key: string]: string } = {
    healthcare: '🏥',
    dental: '🦷',
    legal: '⚖️',
    automotive: '🚗',
    beauty: '💄',
    fitness: '💪',
    restaurant: '🍽️',
    retail: '🛍️',
    professional_services: '💼',
    home_services: '🏠',
    education: '📚',
    finance: '💰',
    real_estate: '🏡',
    technology: '💻',
    consulting: '📊',
    entertainment: '🎭',
    travel: '✈️',
    nonprofit: '❤️',
    other: '🏪',
  };
  return categoryMap[category] || '🏪';
};

const getCategoryLabel = (category: string): string => {
  const labelMap: { [key: string]: string } = {
    healthcare: 'Healthcare',
    dental: 'Dental',
    legal: 'Legal',
    automotive: 'Automotive',
    beauty: 'Beauty & Wellness',
    fitness: 'Fitness',
    restaurant: 'Restaurant',
    retail: 'Retail',
    professional_services: 'Professional Services',
    home_services: 'Home Services',
    education: 'Education',
    finance: 'Finance',
    real_estate: 'Real Estate',
    technology: 'Technology',
    consulting: 'Consulting',
    entertainment: 'Entertainment',
    travel: 'Travel',
    nonprofit: 'Non-Profit',
    other: 'Other',
  };
  return labelMap[category] || 'Business';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  businessInfo: {
    flex: 1,
    alignItems: 'center',
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  appContainer: {
    flex: 1,
  },
});
