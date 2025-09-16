import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

interface SkeletonLoaderProps {
  width?: number;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonBox: React.FC<SkeletonLoaderProps> = ({ 
  width: boxWidth = 100, 
  height = 20, 
  borderRadius = 8,
  style 
}) => {
  const { theme } = useThemedStyles();
  const translateX = useRef(new Animated.Value(-boxWidth)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(translateX, {
        toValue: boxWidth,
        duration: 1500,
        useNativeDriver: true,
      })
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [translateX, boxWidth]);

  // Use theme-aware colors
  const baseColor = theme.surfaceColor || '#2C2C2E';
  const shimmerColor = theme.borderColor || '#3A3A3C';

  return (
    <View
      style={[
        {
          width: boxWidth,
          height,
          borderRadius,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: shimmerColor,
          opacity: 0.6,
          transform: [{ translateX }],
        }}
      />
    </View>
  );
};

// Product Card Skeleton
export const ProductCardSkeleton: React.FC = () => {
  const { themedStyles } = useThemedStyles();
  const cardWidth = (width - 48) / 2; // Same as marketplace cards

  return (
    <View style={[styles.productCard, themedStyles.surface, { width: cardWidth }]}>
      {/* Product Image Skeleton */}
      <SkeletonBox 
        width={cardWidth - 24} 
        height={120} 
        borderRadius={12}
        style={styles.imageSkeleton}
      />
      
      {/* Product Title Skeleton */}
      <SkeletonBox 
        width={cardWidth - 40} 
        height={18} 
        borderRadius={4}
        style={styles.titleSkeleton}
      />
      
      {/* Product Description Skeleton */}
      <SkeletonBox 
        width={cardWidth - 60} 
        height={14} 
        borderRadius={4}
        style={styles.descriptionSkeleton}
      />
      
      {/* Price Skeleton */}
      <SkeletonBox 
        width={60} 
        height={20} 
        borderRadius={6}
        style={styles.priceSkeleton}
      />
    </View>
  );
};

// Products Grid Skeleton
interface ProductsSkeletonProps {
  count?: number;
}

export const ProductsSkeleton: React.FC<ProductsSkeletonProps> = ({ count = 6 }) => {
  return (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </View>
  );
};

// FAQ Item Skeleton
export const FAQSkeleton: React.FC = () => {
  const { themedStyles } = useThemedStyles();
  return (
    <View style={[styles.faqItem, themedStyles.surface]}>
      <SkeletonBox width={width - 64} height={20} borderRadius={4} style={{ marginBottom: 8 }} />
      <SkeletonBox width={width - 100} height={16} borderRadius={4} style={{ marginBottom: 4 }} />
      <SkeletonBox width={width - 120} height={16} borderRadius={4} />
    </View>
  );
};

// Appointment Card Skeleton
export const AppointmentSkeleton: React.FC = () => {
  const { themedStyles } = useThemedStyles();
  return (
    <View style={[styles.appointmentCard, themedStyles.surface]}>
      <View style={styles.appointmentHeader}>
        <SkeletonBox width={120} height={18} borderRadius={4} />
        <SkeletonBox width={60} height={16} borderRadius={4} />
      </View>
      <SkeletonBox width={width - 80} height={14} borderRadius={4} style={{ marginTop: 8 }} />
      <SkeletonBox width={100} height={14} borderRadius={4} style={{ marginTop: 4 }} />
    </View>
  );
};

// Document Item Skeleton
export const DocumentSkeleton: React.FC = () => {
  const { themedStyles } = useThemedStyles();
  return (
    <View style={[styles.documentItem, themedStyles.surface]}>
      <View style={styles.documentIcon}>
        <SkeletonBox width={40} height={40} borderRadius={8} />
      </View>
      <View style={styles.documentInfo}>
        <SkeletonBox width={width - 140} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
        <SkeletonBox width={100} height={12} borderRadius={4} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  productCard: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageSkeleton: {
    marginBottom: 12,
  },
  titleSkeleton: {
    marginBottom: 8,
  },
  descriptionSkeleton: {
    marginBottom: 12,
  },
  priceSkeleton: {
    alignSelf: 'flex-start',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  faqItem: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentCard: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  documentIcon: {
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
});
