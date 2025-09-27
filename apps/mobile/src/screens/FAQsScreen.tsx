import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FAQSkeleton } from '../components/SkeletonLoader';
import { SwipeFAQCards } from '../components/SwipeFAQCards';
import { useAppConfig } from '../hooks/useAppConfig';
import { useTranslation } from '../hooks/useTranslation';
import { useThemedStyles } from '../context/ThemeContext';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

interface FAQ {
  id: string;
  name: string;
  description: string;
  faq_items: FAQItem[];
  updated_at: string;
}

interface SwipeFAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface FAQsScreenProps {
  navigation?: any;
}

export const FAQsScreen: React.FC<FAQsScreenProps> = ({ navigation }) => {
  const { config } = useAppConfig();
  const { t } = useTranslation();
  const { theme, fontSizes, themedStyles } = useThemedStyles();
  const [swipeFAQs, setSwipeFAQs] = useState<SwipeFAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFAQs = useCallback(async () => {
    if (!config) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${config.apiBaseUrl}/api/faqs/${config.organizationSlug}`);

      if (!response.ok) {
        throw new Error('Failed to fetch FAQs');
      }

      const data = await response.json();
      const faqs: FAQ[] = data.faqs || [];
      
      // Transform FAQ structure for SwipeFAQCards
      const transformedFAQs: SwipeFAQ[] = [];
      
      faqs.forEach((faq) => {
        faq.faq_items
          .sort((a, b) => a.order - b.order)
          .forEach((item) => {
            transformedFAQs.push({
              id: item.id,
              question: item.question,
              answer: item.answer,
              category: faq.name,
            });
          });
      });
      
      setSwipeFAQs(transformedFAQs);
      setError(null);
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      setError('Failed to load FAQs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  const handleSwipeLeft = (faq: SwipeFAQ) => {
    // Optional: Track analytics for "not helpful" swipes
    console.log('Swiped left on FAQ:', faq.question);
  };

  const handleSwipeRight = (faq: SwipeFAQ) => {
    // Optional: Track analytics for "helpful" swipes
    console.log('Swiped right on FAQ:', faq.question);
  };

  if (!config) {
    return null;
  }

  if (loading) {
    return (
      <View style={[styles.container, themedStyles.container]}>
        <FAQSkeleton />
        <FAQSkeleton />
        <FAQSkeleton />
        <FAQSkeleton />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, themedStyles.container]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: theme.textColor, fontSize: fontSizes.xl }]}>
            Oops!
          </Text>
          <Text style={[styles.errorMessage, { color: theme.placeholderColor, fontSize: fontSizes.base }]}>
            {error}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, themedStyles.container]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.textColor, fontSize: fontSizes.xxl }]}>
          Help & FAQs
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.placeholderColor, fontSize: fontSizes.base }]}>
          {config.organizationName || 'Our Business'}
        </Text>
      </View>
      
      <SwipeFAQCards
        faqs={swipeFAQs}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});