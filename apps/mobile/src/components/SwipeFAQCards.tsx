import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import { SwipeContainer } from './SwipeContainer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.65;

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface SwipeFAQCardsProps {
  faqs: FAQ[];
  onSwipeLeft?: (faq: FAQ) => void;
  onSwipeRight?: (faq: FAQ) => void;
}

export const SwipeFAQCards: React.FC<SwipeFAQCardsProps> = ({
  faqs,
  onSwipeLeft,
  onSwipeRight,
}) => {
  const { theme, themedStyles } = useThemedStyles();
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    const currentFAQ = faqs[currentIndex];
    onSwipeRight?.(currentFAQ);
    setCurrentIndex((prev) => (prev + 1) % faqs.length);
  };

  const goToPrevious = () => {
    const currentFAQ = faqs[currentIndex];
    onSwipeLeft?.(currentFAQ);
    setCurrentIndex((prev) => (prev - 1 + faqs.length) % faqs.length);
  };

  if (faqs.length === 0) {
    return (
      <View style={[styles.container, themedStyles.container]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: theme.textColor }]}>
            No FAQs Available
          </Text>
          <Text style={[styles.emptyMessage, { color: theme.placeholderColor }]}>
            There are currently no frequently asked questions to display.
          </Text>
        </View>
      </View>
    );
  }

  const currentFAQ = faqs[currentIndex];
  const nextFAQ = faqs[(currentIndex + 1) % faqs.length];

  return (
    <View style={[styles.container, themedStyles.container]}>
      <SwipeContainer
        onSwipeLeft={goToNext}
        onSwipeRight={goToPrevious}
        style={styles.swipeArea}
      >
        <View style={styles.cardStack}>
        {/* Next card (behind) */}
        <View style={[
          styles.card,
          styles.nextCard,
          {
            backgroundColor: theme.surfaceColor,
            borderColor: theme.borderColor,
            shadowColor: theme.textColor,
          }
        ]}>
          {nextFAQ.category && (
            <View style={[styles.categoryBadge, { backgroundColor: theme.primaryColor }]}>
              <Text style={[styles.categoryText, { color: theme.backgroundColor }]}>
                {nextFAQ.category}
              </Text>
            </View>
          )}
          
          <View style={styles.cardContent}>
            <Text style={[styles.question, { color: theme.textColor }]}>
              {nextFAQ.question}
            </Text>
            
            <Text style={[styles.answer, { color: theme.placeholderColor }]}>
              {nextFAQ.answer}
            </Text>
          </View>
        </View>

        {/* Current card (front) */}
        <View style={[
          styles.card,
          styles.currentCard,
          {
            backgroundColor: theme.surfaceColor,
            borderColor: theme.borderColor,
            shadowColor: theme.textColor,
          }
        ]}>
          {currentFAQ.category && (
            <View style={[styles.categoryBadge, { backgroundColor: theme.primaryColor }]}>
              <Text style={[styles.categoryText, { color: theme.backgroundColor }]}>
                {currentFAQ.category}
              </Text>
            </View>
          )}
          
          <View style={styles.cardContent}>
            <Text style={[styles.question, { color: theme.textColor }]}>
              {currentFAQ.question}
            </Text>
            
            <Text style={[styles.answer, { color: theme.placeholderColor }]}>
              {currentFAQ.answer}
            </Text>
          </View>
          
          <View style={styles.cardFooter}>
            <View style={styles.swipeHints}>
              <Text style={[styles.hintText, { color: theme.placeholderColor }]}>
                ← Swipe to navigate →
              </Text>
            </View>
          </View>
        </View>
      </View>
      </SwipeContainer>
      
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <Text style={[styles.progressText, { color: theme.placeholderColor }]}>
          {currentIndex + 1} of {faqs.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  swipeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStack: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  currentCard: {
    zIndex: 2,
  },
  nextCard: {
    zIndex: 1,
    transform: [{ scale: 0.95 }],
    opacity: 0.7,
  },
  categoryBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 32,
  },
  answer: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  cardFooter: {
    paddingTop: 20,
  },
  swipeHints: {
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});