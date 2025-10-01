import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '../services/StorageService';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

interface VibeCard {
  business_name: string;
  business_type: string;
  origin_story: string;
  value_badges: string[];
  perfect_for: string[];
  vibe_colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  vibe_aesthetic: string;
  ai_generated_image_url?: string;
}

interface OrganizationData {
  id: string;
  name: string;
  slug: string;
}

type BusinessInitialViewNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'BusinessInitialView'
>;

const BusinessInitialView: React.FC = () => {
  const navigation = useNavigation<BusinessInitialViewNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [vibeCard, setVibeCard] = useState<VibeCard | null>(null);
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadVibeCard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get stored organization slug
      const slug = await StorageService.getOrganizationSlug();

      if (!slug) {
        setError('No hay negocio configurado');
        return;
      }

      // Fetch vibe card from API
      const response = await fetch(`https://chayo.vercel.app/api/vibe-card/${slug}`);

      if (!response.ok) {
        throw new Error('No se pudo cargar la información del negocio');
      }

      const data = await response.json();

      if (data.success) {
        setOrganization(data.organization);
        setVibeCard(data.vibeCard);
      } else {
        throw new Error('Negocio no encontrado');
      }
    } catch (err: any) {
      console.error('Error loading vibe card:', err);
      setError(err.message || 'Error al cargar el negocio');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVibeCard();
  }, [loadVibeCard]);

  const handleEnterBusiness = () => {
    if (organization) {
      navigation.navigate('BusinessDetail', {
        organizationSlug: organization.slug,
        businessName: organization.name,
      });
    }
  };

  const handleGoToMarketplace = async () => {
    // Clear stored slug and go to marketplace
    await StorageService.clearOrganizationSlug();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Marketplace' }],
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B7355" />
          <Text style={styles.loadingText}>Cargando negocio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !vibeCard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error || 'Error al cargar'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadVibeCard}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.marketplaceButton} onPress={handleGoToMarketplace}>
            <Text style={styles.marketplaceButtonText}>Ir al Mercado</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const primaryColor = vibeCard.vibe_colors?.primary || '#8B7355';
  const secondaryColor = vibeCard.vibe_colors?.secondary || '#A8956F';
  const accentColor = vibeCard.vibe_colors?.accent || '#E6D7C3';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: accentColor }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Image */}
        {vibeCard.ai_generated_image_url && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: vibeCard.ai_generated_image_url }}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={[styles.imageOverlay, { backgroundColor: `${primaryColor}99` }]} />
          </View>
        )}

        {/* Business Info Card */}
        <View style={[styles.card, { backgroundColor: '#FFFFFF' }]}>
          {/* Business Name */}
          <Text style={[styles.businessName, { color: primaryColor }]}>
            {vibeCard.business_name}
          </Text>

          {/* Business Type */}
          <View style={[styles.typeBadge, { backgroundColor: secondaryColor }]}>
            <Text style={styles.typeText}>{vibeCard.business_type}</Text>
          </View>

          {/* Aesthetic Badge */}
          <View style={[styles.aestheticBadge, { borderColor: primaryColor }]}>
            <Text style={[styles.aestheticText, { color: primaryColor }]}>
              ✨ {vibeCard.vibe_aesthetic}
            </Text>
          </View>

          {/* Origin Story */}
          {vibeCard.origin_story && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: primaryColor }]}>
                Nuestra Historia
              </Text>
              <Text style={styles.storyText}>{vibeCard.origin_story}</Text>
            </View>
          )}

          {/* Value Badges */}
          {vibeCard.value_badges && vibeCard.value_badges.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: primaryColor }]}>
                Nuestros Valores
              </Text>
              <View style={styles.badgesContainer}>
                {vibeCard.value_badges.map((badge, index) => (
                  <View
                    key={index}
                    style={[styles.badge, { borderColor: secondaryColor }]}
                  >
                    <Text style={[styles.badgeText, { color: primaryColor }]}>
                      ✓ {badge}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Perfect For */}
          {vibeCard.perfect_for && vibeCard.perfect_for.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: primaryColor }]}>
                Perfecto Para
              </Text>
              <View style={styles.badgesContainer}>
                {vibeCard.perfect_for.map((item, index) => (
                  <View
                    key={index}
                    style={[styles.perfectForBadge, { backgroundColor: accentColor }]}
                  >
                    <Text style={[styles.perfectForText, { color: primaryColor }]}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.enterButton, { backgroundColor: primaryColor }]}
              onPress={handleEnterBusiness}
            >
              <Text style={styles.enterButtonText}>Entrar al Negocio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: primaryColor }]}
              onPress={handleGoToMarketplace}
            >
              <Text style={[styles.secondaryButtonText, { color: primaryColor }]}>
                Explorar Otros Negocios
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8B7355',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#8B7355',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  marketplaceButton: {
    borderWidth: 1,
    borderColor: '#8B7355',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  marketplaceButtonText: {
    color: '#8B7355',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  card: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  businessName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  typeBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  aestheticBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  aestheticText: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  storyText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  perfectForBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  perfectForText: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionsContainer: {
    marginTop: 32,
    gap: 12,
  },
  enterButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  enterButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BusinessInitialView;

