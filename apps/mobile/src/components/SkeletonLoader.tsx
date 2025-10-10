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
  style,
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

// Product Card Skeleton - Premium Design
interface ProductCardSkeletonProps {
  itemSize?: number;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ itemSize }) => {
  const numColumns = 2;
  const cardWidth = itemSize || (width - 32 - 12) / numColumns;

  return (
    <View style={[styles.productCard, { width: cardWidth, height: cardWidth }]}>
      {/* Main card skeleton with rounded corners and shadow */}
      <View style={styles.productCardInner}>
        {/* Full card shimmer effect */}
        <SkeletonBox
          width={cardWidth}
          height={cardWidth}
          borderRadius={16}
          style={styles.productCardShimmer}
        />

        {/* Bottom info section overlay (darker) */}
        <View style={styles.productCardBottomInfo}>
          {/* Title lines */}
          <SkeletonBox
            width={cardWidth * 0.7}
            height={14}
            borderRadius={4}
            style={styles.productTitleLine}
          />
          <SkeletonBox
            width={cardWidth * 0.5}
            height={14}
            borderRadius={4}
            style={styles.productTitleLine}
          />
          {/* Price */}
          <SkeletonBox
            width={60}
            height={16}
            borderRadius={6}
            style={styles.productPriceLine}
          />
        </View>
      </View>
    </View>
  );
};

// Products Grid Skeleton
interface ProductsSkeletonProps {
  count?: number;
}

export const ProductsSkeleton: React.FC<ProductsSkeletonProps> = ({ count = 6 }) => {
  const numColumns = 2;
  const itemSize = (width - 32 - 12) / numColumns;

  // Group items into rows
  const rows: number[][] = [];
  for (let i = 0; i < count; i += numColumns) {
    rows.push(Array.from({ length: Math.min(numColumns, count - i) }, (_, j) => i + j));
  }

  return (
    <View style={styles.skeletonGrid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.skeletonRow}>
          {row.map((index) => (
            <ProductCardSkeleton key={index} itemSize={itemSize} />
          ))}
        </View>
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
    overflow: 'hidden',
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  productCardInner: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  productCardShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  productCardBottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    gap: 6,
  },
  productTitleLine: {
    alignSelf: 'center',
  },
  productPriceLine: {
    alignSelf: 'center',
    marginTop: 4,
  },
  skeletonGrid: {
    padding: 16,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
