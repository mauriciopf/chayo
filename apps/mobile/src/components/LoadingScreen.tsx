import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = () => {
  // Create multiple layers of animated elements
  const particleAnimations = useRef(
    Array.from({ length: 6 }, () => ({
      rotate: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  const centralPulse = useRef(new Animated.Value(0)).current;
  const orbitalRotation = useRef(new Animated.Value(0)).current;
  const morphAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Central pulsing core
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(centralPulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
        Animated.timing(centralPulse, {
          toValue: 0,
          duration: 1500,
          easing: Easing.bezier(0.55, 0.06, 0.68, 0.19),
          useNativeDriver: true,
        }),
      ])
    );

    // Orbital rotation
    const orbitalAnimation = Animated.loop(
      Animated.timing(orbitalRotation, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Morphing shape animation
    const morphingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(morphAnimation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
          useNativeDriver: true,
        }),
        Animated.timing(morphAnimation, {
          toValue: 0,
          duration: 2000,
          easing: Easing.bezier(0.445, 0.05, 0.55, 0.95),
          useNativeDriver: true,
        }),
      ])
    );

    // Particle system animation
    const particleAnimations_mapped = particleAnimations.map((particle, index) => {
      const delay = index * 300;
      
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 1,
              duration: 800,
              easing: Easing.out(Easing.back(2)),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(particle.rotate, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: 800,
              easing: Easing.in(Easing.back(2)),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(particle.rotate, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    });

    // Start all animations
    pulseAnimation.start();
    orbitalAnimation.start();
    morphingAnimation.start();
    Animated.stagger(0, particleAnimations_mapped).start();

    return () => {
      pulseAnimation.stop();
      orbitalAnimation.stop();
      morphingAnimation.stop();
      particleAnimations.forEach(particle => {
        particle.rotate.stopAnimation();
        particle.scale.stopAnimation();
        particle.opacity.stopAnimation();
      });
    };
  }, []);

  // Animation interpolations
  const centralScale = centralPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.3],
  });

  const centralOpacity = centralPulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 1, 0.4],
  });

  const orbitalRotate = orbitalRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const morphScale = morphAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.2, 1],
  });

  const morphBorderRadius = morphAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [30, 8, 30],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />
      
      <View style={styles.content}>
        {/* Central morphing core */}
        <Animated.View
          style={[
            styles.centralCore,
            {
              transform: [
                { scale: Animated.multiply(centralScale, morphScale) },
              ],
              opacity: centralOpacity,
              borderRadius: morphBorderRadius,
            },
          ]}
        />

        {/* Orbital rings */}
        <Animated.View
          style={[
            styles.orbitalContainer,
            {
              transform: [{ rotate: orbitalRotate }],
            },
          ]}
        >
          {/* Inner orbital ring */}
          <View style={styles.innerOrbit}>
            <View style={[styles.orbitDot, styles.orbitDot1]} />
            <View style={[styles.orbitDot, styles.orbitDot2]} />
          </View>
          
          {/* Outer orbital ring */}
          <View style={styles.outerOrbit}>
            <View style={[styles.orbitDot, styles.orbitDot3]} />
            <View style={[styles.orbitDot, styles.orbitDot4]} />
          </View>
        </Animated.View>

        {/* Particle system */}
        {particleAnimations.map((particle, index) => {
          const angle = (index / particleAnimations.length) * 2 * Math.PI;
          const radius = 60 + Math.sin(index) * 20;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          const rotateInterpolation = particle.rotate.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '720deg'],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  left: x + 100, // Center offset
                  top: y + 100,
                  transform: [
                    { scale: particle.scale },
                    { rotate: rotateInterpolation },
                  ],
                  opacity: particle.opacity,
                },
              ]}
            />
          );
        })}

        {/* Energy waves */}
        <Animated.View
          style={[
            styles.energyWave1,
            {
              transform: [{ scale: centralScale }],
              opacity: centralOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.3],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.energyWave2,
            {
              transform: [{ scale: Animated.multiply(centralScale, 1.5) }],
              opacity: centralOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.2],
              }),
            },
          ]}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centralCore: {
    width: 60,
    height: 60,
    backgroundColor: '#007AFF',
    position: 'absolute',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  orbitalContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerOrbit: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  outerOrbit: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(88, 86, 214, 0.2)',
  },
  orbitDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5856D6',
  },
  orbitDot1: {
    top: -4,
    left: '50%',
    marginLeft: -4,
  },
  orbitDot2: {
    bottom: -4,
    left: '50%',
    marginLeft: -4,
  },
  orbitDot3: {
    top: -4,
    left: '50%',
    marginLeft: -4,
    backgroundColor: '#007AFF',
  },
  orbitDot4: {
    bottom: -4,
    left: '50%',
    marginLeft: -4,
    backgroundColor: '#007AFF',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF9500',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  energyWave1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  energyWave2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: '#5856D6',
  },
});

export default LoadingScreen;