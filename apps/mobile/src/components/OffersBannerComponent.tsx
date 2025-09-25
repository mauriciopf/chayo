import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useThemedStyles } from '@/lib/hooks/useThemedStyles'
import { useAuth } from '@/lib/hooks/useAuth'

const { width: screenWidth } = Dimensions.get('window')

interface Offer {
  id: string
  name: string
  description: string
  offer_type: 'percentage' | 'fixed_amount'
  offer_value: number
  start_date: string
  end_date: string
  status: 'active' | 'inactive' | 'expired'
  ai_banner_url?: string
  products: Product[]
  product_count: number
  is_activated_by_user: boolean
  activated_at?: string
}

interface Product {
  id: string
  name: string
  description?: string
  price?: number
  discounted_price?: number
  image_url?: string
}

interface OffersBannerComponentProps {
  organizationId: string
  onLoginRequired?: () => void
}

export default function OffersBannerComponent({ 
  organizationId, 
  onLoginRequired 
}: OffersBannerComponentProps) {
  const { theme } = useThemedStyles()
  const { user } = useAuth()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState<string | null>(null)
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [showOfferModal, setShowOfferModal] = useState(false)

  useEffect(() => {
    fetchActiveOffers()
  }, [organizationId, user?.id])

  const fetchActiveOffers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        organizationId,
        ...(user?.id && { userId: user.id })
      })

      const response = await fetch(`/api/offers/active?${params}`)
      const data = await response.json()

      if (response.ok) {
        setOffers(data.offers || [])
      } else {
        console.error('Failed to fetch offers:', data.error)
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleActivateOffer = async (offerId: string) => {
    if (!user) {
      onLoginRequired?.()
      return
    }

    setActivating(offerId)

    try {
      const response = await fetch(`/api/offers/${offerId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          organizationId
        })
      })

      const data = await response.json()

      if (response.ok) {
        Alert.alert(
          '🎉 Offer Activated!',
          'Your discount has been applied to all eligible products. Happy shopping!',
          [{ text: 'Awesome!', style: 'default' }]
        )
        fetchActiveOffers() // Refresh offers
      } else {
        Alert.alert('Error', data.error || 'Failed to activate offer')
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.')
    } finally {
      setActivating(null)
    }
  }

  const handleDeactivateOffer = async (offerId: string) => {
    if (!user) return

    Alert.alert(
      'Deactivate Offer',
      'Are you sure you want to deactivate this offer? You can reactivate it anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`/api/offers/${offerId}/activate?userId=${user.id}`, {
                method: 'DELETE'
              })

              if (response.ok) {
                Alert.alert('Offer Deactivated', 'The offer has been removed from your account.')
                fetchActiveOffers()
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to deactivate offer')
            }
          }
        }
      ]
    )
  }

  const formatDiscount = (offer: Offer) => {
    return offer.offer_type === 'percentage' 
      ? `${offer.offer_value}% OFF`
      : `$${offer.offer_value} OFF`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

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
      width: '100%',
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
      color: theme.textSecondary,
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
      maxHeight: '80%',
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
      color: theme.textPrimary,
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
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    productImage: {
      width: '100%',
      height: 80,
      borderRadius: 8,
      marginBottom: 8,
    },
    productName: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: theme.textPrimary,
      marginBottom: 4,
    },
    priceContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    originalPrice: {
      fontSize: 12,
      color: theme.textSecondary,
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
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accentColor} />
      </View>
    )
  }

  if (offers.length === 0) {
    return null // Don't show anything if no offers
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
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fallbackBanner}
              >
                <Text style={styles.fallbackTitle}>{offer.name}</Text>
                <Text style={styles.fallbackDescription}>{formatDiscount(offer)}</Text>
              </LinearGradient>
            )}
            
            <View style={styles.bannerContent}>
              <View style={styles.bannerHeader}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{formatDiscount(offer)}</Text>
                </View>
                {offer.is_activated_by_user && (
                  <View style={styles.activatedBadge}>
                    <Text style={styles.activatedText}>✓ ACTIVE</Text>
                  </View>
                )}
              </View>

              <View>
                <Text style={styles.bannerTitle}>{offer.name}</Text>
                <Text style={styles.bannerDescription} numberOfLines={2}>
                  {offer.description}
                </Text>
              </View>

              <View style={styles.bannerFooter}>
                <Text style={styles.expiryText}>
                  Expires {formatDate(offer.end_date)}
                </Text>
                
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.viewButton]}
                    onPress={() => {
                      setSelectedOffer(offer)
                      setShowOfferModal(true)
                    }}
                  >
                    <Ionicons name="eye" size={16} color="white" />
                    <Text style={styles.buttonText}>View</Text>
                  </TouchableOpacity>

                  {offer.is_activated_by_user ? (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deactivateButton]}
                      onPress={() => handleDeactivateOffer(offer.id)}
                    >
                      <Ionicons name="close" size={16} color="white" />
                      <Text style={styles.buttonText}>Remove</Text>
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
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                      <Text style={styles.buttonText}>
                        {activating === offer.id ? 'Activating...' : 'Activate'}
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
              <Text style={styles.modalTitle}>
                {selectedOffer?.name} - {selectedOffer && formatDiscount(selectedOffer)}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowOfferModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ color: theme.textSecondary, marginBottom: 16 }}>
                {selectedOffer?.description}
              </Text>

              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: theme.textPrimary, 
                marginBottom: 12 
              }}>
                Products in this offer ({selectedOffer?.product_count})
              </Text>

              <View style={styles.productGrid}>
                {selectedOffer?.products.map((product) => (
                  <View key={product.id} style={styles.productCard}>
                    {product.image_url ? (
                      <Image 
                        source={{ uri: product.image_url }} 
                        style={styles.productImage} 
                      />
                    ) : (
                      <View style={[
                        styles.productImage, 
                        { backgroundColor: theme.borderColor, justifyContent: 'center', alignItems: 'center' }
                      ]}>
                        <Ionicons name="cube-outline" size={24} color={theme.textSecondary} />
                      </View>
                    )}
                    
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    
                    {product.price && (
                      <View>
                        <View style={styles.priceContainer}>
                          {product.discounted_price ? (
                            <>
                              <Text style={styles.originalPrice}>${product.price}</Text>
                              <Text style={styles.discountedPrice}>${product.discounted_price}</Text>
                            </>
                          ) : (
                            <Text style={styles.discountedPrice}>${product.price}</Text>
                          )}
                        </View>
                        {product.discounted_price && (
                          <View style={styles.saleTag}>
                            <Text style={styles.saleTagText}>ON SALE</Text>
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
    </View>
  )
}
