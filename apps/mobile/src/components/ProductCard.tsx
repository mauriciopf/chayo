import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { PremiumProductCardSkeleton } from './PremiumProductCardSkeleton';
import { useThemedStyles } from '../context/ThemeContext';

interface Product {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  price?: number;
  discounted_price?: number;
  has_active_offer: boolean;
  payment_transaction_id?: string;
  created_at: string;
  updated_at: string;
}

interface ProductCardProps {
  item: Product;
  itemSize: number;
  onPress: (product: Product) => void;
  theme: any;
  getProductGradient: (name: string) => [string, string];
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  itemSize,
  onPress,
  theme,
  getProductGradient,
}) => {
  const { fontSizes } = useThemedStyles();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [startColor, endColor] = getProductGradient(item.name);
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!imageLoading) {
      // Smooth fade-in when image loads
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [imageLoading, imageOpacity]);

  const handlePressIn = () => {
    Animated.spring(cardScale, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(cardScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: cardScale }] }]}>
      <TouchableOpacity
        style={[styles.productItem, { width: itemSize, height: itemSize }]}
        onPress={() => onPress(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
      {item.image_url && !imageError ? (
        <View style={styles.imageContainer}>
          {imageLoading && (
            <View style={[styles.productImage, styles.imageSkeleton]}>
              <PremiumProductCardSkeleton
                width={itemSize - 24}
                height={itemSize - 80}
                theme={theme}
              />
            </View>
          )}
          <Animated.Image
            source={{ uri: item.image_url }}
            style={[
              styles.productImage,
              {
                backgroundColor: theme.surfaceColor,
                opacity: imageOpacity,
              },
            ]}
            resizeMode="cover"
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        </View>
      ) : (
        <View style={[styles.placeholderImage, { backgroundColor: startColor }]}>
          {/* Gradient effect using multiple layers */}
          <View
            style={[
              styles.gradientOverlay,
              {
                backgroundColor: endColor,
                opacity: 0.6,
              },
            ]}
          />
          <View style={styles.textContainer}>
            <Text style={[styles.placeholderProductName, { fontSize: fontSizes.md }]} numberOfLines={3}>
              {item.name}
            </Text>
            <View style={styles.priceContainer}>
              {item.discounted_price ? (
                <>
                  <Text style={[styles.placeholderProductPrice, styles.originalPrice, { fontSize: fontSizes.xs }]}>
                    ${item.price?.toFixed(2)}
                  </Text>
                  <Text style={[styles.discountedPrice, { fontSize: fontSizes.base }]}>
                    ${item.discounted_price.toFixed(2)}
                  </Text>
                  <View style={styles.saleTag}>
                    <Text style={[styles.saleTagText, { fontSize: fontSizes.xs }]}>SALE</Text>
                  </View>
                </>
              ) : (
                <Text style={[styles.placeholderProductPrice, { fontSize: fontSizes.sm }]}>
                  {item.price ? `$${item.price.toFixed(2)}` : 'Price on request'}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  productItem: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
    // Premium shadows for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imageSkeleton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    // Premium shadow while loading
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    borderRadius: 12,
  },
  textContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  placeholderProductName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  placeholderProductPrice: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  priceContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
    fontSize: 10,
  },
  discountedPrice: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  saleTag: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  saleTagText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
