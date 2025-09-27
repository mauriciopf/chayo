import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import { CustomBackButton } from './CustomBackButton';

interface NavigationHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  backgroundColor?: string;
  borderBottomColor?: string;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightComponent,
  backgroundColor,
  borderBottomColor,
}) => {
  const { theme, fontSizes } = useThemedStyles();

  const headerBackgroundColor = backgroundColor || theme.backgroundColor;
  const headerBorderColor = borderBottomColor || theme.borderColor;

  return (
    <View style={[
      styles.header,
      {
        backgroundColor: headerBackgroundColor,
        borderBottomColor: headerBorderColor,
      }
    ]}>
      <StatusBar barStyle="light-content" backgroundColor={headerBackgroundColor} />
      
      {showBackButton && (
        <CustomBackButton
          onPress={onBackPress}
          style={styles.backButtonContainer}
        />
      )}
      
      <View style={[styles.titleContainer, !showBackButton && styles.titleContainerCentered]}>
        <Text style={[styles.title, { color: theme.textColor, fontSize: fontSizes.xl }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      
      {rightComponent && (
        <View style={styles.rightContainer}>
          {rightComponent}
        </View>
      )}
      
      {/* Spacer to balance the back button and center the title when no right component */}
      {showBackButton && !rightComponent && <View style={styles.headerSpacer} />}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 54, // Account for status bar + extra space
    paddingBottom: 20,
    backgroundColor: '#1A1A1A', // Deep charcoal to match tab bar
    borderBottomWidth: 0, // Remove harsh border
    shadowColor: '#D4A574', // Warm gold shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  backButtonContainer: {
    marginRight: 16,
    zIndex: 1,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  titleContainerCentered: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F4E4BC', // Warm cream color
    textAlign: 'center',
    letterSpacing: 0.8, // Elegant spacing
    textShadowColor: 'rgba(212, 165, 116, 0.3)', // Subtle warm glow
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  rightContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  headerSpacer: {
    width: 56, // Match custom back button width (40 + 16 margin) to center title
  },
});
