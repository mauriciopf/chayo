import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { SkeletonBox } from './SkeletonLoader';

interface Product {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  price?: number;
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
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [startColor, endColor] = getProductGradient(item.name);

  return (
    <TouchableOpacity
      style={[styles.productItem, { width: itemSize, height: itemSize }]}
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      {item.image_url && !imageError ? (
        <View style={styles.imageContainer}>
          {imageLoading && (
            <View style={[styles.productImage, styles.imageSkeleton]}>
              <SkeletonBox
                width={itemSize - 24}
                height={itemSize - 80}
                borderRadius={12}
              />
            </View>
          )}
          <Image
            source={{ uri: item.image_url }}
            style={[
              styles.productImage,
              { backgroundColor: theme.surfaceColor },
              imageLoading && { position: 'absolute', opacity: 0 },
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
            <Text style={styles.placeholderProductName} numberOfLines={3}>
              {item.name}
            </Text>
            <Text style={styles.placeholderProductPrice}>
              {item.price ? `$${item.price.toFixed(2)}` : 'Price on request'}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  productItem: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
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
});