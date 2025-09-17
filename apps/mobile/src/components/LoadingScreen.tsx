import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
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
  // Organic, flowing animations
  const breatheValue = useRef(new Animated.Value(0)).current;
  const floatValue = useRef(new Animated.Value(0)).current;
  const waveValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Slow, meditative breathing
    const breatheAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheValue, {
          toValue: 1,
          duration: 3000, // Slower, more meditative
          easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Organic curve
          useNativeDriver: true,
        }),
        Animated.timing(breatheValue, {
          toValue: 0,
          duration: 3000,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
      ])
    );

    // Gentle floating motion
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatValue, {
          toValue: 1,
          duration: 4000, // Even slower, dreamlike
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
        Animated.timing(floatValue, {
          toValue: 0,
          duration: 4000,
          easing: Easing.bezier(0.55, 0.06, 0.68, 0.19),
          useNativeDriver: true,
        }),
      ])
    );

    // Subtle wave motion
    const waveAnimation = Animated.loop(
      Animated.timing(waveValue, {
        toValue: 1,
        duration: 6000, // Long, hypnotic cycle
        easing: Easing.bezier(0.445, 0.05, 0.55, 0.95),
        useNativeDriver: true,
      })
    );

    breatheAnimation.start();
    floatAnimation.start();
    waveAnimation.start();

    return () => {
      breatheValue.stopAnimation();
      floatValue.stopAnimation();
      waveValue.stopAnimation();
    };
  }, []);

  // Organic interpolations
  const textOpacity = breatheValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1, 0.6],
  });

  const textScale = breatheValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.02],
  });

  const floatTranslateY = floatValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -8, 0],
  });

  const waveRotate = waveValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const accentScale = waveValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.1, 1],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />
      
      <View style={styles.content}>
        {/* Flowing organic shapes in background */}
        <Animated.View
          style={[
            styles.organicShape1,
            {
              transform: [
                { rotate: waveRotate },
                { scale: accentScale },
              ],
              opacity: breatheValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.05, 0.15],
              }),
            },
          ]}
        />
        
        <Animated.View
          style={[
            styles.organicShape2,
            {
              transform: [
                { 
                  rotate: waveValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '-180deg'],
                  })
                },
                { scale: accentScale },
              ],
              opacity: breatheValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.08, 0.12],
              }),
            },
          ]}
        />

        {/* Main CHAYO text with boho styling */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [
                { scale: textScale },
                { translateY: floatTranslateY },
              ],
            },
          ]}
        >
          <Text style={styles.brandText}>CHAYO</Text>
        </Animated.View>

        {/* Organic flowing accent line */}
        <Animated.View
          style={[
            styles.flowingAccent,
            {
              opacity: breatheValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.7],
              }),
              transform: [
                {
                  scaleX: breatheValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.8, 1.2, 0.8],
                  }),
                },
              ],
            },
          ]}
        />

        {/* Subtle floating dots - like dust particles */}
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.floatingDot,
              {
                left: 50 + index * 60 + '%',
                top: 60 + index * 10 + '%',
                opacity: floatValue.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.1, 0.4, 0.1],
                }),
                transform: [
                  {
                    translateY: floatValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -20 - index * 5],
                    }),
                  },
                  {
                    scale: breatheValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1.5],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  brandText: {
    fontSize: 42,
    fontWeight: '200', // Ultra-thin for ethereal feel
    color: '#F5F5DC', // Warm beige instead of stark white
    textAlign: 'center',
    letterSpacing: 6, // Airy, spacious
    textShadowColor: 'rgba(245, 245, 220, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  organicShape1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#8B7355', // Warm earth brown
    zIndex: 0,
  },
  organicShape2: {
    position: 'absolute',
    width: 150,
    height: 300,
    borderRadius: 75,
    backgroundColor: '#A0956B', // Sage green-brown
    zIndex: 0,
  },
  flowingAccent: {
    width: 80,
    height: 1,
    backgroundColor: '#D4AF37', // Warm gold
    marginTop: 32,
    borderRadius: 0.5,
    zIndex: 1,
  },
  floatingDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#DEB887', // Burlywood - natural, earthy
    zIndex: 1,
  },
});

export default LoadingScreen;