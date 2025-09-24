import React, { createContext, useContext, useState, useCallback } from 'react';

interface NavigationState {
  // Whether the business header should be hidden (when in nested views)
  hideBusinessHeader: boolean;
  // Current screen info
  currentScreen?: {
    title: string;
    showBackButton: boolean;
    onBackPress?: () => void;
    backButtonText?: string;
  };
}

interface NavigationContextType {
  navigationState: NavigationState;
  // Set navigation to root level (show business header)
  setRootNavigation: () => void;
  // Set navigation to nested level (hide business header, show custom header)
  setNestedNavigation: (screenInfo: {
    title: string;
    showBackButton?: boolean;
    onBackPress?: () => void;
    backButtonText?: string;
  }) => void;
  // Reset to root navigation
  resetNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    hideBusinessHeader: false,
  });

  const setRootNavigation = useCallback(() => {
    setNavigationState({
      hideBusinessHeader: false,
      currentScreen: undefined,
    });
  }, []);

  const setNestedNavigation = useCallback((screenInfo: {
    title: string;
    showBackButton?: boolean;
    onBackPress?: () => void;
    backButtonText?: string;
  }) => {
    setNavigationState({
      hideBusinessHeader: true,
      currentScreen: {
        showBackButton: true,
        ...screenInfo,
      },
    });
  }, []);

  const resetNavigation = useCallback(() => {
    setRootNavigation();
  }, [setRootNavigation]);

  const value: NavigationContextType = {
    navigationState,
    setRootNavigation,
    setNestedNavigation,
    resetNavigation,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

// Enhanced hook with automatic cleanup
export const useScreenNavigation = () => {
  const { setNestedNavigation, setRootNavigation } = useNavigation();

  const setScreenHeader = useCallback((
    title: string,
    options?: {
      showBackButton?: boolean;
      onBackPress?: () => void;
      backButtonText?: string;
    }
  ) => {
    const screenInfo = {
      title,
      showBackButton: options?.showBackButton ?? true,
      onBackPress: options?.onBackPress,
      backButtonText: options?.backButtonText,
    };

    setNestedNavigation(screenInfo);
  }, [setNestedNavigation]);

  return {
    setScreenHeader,
    setRootNavigation,
  };
};

// Auto-cleanup hook for screens that need temporary headers
export const useNavigationHeader = (
  title: string,
  options?: {
    showBackButton?: boolean;
    onBackPress?: () => void;
    backButtonText?: string;
    autoCleanup?: boolean;
  }
) => {
  const { setScreenHeader, setRootNavigation } = useScreenNavigation();
  
  // Extract primitive values to avoid object reference issues
  const showBackButton = options?.showBackButton;
  const backButtonText = options?.backButtonText;
  const autoCleanup = options?.autoCleanup;
  const onBackPress = options?.onBackPress;
  
  React.useEffect(() => {
    // Set header when component mounts
    setScreenHeader(title, {
      showBackButton,
      onBackPress,
      backButtonText,
      autoCleanup,
    });
    
    // Cleanup when component unmounts (if autoCleanup is enabled)
    return () => {
      if (autoCleanup !== false) {
        setRootNavigation();
      }
    };
  }, [title, setScreenHeader, setRootNavigation, showBackButton, backButtonText, autoCleanup, onBackPress]);

  return {
    setScreenHeader,
    setRootNavigation,
  };
};
