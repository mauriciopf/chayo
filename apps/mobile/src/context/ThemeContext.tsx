import React, { createContext, useContext, ReactNode } from 'react';
import { useTheme, ThemeColors } from '../hooks/useTheme';

interface ThemeContextType {
  theme: ThemeColors;
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
      fontSize: 16,
    },
    secondaryText: {
      color: theme.textColor,
      opacity: 0.7,
      fontSize: 14,
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
      fontSize: 16,
    },
    border: {
      borderColor: theme.borderColor,
    },
  };

  return (
    <ThemeContext.Provider value={{ theme, styles }}>
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

// HOC to inject theme into components
export function withTheme<P extends object>(
  Component: React.ComponentType<P & { theme: ThemeColors; themedStyles: ThemeContextType['styles'] }>
): React.FC<P> {
  return function ThemedComponent(props: P) {
    const { theme, styles } = useThemeContext();
    return <Component {...props} theme={theme} themedStyles={styles} />;
  };
}

// Hook-based approach (alternative to HOC)
export const useThemedStyles = () => {
  const { theme, styles } = useThemeContext();
  return { theme, themedStyles: styles };
};
