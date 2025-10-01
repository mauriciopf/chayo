import React, { createContext, useContext, ReactNode } from 'react';
import { useTheme, ThemeColors } from '../hooks/useTheme';

interface ThemeContextType {
  theme: ThemeColors;
  fontSizes: {
    xs: number;      // 10px - Extra small
    sm: number;      // 12px - Small
    base: number;    // 14px - Base (reduced from 16)
    md: number;      // 16px - Medium (reduced from 18)
    lg: number;      // 18px - Large (reduced from 20)
    xl: number;      // 20px - Extra large (reduced from 24)
    xxl: number;     // 22px - XX Large (reduced from 28)
    xxxl: number;    // 24px - XXX Large (reduced from 32)
  };
  styles: {
    container: object;
    surface: object;
    text: object;
    primaryText: object;
    secondaryText: object;
    button: object;
    primaryButton: object;
    secondaryButton: object;
    input: object;
    border: object;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const theme = useTheme();

  // Reduced font sizes for better mobile density
  const fontSizes = {
    xs: 10,      // Extra small - captions, small labels
    sm: 12,      // Small - secondary text, metadata
    base: 14,    // Base - body text, default (reduced from 16)
    md: 16,      // Medium - primary text, inputs (reduced from 18)
    lg: 18,      // Large - headings, titles (reduced from 20)
    xl: 20,      // Extra large - section headers (reduced from 24)
    xxl: 22,     // XX Large - page titles (reduced from 28)
    xxxl: 24,    // XXX Large - main headers (reduced from 32)
  };

  // Create reusable style objects based on theme
  const styles = {
    container: {
      backgroundColor: theme.backgroundColor,
    },
    surface: {
      backgroundColor: theme.surfaceColor,
    },
    text: {
      color: theme.textColor,
    },
    primaryText: {
      color: theme.textColor,
      fontSize: fontSizes.base, // Now uses reduced font size
    },
    secondaryText: {
      color: theme.textColor,
      opacity: 0.7,
      fontSize: fontSizes.sm, // Now uses reduced font size
    },
    button: {
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    primaryButton: {
      backgroundColor: theme.primaryColor,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    secondaryButton: {
      backgroundColor: theme.secondaryColor,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    input: {
      backgroundColor: theme.surfaceColor,
      borderColor: theme.borderColor,
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      color: theme.textColor,
      fontSize: fontSizes.base, // Now uses reduced font size
    },
    border: {
      borderColor: theme.borderColor,
    },
  };

  return (
    <ThemeContext.Provider value={{ theme, fontSizes, styles }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
};

// Hook-based approach for accessing theme and font sizes
export const useThemedStyles = () => {
  const { theme, fontSizes, styles } = useThemeContext();
  return { theme, fontSizes, themedStyles: styles };
};
