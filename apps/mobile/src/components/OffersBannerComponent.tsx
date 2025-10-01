import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { useThemedStyles } from '../context/ThemeContext';
import { offersService, Offer } from '../services/OffersService';
import LoginModal from './LoginModal';

const { width: screenWidth } = Dimensions.get('window');

interface OffersBannerComponentProps {
  organizationId: string
  offers?: Offer[]
  loading?: boolean
  onActivateOffer?: (offerId: string, userId: string) => Promise<{ success: boolean; error?: string }>
  onDeactivateOffer?: (offerId: string, userId: string) => Promise<{ success: boolean; error?: string }>
}

export default function OffersBannerComponent({
  organizationId,
  offers: propsOffers,
  loading: propsLoading,
  onActivateOffer: propsActivateOffer,
  onDeactivateOffer: propsDeactivateOffer,
}: OffersBannerComponentProps) {
  const theme = useTheme();
  const { fontSizes } = useThemedStyles();
  const { user } = useAuth();
  const [internalOffers, setInternalOffers] = useState<Offer[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Use props if provided, otherwise use internal state
  const offers = propsOffers || internalOffers;
  const loading = propsLoading !== undefined ? propsLoading : internalLoading;

  const fetchActiveOffers = useCallback(async () => {
    // Only fetch internally if no props are provided
    if (propsOffers) {return;}

    try {
      setInternalLoading(true);

      console.log('🎯 OffersBannerComponent: Fetching available offers for organizationId:', organizationId, 'userId:', user?.id);

      const result = await offersService.getActiveOffers(organizationId, user?.id);

      console.log('🎯 OffersBannerComponent: Service response:', result);

      if (result.success) {
        setInternalOffers(result.offers || []);
        console.log('🎯 OffersBannerComponent: Set offers:', result.offers?.length || 0, 'offers');
      } else {
        console.error('No se pudieron obtener las ofertas:', result.error);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setInternalLoading(false);
    }
  }, [organizationId, user?.id, propsOffers]);

  useEffect(() => {
    fetchActiveOffers();
  }, [fetchActiveOffers]);

  const handleActivateOffer = async (offerId: string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setActivating(offerId);

    try {
      let result;

      // Use props function if provided, otherwise use service directly
      if (propsActivateOffer) {
        result = await propsActivateOffer(offerId, user.id);
      } else {
        result = await offersService.activateOffer(offerId, user.id, organizationId);
        if (result.success) {
          fetchActiveOffers(); // Refresh offers only if using internal state
        }
      }

      if (result.success) {
        Alert.alert(
          '🎉 ¡Oferta Activada!',
          '¡Tu descuento ha sido aplicado a todos los productos elegibles. Felices compras!',
          [{ text: '¡Genial!', style: 'default' }]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo activar la oferta');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de red. Intenta de nuevo.');
    } finally {
      setActivating(null);
    }
  };

  const handleDeactivateOffer = async (offerId: string) => {
    if (!user) {return;}

    Alert.alert(
      'Desactivar Oferta',
      '¿Estás seguro de que quieres desactivar esta oferta? Puedes reactivarla en cualquier momento.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              let result;

              // Use props function if provided, otherwise use service directly
              if (propsDeactivateOffer) {
                result = await propsDeactivateOffer(offerId, user.id);
              } else {
                result = await offersService.deactivateOffer(offerId, user.id);
                if (result.success) {
                  fetchActiveOffers(); // Refresh offers only if using internal state
                }
              }

              if (result.success) {
                Alert.alert('Oferta Desactivada', 'La oferta ha sido removida de tu cuenta.');
              } else {
                Alert.alert('Error', result.error || 'No se pudo desactivar la oferta');
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo desactivar la oferta');
            }
          },
        },
      ]
    );
  };

  const formatDiscount = (offer: Offer) => {
    return offer.offer_type === 'percentage'
      ? `${offer.offer_value}% OFF`
      : `$${offer.offer_value} OFF`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const styles = {
    container: {
      marginBottom: 16,
    },
    bannerContainer: {
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 16,
      overflow: 'hidden' as const,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    bannerImage: {
      width: screenWidth - 32,
      height: 160,
      resizeMode: 'cover' as const,
    },
    bannerOverlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    bannerContent: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      padding: 20,
      justifyContent: 'space-between' as const,
    },
    bannerHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
    },
    discountBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: '#FF6B6B',
    },
    discountText: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold' as const,
    },
    activatedBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: '#4ECDC4',
    },
    activatedText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600' as const,
    },
    bannerTitle: {
      color: 'white',
      fontSize: 24,
      fontWeight: 'bold' as const,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
      marginBottom: 4,
    },
    bannerDescription: {
      color: 'white',
      fontSize: 14,
      opacity: 0.9,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    bannerFooter: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    expiryText: {
      color: 'white',
      fontSize: 12,
      opacity: 0.8,
    },
    actionButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 25,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    activateButton: {
      backgroundColor: '#4ECDC4',
    },
    deactivateButton: {
      backgroundColor: '#FF6B6B',
    },
    viewButton: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    buttonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600' as const,
    },
    fallbackBanner: {
      height: 160,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: 20,
    },
    fallbackTitle: {
      fontSize: 20,
      fontWeight: 'bold' as const,
      color: 'white',
      textAlign: 'center' as const,
      marginBottom: 8,
    },
    fallbackDescription: {
      fontSize: 14,
      color: 'white',
      textAlign: 'center' as const,
      opacity: 0.9,
    },
    loadingContainer: {
      height: 100,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    emptyContainer: {
      padding: 20,
      alignItems: 'center' as const,
    },
    emptyText: {
      fontSize: 16,
      color: theme.placeholderColor,
      textAlign: 'center' as const,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    modalContent: {
      backgroundColor: theme.backgroundColor,
      borderRadius: 20,
      padding: 20,
      margin: 20,
      maxHeight: '80%' as any,
    },
    modalHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold' as const,
      color: theme.textColor,
    },
    closeButton: {
      padding: 8,
    },
    productGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 12,
    },
    productCard: {
      width: (screenWidth - 80) / 2,
      backgroundColor: theme.surfaceColor,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    productImage: {
      width: (screenWidth - 80) / 2 - 24,
      height: 80,
      borderRadius: 8,
      marginBottom: 8,
    },
    productName: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: theme.textColor,
      marginBottom: 4,
    },
    priceContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    originalPrice: {
      fontSize: 12,
      color: theme.placeholderColor,
      textDecorationLine: 'line-through' as const,
    },
    discountedPrice: {
      fontSize: 14,
      fontWeight: 'bold' as const,
      color: '#4ECDC4',
    },
    saleTag: {
      backgroundColor: '#FF6B6B',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginTop: 4,
    },
    saleTagText: {
      color: 'white',
      fontSize: 10,
      fontWeight: 'bold' as const,
    },
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
      </View>
    );
  }

  if (offers.length === 0) {
    return null; // Don't show anything if no offers
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={screenWidth - 32}
        snapToAlignment="center"
        contentInsetAdjustmentBehavior="automatic"
      >
        {offers.map((offer) => (
          <View key={offer.id} style={styles.bannerContainer}>
            {offer.ai_banner_url ? (
              <>
                <Image source={{ uri: offer.ai_banner_url }} style={styles.bannerImage} />
                <View style={styles.bannerOverlay} />
              </>
            ) : (
              <View style={[styles.fallbackBanner, { backgroundColor: '#667eea' }]}>
                <Text style={[styles.fallbackTitle, { fontSize: fontSizes.lg }]}>{offer.name}</Text>
                <Text style={[styles.fallbackDescription, { fontSize: fontSizes.base }]}>{formatDiscount(offer)}</Text>
              </View>
            )}

            <View style={styles.bannerContent}>
              <View style={styles.bannerHeader}>
                <View style={styles.discountBadge}>
                  <Text style={[styles.discountText, { fontSize: fontSizes.md }]}>{formatDiscount(offer)}</Text>
                </View>
                {offer.is_activated_by_user && (
                  <View style={styles.activatedBadge}>
                    <Text style={[styles.activatedText, { fontSize: fontSizes.xs }]}>✓ ACTIVA</Text>
                  </View>
                )}
              </View>

              <View>
                <Text style={[styles.bannerTitle, { fontSize: fontSizes.lg }]}>{offer.name}</Text>
                <Text style={[styles.bannerDescription, { fontSize: fontSizes.sm }]} numberOfLines={2}>
                  {offer.description}
                </Text>
              </View>

              <View style={styles.bannerFooter}>
                <Text style={[styles.expiryText, { fontSize: fontSizes.xs }]}>
                  Expira {formatDate(offer.end_date)}
                </Text>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.viewButton]}
                    onPress={() => {
                      setSelectedOffer(offer);
                      setShowOfferModal(true);
                    }}
                  >
                    <Icon name="eye" size={16} color="white" />
                    <Text style={[styles.buttonText, { fontSize: fontSizes.sm }]}>Ver</Text>
                  </TouchableOpacity>

                  {offer.is_activated_by_user ? (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deactivateButton]}
                      onPress={() => handleDeactivateOffer(offer.id)}
                    >
                      <Icon name="x" size={16} color="white" />
                      <Text style={[styles.buttonText, { fontSize: fontSizes.sm }]}>Remover</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.activateButton]}
                      onPress={() => handleActivateOffer(offer.id)}
                      disabled={activating === offer.id}
                    >
                      {activating === offer.id ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Icon name="check" size={16} color="white" />
                      )}
                      <Text style={[styles.buttonText, { fontSize: fontSizes.sm }]}>
                        {activating === offer.id ? 'Activando...' : 'Activar'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Offer Details Modal */}
      <Modal
        visible={showOfferModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOfferModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontSize: fontSizes.xl }]}>
                {selectedOffer?.name} - {selectedOffer && formatDiscount(selectedOffer)}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowOfferModal(false)}
              >
                <Icon name="x" size={24} color={theme.textColor} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ color: theme.placeholderColor, marginBottom: 16, fontSize: fontSizes.sm }}>
                {selectedOffer?.description}
              </Text>

              <Text style={{
                fontSize: fontSizes.md,
                fontWeight: '600',
                color: theme.textColor,
                marginBottom: 12,
              }}>
                Productos en esta oferta ({selectedOffer?.product_count})
              </Text>

              <View style={styles.productGrid}>
                {selectedOffer?.products?.map((product) => (
                  <View key={product.id} style={styles.productCard}>
                    {product.image_url ? (
                      <Image
                        source={{ uri: product.image_url }}
                        style={styles.productImage}
                      />
                    ) : (
                      <View style={[
                        styles.productImage,
                        { backgroundColor: theme.borderColor, justifyContent: 'center', alignItems: 'center' },
                      ]}>
                        <Icon name="package" size={24} color={theme.placeholderColor} />
                      </View>
                    )}

                    <Text style={[styles.productName, { fontSize: fontSizes.sm }]} numberOfLines={2}>
                      {product.name}
                    </Text>

                    {product.price && (
                      <View>
                        <View style={styles.priceContainer}>
                          {product.discounted_price ? (
                            <>
                              <Text style={[styles.originalPrice, { fontSize: fontSizes.xs }]}>${product.price}</Text>
                              <Text style={[styles.discountedPrice, { fontSize: fontSizes.sm }]}>${product.discounted_price}</Text>
                            </>
                          ) : (
                            <Text style={[styles.discountedPrice, { fontSize: fontSizes.sm }]}>${product.price}</Text>
                          )}
                        </View>
                        {product.discounted_price && (
                          <View style={styles.saleTag}>
                            <Text style={[styles.saleTagText, { fontSize: fontSizes.xs }]}>EN OFERTA</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Login Modal */}
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
          // Refresh offers after login to update activation status
          fetchActiveOffers();
        }}
        title="Se requiere iniciar sesión"
        message="Inicia sesión para activar esta oferta exclusiva y comenzar a ahorrar"
      />
    </View>
  );
}
