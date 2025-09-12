/**
 * Centralized theme constants - Single source of truth for all default colors
 * This file should be the ONLY place where default theme colors are defined
 */

export const DEFAULT_THEME = {
  primaryColor: '#0A84FF',      // iOS blue - for primary actions
  secondaryColor: '#2C2C2E',    // Dark gray - for tab bars, secondary elements
  backgroundColor: '#1C1C1E',   // Dark background
  textColor: '#FFFFFF',         // White text for dark theme
} as const;

/**
 * Alternative theme variations (if needed in the future)
 */
export const THEME_VARIANTS = {
  dark: DEFAULT_THEME,
  light: {
    primaryColor: '#007AFF',
    secondaryColor: '#8E8E93',
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
  },
} as const;

/**
 * Semantic color mappings for consistent usage
 */
export const SEMANTIC_COLORS = {
  success: '#30D158',    // iOS green
  error: '#FF453A',      // iOS red  
  warning: '#FF9F0A',    // iOS orange
  info: '#007AFF',       // iOS blue
} as const;
