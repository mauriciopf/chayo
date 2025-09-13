import React from 'react';
import {
  View,
  PanResponder,
  StyleSheet,
} from 'react-native';

interface SwipeContainerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
  style?: any;
}

export const SwipeContainer: React.FC<SwipeContainerProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 50,
  style,
}) => {
  // Basic swipe detection (same as FAQ cards)
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to horizontal swipes
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
    },
    onPanResponderRelease: (_, gestureState) => {
      const { dx } = gestureState;
      
      if (dx > swipeThreshold) {
        // Swipe right
        onSwipeRight?.();
      } else if (dx < -swipeThreshold) {
        // Swipe left
        onSwipeLeft?.();
      }
    },
  });

  return (
    <View {...panResponder.panHandlers} style={[styles.container, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
