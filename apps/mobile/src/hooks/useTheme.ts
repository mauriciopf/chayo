// Static theme colors for the mobile app (no customization)
const STATIC_THEME = {
  primary: '#2F5D62',
  secondary: '#2C2C2E',
  accent: '#FF9500',
  background: '#1C1C1E',
  surface: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#3A3A3C',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
};

export interface ThemeColors {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;

  // Derived colors for dark theme compatibility
  surfaceColor: string;
  borderColor: string;
  placeholderColor: string;
  errorColor: string;
  successColor: string;
}

/**
 * Hook to access static theme colors for the mobile app
 * No customization - vibe card colors are only used in vibe cards themselves
 */
export const useTheme = (): ThemeColors => {
  // Use static theme - no customization
  const theme = STATIC_THEME;

  // Generate derived colors for dark theme
  const derivedColors = {
    surfaceColor: '#2C2C2E',
    borderColor: '#3A3A3C',
    placeholderColor: '#8E8E93',
    errorColor: '#FF453A', // iOS system red
    successColor: '#30D158', // iOS system green
  };

  return {
    primaryColor: theme.primary,
    secondaryColor: theme.secondary,
    backgroundColor: theme.background,
    textColor: theme.text,
    ...derivedColors,
  };
};

// Utility functions removed - using static theme only
