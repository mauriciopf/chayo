import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';

interface PremiumProductCardSkeletonProps {
  width: number;
  height: number;
  theme: any;
}

export const PremiumProductCardSkeleton: React.FC<PremiumProductCardSkeletonProps> = ({
  width,
  height,
  theme,
}) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Shimmer effect
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        }),
      ])
    );

    // Subtle pulse effect
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 0.98,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    );

    shimmer.start();
    pulse.start();

    return () => {
      shimmer.stop();
      pulse.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shimmerTranslateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const shimmerOpacity = shimmerAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width,
          height,
          backgroundColor: theme.surfaceColor || '#2C2C2E',
          transform: [{ scale: pulseAnimation }],
        },
      ]}
    >
      {/* Base gradient background */}
      <View style={[styles.baseGradient, { backgroundColor: theme.surfaceColor || '#2C2C2E' }]} />

      {/* Primary shimmer overlay */}
      <Animated.View
        style={[
          styles.shimmerOverlay,
          {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            transform: [{ translateX: shimmerTranslateX }],
            opacity: shimmerOpacity,
          },
        ]}
      />

      {/* Secondary shimmer for depth */}
      <Animated.View
        style={[
          styles.shimmerOverlay,
          styles.secondaryShimmer,
          {
            backgroundColor: theme.primaryColor || '#007AFF',
            transform: [{ translateX: shimmerTranslateX }],
            opacity: shimmerOpacity,
          },
        ]}
      />

      {/* Top highlight for premium feel */}
      <View
        style={[
          styles.topHighlight,
          { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
        ]}
      />

      {/* Bottom fade for depth */}
      <View
        style={[
          styles.bottomFade,
          { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
        ]}
      />

      {/* Subtle border glow */}
      <View
        style={[
          styles.borderGlow,
          { borderColor: theme.primaryColor || '#007AFF' },
        ]}
      />

      {/* Content placeholder hints */}
      <View style={styles.contentHints}>
        <View
          style={[
            styles.titleHint,
            { backgroundColor: theme.placeholderColor || '#48484A' },
          ]}
        />
        <View
          style={[
            styles.priceHint,
            { backgroundColor: theme.primaryColor || '#007AFF' },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#2C2C2E',
    // Premium shadows
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  baseGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2C2C2E',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.6,
  },
  secondaryShimmer: {
    width: '30%',
    opacity: 0.1,
    left: '20%',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '25%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '15%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  borderGlow: {
    position: 'absolute',
    top: -0.5,
    left: -0.5,
    right: -0.5,
    bottom: -0.5,
    borderRadius: 12.5,
    borderWidth: 0.5,
    borderColor: '#007AFF',
    opacity: 0.3,
  },
  contentHints: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  titleHint: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#48484A',
    marginBottom: 6,
    width: '70%',
    opacity: 0.3,
  },
  priceHint: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    width: '40%',
    opacity: 0.2,
  },
});

// Enhanced skeleton with multiple variants
export const PremiumImageSkeleton: React.FC<PremiumProductCardSkeletonProps> = ({
  width,
  height,
  theme,
}) => {
  const waveAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    // Wave effect
    const wave = Animated.loop(
      Animated.timing(waveAnimation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      })
    );

    // Breathing effect
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(scaleAnimation, {
          toValue: 0.98,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    );

    wave.start();
    breathe.start();

    return () => {
      wave.stop();
      breathe.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const waveTranslateY = waveAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [height, -height],
  });

  return (
    <Animated.View
        style={[
          premiumStyles.premiumContainer,
        {
          width,
          height,
          backgroundColor: theme.surfaceColor || '#2C2C2E',
          transform: [{ scale: scaleAnimation }],
        },
      ]}
    >
      {/* Animated wave background */}
      <Animated.View
        style={[
          premiumStyles.waveBackground,
          {
            backgroundColor: theme.primaryColor || '#007AFF',
            transform: [{ translateY: waveTranslateY }],
          },
        ]}
      />

      {/* Overlay pattern */}
      <View style={premiumStyles.patternOverlay} />

      {/* Center loading indicator */}
      <View style={premiumStyles.centerIndicator}>
        <View
          style={[
            premiumStyles.loadingDot,
            { backgroundColor: theme.primaryColor || '#007AFF' },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const premiumStyles = StyleSheet.create({
  premiumContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '200%',
    backgroundColor: '#007AFF',
    opacity: 0.05,
    borderRadius: 100,
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  centerIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    opacity: 0.6,
  },
});
