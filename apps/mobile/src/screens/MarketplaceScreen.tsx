import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Dimensions,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/authService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with 16px margins

interface Business {
  id: string;
  name: string;
  slug: string;
  category: string;
  representative_image_url?: string;
  description?: string;
  rating: number;
  review_count: number;
  address?: string;
  phone?: string;
}

interface Category {
  id: string;
  name: string;
  label: string;
  icon: string;
  color: string;
}

const CATEGORIES: Category[] = [
  { id: 'all', name: 'all', label: 'All', icon: '🏪', color: '#007AFF' },
  { id: 'healthcare', name: 'healthcare', label: 'Healthcare', icon: '🏥', color: '#34C759' },
  { id: 'dental', name: 'dental', label: 'Dental', icon: '🦷', color: '#00C7BE' },
  { id: 'legal', name: 'legal', label: 'Legal', icon: '⚖️', color: '#5856D6' },
  { id: 'automotive', name: 'automotive', label: 'Auto', icon: '🚗', color: '#FF3B30' },
  { id: 'beauty', name: 'beauty', label: 'Beauty', icon: '💄', color: '#FF2D92' },
  { id: 'fitness', name: 'fitness', label: 'Fitness', icon: '💪', color: '#FF9500' },
  { id: 'restaurant', name: 'restaurant', label: 'Food', icon: '🍽️', color: '#FFCC02' },
  { id: 'professional_services', name: 'professional_services', label: 'Services', icon: '💼', color: '#8E8E93' },
];

export default function MarketplaceScreen() {
  const navigation = useNavigation();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const loadBusinesses = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      console.log('🔍 Loading businesses...', { searchQuery, selectedCategory });

      // First, let's see what organizations exist at all
      const { data: allOrgs, error: allOrgsError } = await supabase
        .from('organizations')
        .select('id, name, active, category')
        .limit(10);
      
      console.log('🔍 All organizations in DB:', { count: allOrgs?.length || 0, orgs: allOrgs, error: allOrgsError });

      // Build query for organizations table
      let query = supabase
        .from('organizations')
        .select(`
          id,
          name,
          slug,
          category,
          representative_image_url,
          description,
          rating,
          review_count,
          active
        `)
        .eq('active', true);

      // Apply category filter
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
        console.log('🏷️ Filtering by category:', selectedCategory);
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        console.log('🔍 Searching for:', searchQuery);
      }

      // Load all businesses (limit 50)
      console.log('🏢 Loading all businesses...');
      const { data: allBusinesses, error: allError } = await query
        .order('name')
        .limit(50);
      
      console.log('🏢 All businesses result:', { count: allBusinesses?.length || 0, error: allError });
      if (allBusinesses) setBusinesses(allBusinesses);

    } catch (error) {
      console.error('❌ Error loading businesses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const handleBusinessSelect = (business: Business) => {
    // Navigate to business detail screen with business info
    navigation.navigate('BusinessDetail', { 
      business,
      organizationId: business.id 
    });
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery(''); // Clear search when selecting category
  };

  const renderBusinessCard = ({ item: business }: { item: Business }) => (
    <TouchableOpacity 
      style={styles.businessCard}
      onPress={() => handleBusinessSelect(business)}
      activeOpacity={0.8}
    >
      <View style={styles.businessImageContainer}>
        {business.representative_image_url ? (
          <Image 
            source={{ uri: business.representative_image_url }} 
            style={styles.businessImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.businessImagePlaceholder, { backgroundColor: getCategoryColor(business.category) }]}>
            <Text style={styles.businessImagePlaceholderIcon}>
              {getCategoryIcon(business.category)}
            </Text>
            <Text style={styles.businessImagePlaceholderText}>
              {business.name}
            </Text>
          </View>
        )}
        {business.featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>⭐</Text>
          </View>
        )}
      </View>
      
      <View style={styles.businessInfo}>
        <Text style={styles.businessName} numberOfLines={2}>
          {business.name}
        </Text>
        
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryBadge}>
            {getCategoryIcon(business.category)} {getCategoryLabel(business.category)}
          </Text>
        </View>
        
        {business.rating > 0 && (
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>
              ⭐ {business.rating.toFixed(1)}
            </Text>
            <Text style={styles.reviewCount}>
              ({business.review_count})
            </Text>
          </View>
        )}
        
        {business.address && (
          <Text style={styles.address} numberOfLines={1}>
            📍 {business.address}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderCategoryPill = ({ item: category }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryPill,
        selectedCategory === category.name && styles.categoryPillSelected
      ]}
      onPress={() => handleCategorySelect(category.name)}
    >
      <Text style={styles.categoryIcon}>{category.icon}</Text>
      <Text style={[
        styles.categoryLabel,
        selectedCategory === category.name && styles.categoryLabelSelected
      ]}>
        {category.label}
      </Text>
    </TouchableOpacity>
  );

  const getCategoryColor = (category: string): string => {
    const cat = CATEGORIES.find(c => c.name === category);
    return cat?.color || '#8E8E93';
  };

  const getCategoryIcon = (category: string): string => {
    const cat = CATEGORIES.find(c => c.name === category);
    return cat?.icon || '🏪';
  };

  const getCategoryLabel = (category: string): string => {
    const cat = CATEGORIES.find(c => c.name === category);
    return cat?.label || 'Business';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Businesses</Text>
        <Text style={styles.headerSubtitle}>Find the perfect service for you</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search businesses, services..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadBusinesses(true)} />
        }
      >
        {/* Category Pills */}
        <View style={styles.categoriesSection}>
          <FlatList
            data={CATEGORIES}
            renderItem={renderCategoryPill}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>


        {/* All Businesses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'All Businesses' : `${getCategoryLabel(selectedCategory)} Businesses`}
          </Text>
          <FlatList
            data={businesses}
            renderItem={renderBusinessCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.businessRow}
            scrollEnabled={false}
            contentContainerStyle={styles.businessGrid}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  clearIcon: {
    fontSize: 16,
    color: '#8E8E93',
    padding: 4,
  },
  content: {
    flex: 1,
  },
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    gap: 6,
  },
  categoryPillSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  categoryLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  featuredList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  businessGrid: {
    paddingHorizontal: 20,
  },
  businessRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  businessCard: {
    width: CARD_WIDTH,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  businessImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  businessImage: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
  },
  businessImagePlaceholder: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  businessImagePlaceholderIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  businessImagePlaceholderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 16,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  featuredBadgeText: {
    fontSize: 12,
  },
  businessInfo: {
    gap: 6,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  categoryContainer: {
    flexDirection: 'row',
  },
  categoryBadge: {
    fontSize: 12,
    color: '#8E8E93',
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 12,
    color: '#FFCC02',
    fontWeight: '500',
  },
  reviewCount: {
    fontSize: 12,
    color: '#8E8E93',
  },
  address: {
    fontSize: 11,
    color: '#8E8E93',
    lineHeight: 14,
  },
});
