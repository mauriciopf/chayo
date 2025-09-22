import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  RefreshControl,
  ScrollView,
} from 'react-native';
// Using pure React Native Views for gradients (no external dependencies)
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40; // Full width with 20px margins on each side

interface VibeCardData {
  business_name: string;
  business_type: string;
  origin_story: string;
  value_badges: string[];
  personality_traits: string[];
  vibe_colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  vibe_aesthetic: string;
  why_different: string;
  perfect_for: string[];
  customer_love: string;
  location?: string;
}

interface MarketplaceVibeCard {
  organization_id: string;
  slug: string;
  setup_status: 'completed';
  completed_at: string;
  vibe_data: VibeCardData;
}

interface Category {
  id: string;
  name: string;
  label: string;
  icon: string;
  color: string;
}

const CATEGORIES: Category[] = [
  { id: 'all', name: 'all', label: 'All', icon: '💖', color: '#8B7355' },
  { id: 'wellness', name: 'wellness', label: 'Wellness', icon: '🌿', color: '#A8956F' },
  { id: 'beauty', name: 'beauty', label: 'Beauty', icon: '✨', color: '#E6D7C3' },
  { id: 'fitness', name: 'fitness', label: 'Fitness', icon: '🧘‍♀️', color: '#D4B896' },
  { id: 'food', name: 'food', label: 'Food', icon: '🌱', color: '#C9A876' },
  { id: 'services', name: 'services', label: 'Services', icon: '🤲', color: '#B8A082' },
  { id: 'creative', name: 'creative', label: 'Creative', icon: '🎨', color: '#A8956F' },
  { id: 'lifestyle', name: 'lifestyle', label: 'Lifestyle', icon: '🌙', color: '#8B7355' },
];

export default function MarketplaceScreen() {
  const navigation = useNavigation();
  const [vibeCards, setVibeCards] = useState<MarketplaceVibeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const loadVibeCards = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      console.log('💖 Loading vibe cards...', { searchQuery, selectedCategory });

      // Build API URL with filters
      const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://chayo.vercel.app';
      const params = new URLSearchParams();
      
      if (selectedCategory !== 'all') {
        params.append('business_type', selectedCategory);
      }
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery);
      }
      
      params.append('limit', '50');

      const response = await fetch(`${apiUrl}/api/marketplace/vibe-cards?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch vibe cards');
      }

      const data = await response.json();
      console.log('💖 Vibe cards loaded:', { count: data.vibe_cards?.length || 0 });
      
      if (data.vibe_cards) {
        setVibeCards(data.vibe_cards);
      }

    } catch (error) {
      console.error('❌ Error loading vibe cards:', error);
      // Fallback to empty array on error
      setVibeCards([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    loadVibeCards();
  }, [loadVibeCards]);

  const handleVibeCardSelect = (vibeCard: MarketplaceVibeCard) => {
    // Navigate to business detail screen with vibe card info
    navigation.navigate('BusinessDetail', {
      business: {
        id: vibeCard.organization_id,
        name: vibeCard.vibe_data.business_name,
        type: vibeCard.vibe_data.business_type,
        description: vibeCard.vibe_data.origin_story,
        vibe_data: vibeCard.vibe_data
      },
      organizationId: vibeCard.organization_id
    });
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery(''); // Clear search when selecting category
  };

  const renderVibeCard = ({ item: vibeCard }: { item: MarketplaceVibeCard }) => {
    const { vibe_data } = vibeCard;
    
    return (
      <TouchableOpacity 
        style={[styles.vibeCard, styles.interactiveCard]}
        onPress={() => handleVibeCardSelect(vibeCard)}
        activeOpacity={0.9}
      >
        {/* Gradient Header - Pure React Native */}
        <View style={[styles.vibeCardHeader, { backgroundColor: vibe_data.vibe_colors?.primary }]}>
          {/* Gradient overlay effect */}
          <View 
            style={[
              styles.gradientOverlay, 
              { backgroundColor: vibe_data.vibe_colors?.secondary }
            ]} 
          />
          <View style={styles.vibeCardHeaderContent}>
            <Text style={styles.vibeAesthetic}>💖 {vibe_data.vibe_aesthetic}</Text>
            <Text style={styles.businessName}>
              {vibe_data.business_name}
            </Text>
            <Text style={styles.businessType}>{vibe_data.business_type}</Text>
            {vibe_data.location && (
              <Text style={styles.location}>📍 {vibe_data.location}</Text>
            )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.vibeCardContent}>
          {/* Origin Story */}
          <Text style={styles.originStory}>
            {vibe_data.origin_story}
          </Text>

          {/* Value Badges */}
          <View style={styles.badgesContainer}>
            {vibe_data.value_badges.map((badge, index) => (
              <View 
                key={index}
                style={[
                  styles.valueBadge, 
                  { backgroundColor: vibe_data.vibe_colors?.primary + '20' }
                ]}
              >
                <Text style={[styles.valueBadgeText, { color: vibe_data.vibe_colors?.primary }]}>
                  {badge}
                </Text>
              </View>
            ))}
            {vibe_data.value_badges.length > 3 && (
              <View style={styles.moreBadge}>
                <Text style={styles.moreBadgeText}>+{vibe_data.value_badges.length - 3}</Text>
              </View>
            )}
          </View>

          {/* Perfect For */}
          {vibe_data.perfect_for.length > 0 && (
            <View style={styles.perfectForContainer}>
              <Text style={[styles.perfectForLabel, { color: vibe_data.vibe_colors?.primary }]}>
                Perfect for:
              </Text>
              <Text style={styles.perfectForText}>
                {vibe_data.perfect_for.join(', ')}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

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

  const getCategoryLabel = (category: string): string => {
    const cat = CATEGORIES.find(c => c.name === category);
    return cat?.label || 'Business';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💖 Vibe Marketplace</Text>
        <Text style={styles.headerSubtitle}>Discover businesses that match your energy</Text>
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
          <RefreshControl refreshing={refreshing} onRefresh={() => loadVibeCards(true)} />
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


        {/* Vibe Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? '💖 Discover Amazing Vibes' : `✨ ${getCategoryLabel(selectedCategory)} Vibes`}
          </Text>
          {loading && vibeCards.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading beautiful vibe cards...</Text>
            </View>
          ) : vibeCards.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💫</Text>
              <Text style={styles.emptyTitle}>No Vibe Cards Yet</Text>
              <Text style={styles.emptyText}>
                Be the first to complete your onboarding and create your unique vibe card!
              </Text>
            </View>
          ) : (
            <FlatList
              data={vibeCards}
              renderItem={renderVibeCard}
              keyExtractor={(item) => item.organization_id}
              numColumns={1}
              scrollEnabled={false}
              contentContainerStyle={styles.vibeCardGrid}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A', // Warmer dark background
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F5F5DC', // Warm white
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#D4B896', // Warm beige
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
  vibeCardGrid: {
    paddingHorizontal: 20,
    gap: 20,
  },
  vibeCardRow: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  vibeCard: {
    width: CARD_WIDTH,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  interactiveCard: {
    transform: [{ scale: 1 }],
    borderWidth: 2,
    borderColor: '#4A4A4A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  vibeCardHeader: {
    padding: 16,
    minHeight: 120,
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: '50%',
    opacity: 0.6,
  },
  vibeCardHeaderContent: {
    flex: 1,
    zIndex: 1,
  },
  vibeAesthetic: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    fontWeight: '500',
  },
  vibeCardContent: {
    padding: 16,
    paddingTop: 12,
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
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 4,
  },
  businessType: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  location: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  originStory: {
    fontSize: 13,
    color: '#E0E0E0',
    lineHeight: 18,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  valueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  valueBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  moreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#4A4A4A',
  },
  moreBadgeText: {
    fontSize: 10,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  perfectForContainer: {
    marginTop: 4,
  },
  perfectForLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  perfectForText: {
    fontSize: 11,
    color: '#CCCCCC',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#D4B896',
    fontSize: 16,
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F5F5DC',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#D4B896',
    textAlign: 'center',
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
