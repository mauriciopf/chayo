import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemedStyles } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { useAppConfig } from '../hooks/useAppConfig';
import Icon from 'react-native-vector-icons/Feather';

interface Product {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  price?: number;
  payment_transaction_id?: string;
  created_at: string;
  updated_at: string;
}

interface ProductsScreenProps {
  navigation: any;
}

export const ProductsScreen: React.FC<ProductsScreenProps> = ({ navigation }) => {
  const { config } = useAppConfig();
  const { theme, themedStyles } = useThemedStyles();
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const screenWidth = Dimensions.get('window').width;
  const numColumns = 2;
  const itemSize = (screenWidth - 32 - 12) / numColumns; // 32 for padding, 12 for gap

  useEffect(() => {
    fetchProducts();
  }, [config]);

  const fetchProducts = async () => {
    if (!config?.organizationId) return;

    try {
      setError(null);
      const response = await fetch(`${config.apiBaseUrl}/api/products?organizationId=${config.organizationId}&limit=50`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { product });
  };

  // Generate a consistent gradient based on product name
  const getProductGradient = (productName: string) => {
    const gradients = [
      ['#667eea', '#764ba2'], // Purple to Blue
      ['#f093fb', '#f5576c'], // Pink to Red
      ['#4facfe', '#00f2fe'], // Blue to Cyan
      ['#43e97b', '#38f9d7'], // Green to Teal
      ['#fa709a', '#fee140'], // Pink to Yellow
      ['#a8edea', '#fed6e3'], // Mint to Pink
      ['#ff9a9e', '#fecfef'], // Coral to Pink
      ['#ffecd2', '#fcb69f'], // Cream to Orange
    ];
    
    // Use product name to consistently pick same gradient
    const hash = productName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const [startColor, endColor] = getProductGradient(item.name);

    return (
      <TouchableOpacity
        style={[styles.productItem, { width: itemSize, height: itemSize }]}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.8}
      >
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={[styles.productImage, { backgroundColor: theme.surfaceColor }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: startColor }]}>
            {/* Gradient effect using multiple layers */}
            <View 
              style={[
                styles.gradientOverlay,
                { 
                  backgroundColor: endColor,
                  opacity: 0.6,
                }
              ]} 
            />
            <View style={styles.textContainer}>
              <Text style={styles.placeholderProductName} numberOfLines={3}>
                {item.name}
              </Text>
              {item.price && (
                <Text style={styles.placeholderPrice}>
                  ${item.price}
                </Text>
              )}
            </View>
          </View>
        )}
        
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="package" size={64} color={theme.placeholderColor} />
      <Text style={[styles.emptyTitle, { color: theme.textColor }]}>
        {t('products.empty.title')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.placeholderColor }]}>
        {t('products.empty.subtitle')}
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Icon name="alert-circle" size={48} color={theme.dangerColor} />
      <Text style={[styles.errorTitle, { color: theme.textColor }]}>
        {t('products.error.title')}
      </Text>
      <Text style={[styles.errorSubtitle, { color: theme.placeholderColor }]}>
        {error || t('products.error.subtitle')}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: theme.primaryColor }]}
        onPress={fetchProducts}
      >
        <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>
          {t('products.error.retry')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
          <Text style={[styles.loadingText, { color: theme.placeholderColor }]}>
            {t('products.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]}>
        {renderError()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textColor }]}>
          {t('products.title')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.placeholderColor }]}>
          {t('products.subtitle')}
        </Text>
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primaryColor}
            colors={[theme.primaryColor]}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  gridContainer: {
    padding: 16,
    gap: 12,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productItem: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  textContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    padding: 16,
  },
  placeholderProductName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  placeholderPrice: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
