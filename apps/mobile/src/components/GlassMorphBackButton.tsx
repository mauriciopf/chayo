import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  View,
  Platform,
} from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/Feather';

interface GlassMorphBackButtonProps {
  onPress?: () => void;
  size?: number;
  style?: any;
}

export const GlassMorphBackButton: React.FC<GlassMorphBackButtonProps> = ({
  onPress,
  size = 22,
  style,
}) => {
  const { theme } = useThemedStyles();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const opacityValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.94,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleValue }],
          opacity: opacityValue,
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.glassMorphButton,
          {
            backgroundColor: theme.surfaceColor ? `${theme.surfaceColor}80` : 'rgba(44, 44, 46, 0.5)',
            borderColor: theme.borderColor ? `${theme.borderColor}60` : 'rgba(58, 58, 60, 0.4)',
          },
        ]}
        activeOpacity={1}
      >
        {/* Glass morphism backdrop */}
        <View style={[
          styles.backdrop,
          {
            backgroundColor: Platform.OS === 'ios'
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(255, 255, 255, 0.03)',
          },
        ]} />

        {/* Icon */}
        <View style={styles.iconContainer}>
          <Icon
            name="chevron-left"
            size={size}
            color={theme.primaryColor || '#007AFF'}
            style={styles.icon}
          />
        </View>

        {/* Subtle highlight */}
        <View style={[
          styles.highlight,
          { backgroundColor: `${theme.primaryColor || '#007AFF'}08` },
        ]} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  glassMorphButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(44, 44, 46, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(58, 58, 60, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    // Subtle shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  icon: {
    marginLeft: -0.5, // Optical adjustment
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    zIndex: 1,
  },
});

// Ultra minimal version - just the chevron with a subtle touch target
export const UltraMinimalBackButton: React.FC<GlassMorphBackButtonProps> = ({
  onPress,
  size = 20,
  style,
}) => {
  const { theme } = useThemedStyles();
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.92,
      useNativeDriver: true,
      tension: 400,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 400,
      friction: 8,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleValue }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={ultraMinimalStyles.ultraMinimal}
        activeOpacity={0.6}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon
          name="chevron-left"
          size={size}
          color={theme.primaryColor || '#007AFF'}
          style={{ opacity: 0.9 }}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const ultraMinimalStyles = StyleSheet.create({
  ultraMinimal: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
});
