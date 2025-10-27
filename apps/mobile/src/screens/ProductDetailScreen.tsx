import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemedStyles } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigationHeader } from '../context/NavigationContext';
import { useAppConfig } from '../hooks/useAppConfig';
import { SkeletonBox } from '../components/SkeletonLoader';
import OffersBannerComponent from '../components/OffersBannerComponent';
import Icon from 'react-native-vector-icons/Feather';

interface Product {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  price?: number;
  payment_link_url?: string;
  payment_provider_id?: string;
  supports_reservations?: boolean;
  created_at: string;
  updated_at: string;
}

export const ProductDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { product, offers, activateOffer, deactivateOffer, getOffersForProduct } = route.params as {
    product: Product;
    offers?: any[];
    activateOffer?: (offerId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
    deactivateOffer?: (offerId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
    getOffersForProduct?: (productId: string) => any[];
  };
  const { theme, fontSizes, themedStyles } = useThemedStyles();
  const { t } = useTranslation();
  const { config } = useAppConfig();
  const screenWidth = Dimensions.get('window').width;
  const [imageLoading, setImageLoading] = useState(true);

  // Use auto-cleanup navigation header
  useNavigationHeader('Detalles del Producto', {
    onBackPress: () => navigation.goBack(),
    autoCleanup: true, // Automatically return to business header when component unmounts
  });

  // Generate same gradient as in the grid for consistency
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

    const hash = productName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  const [startColor, endColor] = getProductGradient(product.name);

  const handlePurchase = () => {
    if (product.payment_link_url) {
      // Open payment link in browser
      const { Linking } = require('react-native');
      Linking.openURL(product.payment_link_url).catch((err: any) => {
        console.error('Failed to open payment link:', err);
      });
    }
  };

  const handleReservation = () => {
    // Navigate to reservation flow with product context
    (navigation as any).navigate('ReservationCalendar', {
      product,
      organizationId: config?.organizationId,
    });
  };

  return (
    <View style={[styles.container, themedStyles.container]}>
      {/* Header is now managed by NavigationContext */}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Image or Gradient Card */}
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: product.image_url }}
                style={[styles.productImage, { backgroundColor: theme.surfaceColor }]}
                resizeMode="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />
              {imageLoading && (
                <View style={styles.imageLoadingOverlay}>
                  <SkeletonBox
                    width={screenWidth}
                    height={300}
                    borderRadius={0}
                  />
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.gradientContainer, { backgroundColor: startColor }]}>
              <View
                style={[
                  styles.gradientOverlay,
                  {
                    backgroundColor: endColor,
                    opacity: 0.6,
                  },
                ]}
              />
              <View style={styles.gradientContent}>
                <Text style={[styles.gradientTitle, { fontSize: fontSizes.xl }]}>
                  {product.name}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Product Information */}
        <View style={styles.contentContainer}>
          <Text style={[styles.productTitle, { color: theme.textColor, fontSize: fontSizes.xxl }]}>
            {product.name}
          </Text>
        </View>

        {/* 🎯 OFFERS BANNER - Show relevant offers for this product */}
        {config?.organizationId && (() => {
          // Get offers that apply to this specific product
          const productOffers = getOffersForProduct ?
            getOffersForProduct(product.id) :
            offers?.filter(offer =>
              offer.products?.some((p: any) => p.id === product.id)
            ) || [];

          return productOffers.length > 0 ? (
            <OffersBannerComponent
              organizationId={config.organizationId}
              offers={productOffers}
              loading={false}
              onActivateOffer={activateOffer}
              onDeactivateOffer={deactivateOffer}
            />
          ) : null;
        })()}

        <View style={styles.contentContainer}>
          {product.description && (
            <Text style={[styles.productDescription, { color: theme.placeholderColor, fontSize: fontSizes.base }]}>
              {product.description}
            </Text>
          )}

          {product.price && (
            <View style={styles.priceContainer}>
              <Text style={[styles.priceLabel, { color: theme.placeholderColor, fontSize: fontSizes.sm }]}>
                {t('products.detail.price')}
              </Text>
              <Text style={[styles.priceValue, { color: theme.primaryColor, fontSize: fontSizes.lg }]}>
                ${product.price}
              </Text>
            </View>
          )}

          {/* Reservation Button - Only if product supports reservations */}
          {product.supports_reservations && (
            <TouchableOpacity
              style={[styles.reservationButton, { backgroundColor: theme.primaryColor }]}
              onPress={handleReservation}
              activeOpacity={0.8}
            >
              <Icon name="calendar" size={20} color="#FFFFFF" />
              <Text style={[styles.reservationButtonText, { fontSize: fontSizes.base }]}>
                Reservar
              </Text>
            </TouchableOpacity>
          )}

          {/* Purchase Button - Only show if product has payment link */}
          {product.payment_link_url && (
            <TouchableOpacity
              style={[
                styles.purchaseButton,
                {
                  backgroundColor: theme.primaryColor,
                },
              ]}
              onPress={handlePurchase}
              activeOpacity={0.8}
            >
              <Icon
                name="shopping-cart"
                size={20}
                color="#FFFFFF"
              />
              <Text style={[styles.purchaseButtonText, { fontSize: fontSizes.base }]}>
                {`${t('products.detail.purchase')} $${product.price}`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Additional Information */}
          <View style={styles.additionalInfo}>
            <Text style={[styles.sectionTitle, { color: theme.textColor, fontSize: fontSizes.md }]}>
              {t('products.detail.details')}
            </Text>

            <View style={styles.infoRow}>
              <Icon name="calendar" size={16} color={theme.placeholderColor} />
              <Text style={[styles.infoText, { color: theme.placeholderColor, fontSize: fontSizes.sm }]}>
                {t('products.detail.addedOn')} {new Date(product.created_at).toLocaleDateString()}
              </Text>
            </View>

            {product.payment_link_url && (
              <View style={styles.infoRow}>
                <Icon name="credit-card" size={16} color={theme.placeholderColor} />
                <Text style={[styles.infoText, { color: theme.placeholderColor, fontSize: fontSizes.sm }]}>
                  {t('products.detail.paymentConfigured')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    marginBottom: 24,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F2F2F7',
  },
  gradientContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientContent: {
    zIndex: 1,
    padding: 32,
  },
  gradientTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 34,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 30,
  },
  productDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  priceContainer: {
    marginBottom: 32,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  reservationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  reservationButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 32,
    gap: 8,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  additionalInfo: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
});
