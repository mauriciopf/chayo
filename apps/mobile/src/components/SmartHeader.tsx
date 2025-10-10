import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation as useReactNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { NavigationHeader } from './NavigationHeader';
import { useNavigation } from '../context/NavigationContext';
import { useThemedStyles } from '../context/ThemeContext';

interface SmartHeaderProps {
  businessName: string;
  onBackToMarketplace: () => void;
}

/**
 * Smart Header that automatically switches between business header and nested headers
 * This eliminates the need for manual conditional logic in BusinessDetailScreen
 */
export const SmartHeader: React.FC<SmartHeaderProps> = ({
  businessName,
  onBackToMarketplace,
}) => {
  const { navigationState } = useNavigation();
  const reactNavigation = useReactNavigation();
  const { theme } = useThemedStyles();

  // Hamburger menu button for drawer
  const HamburgerMenu = () => (
    <TouchableOpacity
      onPress={() => reactNavigation.dispatch(DrawerActions.openDrawer())}
      style={styles.hamburgerButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Icon name="menu" size={24} color={theme.textColor} />
    </TouchableOpacity>
  );

  // Automatically render the appropriate header based on navigation state
  if (!navigationState.hideBusinessHeader) {
    // Business Header - shown at root level
    return (
      <NavigationHeader
        title={businessName}
        showBackButton={true}
        onBackPress={onBackToMarketplace}
        backButtonText="← Back"
        rightComponent={<HamburgerMenu />}
      />
    );
  }

  // Custom Header - shown for nested views
  if (navigationState.currentScreen) {
    return (
      <NavigationHeader
        title={navigationState.currentScreen.title}
        showBackButton={navigationState.currentScreen.showBackButton}
        onBackPress={navigationState.currentScreen.onBackPress}
        backButtonText={navigationState.currentScreen.backButtonText}
        rightComponent={<HamburgerMenu />}
      />
    );
  }

  // Fallback to business header if no nested screen is set
  return (
    <NavigationHeader
      title={businessName}
      showBackButton={true}
      onBackPress={onBackToMarketplace}
      backButtonText="← Back"
      rightComponent={<HamburgerMenu />}
    />
  );
};

const styles = StyleSheet.create({
  hamburgerButton: {
    padding: 8,
    marginRight: -8,
  },
});
