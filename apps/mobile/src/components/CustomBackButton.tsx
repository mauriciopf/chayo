import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  View,
} from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/Feather';

interface CustomBackButtonProps {
  onPress?: () => void;
  size?: number;
  style?: any;
}

export const CustomBackButton: React.FC<CustomBackButtonProps> = ({
  onPress,
  size = 24,
  style,
}) => {
  const { theme } = useThemedStyles();
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.92,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePress = () => {
    // Haptic feedback would be nice here
    onPress?.();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleValue }] }, style]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.backButton,
          {
            backgroundColor: theme.surfaceColor || '#2C2C2E',
            borderColor: theme.borderColor || '#3A3A3C',
          },
        ]}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Icon 
            name="chevron-left" 
            size={size} 
            color={theme.primaryColor || '#007AFF'} 
            style={styles.icon}
          />
        </View>
        
        {/* Subtle gradient overlay for depth */}
        <View style={[styles.gradientOverlay, { backgroundColor: theme.primaryColor + '08' }]} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    // Subtle shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    // Android shadow
    elevation: 3,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  icon: {
    marginLeft: -1, // Slight optical adjustment
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    zIndex: 1,
  },
});

// Alternative minimal version - just the chevron with subtle background
export const MinimalBackButton: React.FC<CustomBackButtonProps> = ({
  onPress,
  size = 22,
  style,
}) => {
  const { theme } = useThemedStyles();
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.9,
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
        style={[
          minimalStyles.minimalButton,
          {
            backgroundColor: theme.primaryColor + '12', // Very subtle background
          },
        ]}
        activeOpacity={0.7}
      >
        <Icon 
          name="chevron-left" 
          size={size} 
          color={theme.primaryColor || '#007AFF'} 
          style={{ marginLeft: -1 }}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const minimalStyles = StyleSheet.create({
  minimalButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
});

// Export both styles for different use cases
export { minimalStyles as MinimalBackButtonStyles };
