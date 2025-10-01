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
  Animated,
  Image,
} from 'react-native';
// Using pure React Native Views for gradients (no external dependencies)
import { useNavigation } from '@react-navigation/native';
import { ShareIcon, BookmarkIcon } from '../components/icons';
import { useThemedStyles } from '../context/ThemeContext';

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
  ai_generated_image_url?: string;
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
  { id: 'all', name: 'all', label: 'All', icon: '✨', color: '#8B7355' },
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
  const { fontSizes } = useThemedStyles();
  const [vibeCards, setVibeCards] = useState<MarketplaceVibeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedStories, setExpandedStories] = useState<{[key: string]: boolean}>({});
  const [likedCards, setLikedCards] = useState<{[key: string]: boolean}>({});

  const loadVibeCards = useCallback(async (refresh = false) => {
    try {
      if (refresh) {setRefreshing(true);}
      else {setLoading(true);}

      console.log('✨ Loading vibe cards...', { searchQuery, selectedCategory });

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
        throw new Error('No se pudieron cargar las tarjetas de vibra');
      }

      const data = await response.json();

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
    // Navigate to business detail screen with only the organization ID
    navigation.navigate('BusinessDetail', {
      organizationId: vibeCard.organization_id,
    });
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery(''); // Clear search when selecting category
  };

  const renderVibeCard = ({ item: vibeCard }: { item: MarketplaceVibeCard }) => {
    const { vibe_data } = vibeCard;
    const scaleAnim = new Animated.Value(1);
    const showFullStory = expandedStories[vibeCard.organization_id] || false;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    };

    const handlePress = () => {
      handleVibeCardSelect(vibeCard);
    };

    const toggleStory = () => {
      setExpandedStories(prev => ({
        ...prev,
        [vibeCard.organization_id]: !prev[vibeCard.organization_id],
      }));
    };

    const toggleLike = () => {
      setLikedCards(prev => ({
        ...prev,
        [vibeCard.organization_id]: !prev[vibeCard.organization_id],
      }));
    };

    const isLiked = likedCards[vibeCard.organization_id] || false;

    // Check if story is long enough to need truncation
    const originStory = vibe_data.origin_story || '';
    const isLongStory = originStory.length > 150;
    const displayStory = showFullStory || !isLongStory
      ? originStory
      : originStory.substring(0, 150) + '...';

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.vibeCard, styles.interactiveCard]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
        {/* AI Generated Image Header */}
        {vibe_data.ai_generated_image_url ? (
          <View style={styles.imageHeader}>
            <Image
              source={{ uri: vibe_data.ai_generated_image_url }}
              style={styles.aiGeneratedImage}
              resizeMode="cover"
            />
            {/* Gradient overlay for text readability */}
            <View style={styles.imageOverlay} />
            <View style={styles.imageHeaderContent}>
              <Text style={styles.vibeAesthetic}>✨ {vibe_data.vibe_aesthetic}</Text>
              <Text style={[styles.businessName, { fontSize: fontSizes.lg }]}>
                {vibe_data.business_name}
              </Text>
              <Text style={[styles.businessType, { fontSize: fontSizes.sm }]}>{vibe_data.business_type}</Text>
              {vibe_data.location && (
                <Text style={styles.location}>📍 {vibe_data.location}</Text>
              )}
            </View>
          </View>
        ) : (
          /* Fallback: Gradient Header - Pure React Native */
          <View style={[styles.vibeCardHeader, { backgroundColor: vibe_data.vibe_colors?.primary }]}>
          {/* Gradient overlay effect */}
          <View
            style={[
              styles.gradientOverlay,
              { backgroundColor: vibe_data.vibe_colors?.secondary },
            ]}
          />
          <View style={styles.vibeCardHeaderContent}>
               <Text style={styles.vibeAesthetic}>✨ {vibe_data.vibe_aesthetic}</Text>
            <Text style={styles.businessName}>
              {vibe_data.business_name}
            </Text>
            <Text style={styles.businessType}>{vibe_data.business_type}</Text>
            {vibe_data.location && (
              <Text style={styles.location}>📍 {vibe_data.location}</Text>
            )}
          </View>
        </View>
        )}

        {/* Content */}
        <View style={styles.vibeCardContent}>
          {/* Origin Story */}
          <View>
            <Text style={styles.originStory}>
              {displayStory}
            </Text>
            {isLongStory && (
              <TouchableOpacity
                onPress={toggleStory}
                style={styles.readMoreButton}
              >
                <Text style={styles.readMoreText}>
                  {showFullStory ? 'Read Less' : 'Read More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Value Badges */}
          <View style={styles.badgesContainer}>
            {(vibe_data.value_badges || []).map((badge, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.valueBadge,
                  { backgroundColor: vibe_data.vibe_colors?.primary + '20' },
                ]}
                onPress={() => {
                  // Could show badge details or highlight related businesses
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.valueBadgeText, { color: vibe_data.vibe_colors?.primary }]}>
                  {badge}
                </Text>
              </TouchableOpacity>
            ))}
            {(vibe_data.value_badges || []).length > 3 && (
              <View style={styles.moreBadge}>
                <Text style={styles.moreBadgeText}>+{(vibe_data.value_badges || []).length - 3}</Text>
              </View>
            )}
          </View>

          {/* Perfect For */}
          {(vibe_data.perfect_for || []).length > 0 && (
            <View style={styles.perfectForContainer}>
              <Text style={[styles.perfectForLabel, { color: vibe_data.vibe_colors?.primary }]}>
                Perfect for:
              </Text>
              <Text style={styles.perfectForText}>
                {(vibe_data.perfect_for || []).join(', ')}
              </Text>
            </View>
          )}

          {/* iOS News Style "More" Indicator */}
          <View style={styles.moreIndicator}>
            <Text style={styles.moreIndicatorText}>...</Text>
          </View>

          {/* Instagram Style Action Buttons */}
          <View style={styles.socialActions}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => {
                toggleLike();
              }}
            >
              <Text style={[styles.socialButtonIcon, { color: isLiked ? '#D4AF37' : '#FFFFFF' }]}>
                {isLiked ? '★' : '☆'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => {
                // Handle share action
              }}
            >
              <ShareIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => {
                // Handle save/bookmark action
              }}
            >
              <BookmarkIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderCategoryPill = ({ item: category }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryPill,
        selectedCategory === category.name && styles.categoryPillSelected,
      ]}
      onPress={() => handleCategorySelect(category.name)}
    >
      <Text style={styles.categoryIcon}>{category.icon}</Text>
      <Text style={[
        styles.categoryLabel,
        selectedCategory === category.name && styles.categoryLabelSelected,
      ]}>
        {category.label}
      </Text>
    </TouchableOpacity>
  );

  const getCategoryLabel = (category: string): string => {
    const cat = CATEGORIES.find(c => c.name === category);
    return cat?.label || 'Business';
  };

  const renderSkeletonCard = () => (
    <View style={[styles.vibeCard, styles.skeletonCard]}>
      {/* Skeleton Header */}
      <View style={[styles.vibeCardHeader, styles.skeletonHeader]}>
        <View style={styles.skeletonShimmer} />
        <View style={styles.vibeCardHeaderContent}>
          <View style={[styles.skeletonText, { width: '60%', height: 16 }]} />
          <View style={[styles.skeletonText, { width: '80%', height: 20, marginTop: 8 }]} />
          <View style={[styles.skeletonText, { width: '50%', height: 14, marginTop: 4 }]} />
        </View>
      </View>

      {/* Skeleton Content */}
      <View style={styles.vibeCardContent}>
        <View style={[styles.skeletonText, { width: '100%', height: 16 }]} />
        <View style={[styles.skeletonText, { width: '90%', height: 16, marginTop: 4 }]} />
        <View style={[styles.skeletonText, { width: '70%', height: 16, marginTop: 4 }]} />

        {/* Skeleton Badges */}
        <View style={[styles.badgesContainer, { marginTop: 12 }]}>
          <View style={[styles.skeletonBadge]} />
          <View style={[styles.skeletonBadge]} />
          <View style={[styles.skeletonBadge]} />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontSize: fontSizes.xxl }]}>✨ Vibe Marketplace</Text>
        <Text style={[styles.headerSubtitle, { fontSize: fontSizes.base }]}>Discover businesses that match your energy</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar negocios, servicios..."
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
            {selectedCategory === 'all' ? '✨ Discover Amazing Vibes' : `✨ ${getCategoryLabel(selectedCategory)} Vibes`}
          </Text>
          {loading && vibeCards.length === 0 ? (
            <View style={styles.vibeCardGrid}>
              {[1, 2, 3].map((index) => (
                <View key={index} style={{ marginBottom: 20 }}>
                  {renderSkeletonCard()}
                </View>
              ))}
            </View>
          ) : vibeCards.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyIcon, { fontSize: fontSizes.xxxl }]}>💫</Text>
              <Text style={[styles.emptyTitle, { fontSize: fontSizes.xl }]}>No Vibe Cards Yet</Text>
              <Text style={[styles.emptyText, { fontSize: fontSizes.base }]}>
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
    // Enhanced 3D shadow for more tappable feeling
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12, // Android shadow
  },
  interactiveCard: {
    transform: [{ scale: 1 }],
    borderWidth: 2,
    borderColor: '#4A4A4A',
    // Even deeper shadow for pressed state
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
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
  // AI Generated Image Header Styles
  imageHeader: {
    position: 'relative',
    height: 200,
    overflow: 'hidden',
  },
  aiGeneratedImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dark overlay for text readability
  },
  imageHeaderContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
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
  // New interactive styles
  readMoreButton: {
    marginTop: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  socialActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 24, // More padding for better spacing with 3 buttons
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  socialButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    minWidth: 44,
    minHeight: 44,
  },
  socialButtonIcon: {
    fontSize: 22,
  },
  // iOS News Style "More" Indicator
  moreIndicator: {
    alignItems: 'flex-end',
    paddingRight: 16,
    paddingBottom: 8,
  },
  moreIndicatorText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 4,
    opacity: 0.7,
  },
  // Skeleton loading styles
  skeletonCard: {
    backgroundColor: '#2A2A2A',
  },
  skeletonHeader: {
    backgroundColor: '#3A3A3A',
  },
  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#4A4A4A',
    opacity: 0.3,
  },
  skeletonText: {
    backgroundColor: '#4A4A4A',
    borderRadius: 4,
    opacity: 0.6,
  },
  skeletonBadge: {
    width: 80,
    height: 28,
    backgroundColor: '#4A4A4A',
    borderRadius: 14,
    opacity: 0.6,
  },
});
