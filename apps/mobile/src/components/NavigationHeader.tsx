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
  const { theme } = useThemedStyles();

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
        <Text style={[styles.title, { color: theme.textColor }]} numberOfLines={1}>
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
    paddingHorizontal: 20,
    paddingTop: 50, // Account for status bar
    paddingBottom: 16,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
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
