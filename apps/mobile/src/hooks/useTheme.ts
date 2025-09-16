import { useAppConfig } from './useAppConfig';
import { DEFAULT_THEME } from '../lib/config';

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

  // Use centralized default theme
  const defaultTheme = DEFAULT_THEME;

  // Use configured theme or fallback to defaults
  const theme = config?.theme || defaultTheme;

  // Ensure all theme properties exist and are strings
  const safeTheme = {
    primary: theme.primary || defaultTheme.primary,
    secondary: theme.secondary || defaultTheme.secondary,
    accent: theme.accent || defaultTheme.accent,
    background: theme.background || defaultTheme.background,
    surface: theme.surface || defaultTheme.surface,
    text: theme.text || defaultTheme.text,
    textSecondary: theme.textSecondary || defaultTheme.textSecondary,
    border: theme.border || defaultTheme.border,
    success: theme.success || defaultTheme.success,
    warning: theme.warning || defaultTheme.warning,
    error: theme.error || defaultTheme.error,
    info: theme.info || defaultTheme.info,
  };

  // Determine if we're using a dark theme based on background color
  const isDark = isColorDark(safeTheme.background);

  // Generate derived colors based on the theme
  const derivedColors = {
    surfaceColor: isDark ? lighten(safeTheme.background, 0.1) : darken(safeTheme.background, 0.05),
    borderColor: isDark ? lighten(safeTheme.background, 0.2) : darken(safeTheme.background, 0.1),
    placeholderColor: isDark ? lighten(safeTheme.text, -0.4) : darken(safeTheme.text, -0.4),
    errorColor: '#FF453A', // iOS system red
    successColor: '#30D158', // iOS system green
  };

  return {
    primaryColor: safeTheme.primary,
    secondaryColor: safeTheme.secondary,
    backgroundColor: safeTheme.background,
    textColor: safeTheme.text,
    ...derivedColors,
  };
};

/**
 * Utility function to determine if a color is dark
 */
function isColorDark(color: string): boolean {
  // Safety check
  if (!color || typeof color !== 'string') {
    return false; // Default to light theme
  }
  
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) || 0;
  const g = parseInt(hex.substr(2, 2), 16) || 0;
  const b = parseInt(hex.substr(4, 2), 16) || 0;

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
