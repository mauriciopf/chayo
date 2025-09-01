import { useAppConfig } from './useAppConfig';

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
 * Hook to access theme colors from app configuration
 * Provides both the configured colors and derived colors for consistent theming
 */
export const useTheme = (): ThemeColors => {
  const { config } = useAppConfig();

  // Default dark theme (fallback) - matches what we've been using
  const defaultTheme = {
    primaryColor: '#0A84FF',
    secondaryColor: '#FF453A',
    backgroundColor: '#1C1C1E',
    textColor: '#FFFFFF',
  };

  // Use configured theme or fallback to defaults
  const theme = config?.theme || defaultTheme;

  // Determine if we're using a dark theme based on background color
  const isDark = isColorDark(theme.backgroundColor);

  // Generate derived colors based on the theme
  const derivedColors = {
    surfaceColor: isDark ? lighten(theme.backgroundColor, 0.1) : darken(theme.backgroundColor, 0.05),
    borderColor: isDark ? lighten(theme.backgroundColor, 0.2) : darken(theme.backgroundColor, 0.1),
    placeholderColor: isDark ? lighten(theme.textColor, -0.4) : darken(theme.textColor, -0.4),
    errorColor: '#FF453A', // iOS system red
    successColor: '#30D158', // iOS system green
  };

  return {
    ...theme,
    ...derivedColors,
  };
};

/**
 * Utility function to determine if a color is dark
 */
function isColorDark(color: string): boolean {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance < 0.5;
}

/**
 * Utility function to lighten a color
 */
function lighten(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.round(255 * amount));
  const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.round(255 * amount));
  const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.round(255 * amount));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Utility function to darken a color
 */
function darken(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.round(255 * amount));
  const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.round(255 * amount));
  const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.round(255 * amount));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
