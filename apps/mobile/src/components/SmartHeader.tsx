import React from 'react';
import { NavigationHeader } from './NavigationHeader';
import { useNavigation } from '../context/NavigationContext';

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

  // Automatically render the appropriate header based on navigation state
  if (!navigationState.hideBusinessHeader) {
    // Business Header - shown at root level
    return (
      <NavigationHeader
        title={businessName}
        showBackButton={true}
        onBackPress={onBackToMarketplace}
        backButtonText="← Back"
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
    />
  );
};
