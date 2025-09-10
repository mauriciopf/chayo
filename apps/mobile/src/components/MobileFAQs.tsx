import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';

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

interface MobileFAQsProps {
  organizationSlug: string;
  businessName?: string;
  baseUrl?: string;
}

const MobileFAQs: React.FC<MobileFAQsProps> = ({
  organizationSlug,
  businessName = 'Our Business',
  baseUrl = 'https://chayo.ai',
}) => {
  const { theme, themedStyles } = useThemedStyles();
  const { t } = useTranslation();
  const [faqs, setFAQs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const fetchFAQs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/faqs/${organizationSlug}`);

      if (!response.ok) {
        throw new Error('Failed to fetch FAQs');
      }

      const data = await response.json();
      setFAQs(data.faqs || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      setError('Failed to load FAQs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [baseUrl, organizationSlug]);

  // Fetch FAQs on component mount
  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const renderFAQItem = (item: FAQItem) => {
    const isExpanded = expandedItems.has(item.id);

    return (
      <View key={item.id} style={[styles.faqItem, { backgroundColor: theme.surfaceColor, borderColor: theme.borderColor }]}>
        <TouchableOpacity
          style={styles.questionContainer}
          onPress={() => toggleItem(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.questionHeader}>
            <Text style={[styles.questionText, themedStyles.primaryText]}>{item.question}</Text>
            <View style={styles.iconContainer}>
              <Text style={[styles.expandIcon, { color: theme.primaryColor }, isExpanded && styles.expandIconRotated]}>
                ▼
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={[styles.answerContainer, { borderTopColor: theme.borderColor, backgroundColor: theme.backgroundColor }]}>
            <Text style={[styles.answerText, themedStyles.secondaryText]}>{item.answer}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderFAQCategory = (faq: FAQ) => (
    <View key={faq.id} style={styles.faqCategory}>
      <View style={[styles.categoryHeader, { backgroundColor: theme.surfaceColor }]}>
        <Text style={[styles.categoryTitle, themedStyles.primaryText]}>{faq.name}</Text>
        {faq.description && (
          <Text style={[styles.categoryDescription, themedStyles.secondaryText]}>{faq.description}</Text>
        )}
      </View>

      <View style={[styles.faqList, { backgroundColor: theme.backgroundColor }]}>
        {faq.faq_items
          .sort((a, b) => a.order - b.order)
          .map((item) => renderFAQItem(item))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]}>
        <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundColor }]}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
          <Text style={[styles.loadingText, themedStyles.primaryText]}>Loading FAQs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]}>
        <View style={[styles.errorContainer, { backgroundColor: theme.backgroundColor }]}>
          <Text style={[styles.errorText, { color: theme.errorColor }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primaryColor }]} onPress={fetchFAQs}>
            <Text style={[styles.retryButtonText, { color: theme.backgroundColor }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.backgroundColor, borderBottomColor: theme.borderColor }]}>
        <Text style={[styles.headerTitle, themedStyles.primaryText]}>Help & FAQs</Text>
        <Text style={[styles.headerSubtitle, themedStyles.secondaryText]}>{businessName}</Text>
      </View>

      <ScrollView style={[styles.content, { backgroundColor: theme.backgroundColor }]} showsVerticalScrollIndicator={false}>
        {faqs.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: theme.backgroundColor }]}>
            <Text style={[styles.emptyText, themedStyles.primaryText]}>No FAQs available</Text>
            <Text style={[styles.emptySubtext, themedStyles.secondaryText]}>
              Check back later for helpful information
            </Text>
          </View>
        ) : (
          faqs.map((faq) => renderFAQCategory(faq))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  header: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },

  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#FF453A',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0A84FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.6,
    textAlign: 'center',
  },

  faqCategory: {
    marginBottom: 24,
  },
  categoryHeader: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  faqList: {
    backgroundColor: '#1C1C1E',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  questionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 12,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandIcon: {
    fontSize: 12,
    color: '#8E8E93',
    transform: [{ rotate: '0deg' }],
  },
  expandIconRotated: {
    transform: [{ rotate: '180deg' }],
  },

  answerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#2C2C2E',
  },
  answerText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFF',
    opacity: 0.9,
  },
});

export default MobileFAQs;
