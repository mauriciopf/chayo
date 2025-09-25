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
  // Navigation context stack to track where we are
  contextStack: Array<{
    context: 'root' | 'hub' | 'chat';
    title?: string;
  }>;
  // Screen history stack to restore previous screen headers
  screenStack: Array<{
    title: string;
    showBackButton: boolean;
    onBackPress?: () => void;
    backButtonText?: string;
  }>;
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
  // Push a navigation context (e.g., entering Hub)
  pushNavigationContext: (context: 'root' | 'hub' | 'chat', title?: string) => void;
  // Pop navigation context (return to previous context)
  popNavigationContext: () => void;
  // Get current navigation context
  getCurrentContext: () => 'root' | 'hub' | 'chat';
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    hideBusinessHeader: false,
    contextStack: [{ context: 'root' }],
    screenStack: [],
  });

  const pushNavigationContext = useCallback((context: 'root' | 'hub' | 'chat', title?: string) => {
    setNavigationState(prev => ({
      ...prev,
      contextStack: [...prev.contextStack, { context, title }],
    }));
  }, []);

  const popNavigationContext = useCallback(() => {
    setNavigationState(prev => {
      const newStack = prev.contextStack.length > 1 
        ? prev.contextStack.slice(0, -1)
        : prev.contextStack;
      
      const currentContext = newStack[newStack.length - 1];
      
      return {
        ...prev,
        contextStack: newStack,
        hideBusinessHeader: currentContext.context !== 'root',
        currentScreen: currentContext.context !== 'root' ? prev.currentScreen : undefined,
      };
    });
  }, []);

  const getCurrentContext = useCallback(() => {
    const currentContext = navigationState.contextStack[navigationState.contextStack.length - 1];
    return currentContext?.context || 'root';
  }, [navigationState.contextStack]);

  const setRootNavigation = useCallback(() => {
    const currentContext = getCurrentContext();
    
    setNavigationState(prev => {
      if (currentContext === 'hub') {
        // If we're in Hub context, try to restore previous screen from stack
        if (prev.screenStack.length > 0) {
          // Pop the last screen from stack and restore it
          const previousScreen = prev.screenStack[prev.screenStack.length - 1];
          const newScreenStack = prev.screenStack.slice(0, -1);
          
          
          return {
            ...prev,
            hideBusinessHeader: true,
            currentScreen: previousScreen,
            screenStack: newScreenStack,
          };
        } else {
          // No previous screen, show business name
          return {
            ...prev,
            hideBusinessHeader: true,
            currentScreen: undefined,
            screenStack: [],
          };
        }
      } else {
        // Otherwise, go to actual root
        return {
          hideBusinessHeader: false,
          currentScreen: undefined,
          contextStack: [{ context: 'root' }],
          screenStack: [],
        };
      }
    });
  }, [getCurrentContext]);

  const setNestedNavigation = useCallback((screenInfo: {
    title: string;
    showBackButton?: boolean;
    onBackPress?: () => void;
    backButtonText?: string;
  }) => {
    setNavigationState(prev => {
      const newScreenInfo = {
        showBackButton: true,
        ...screenInfo,
      };
      
      // Push current screen to stack if it exists
      const newScreenStack = prev.currentScreen 
        ? [...prev.screenStack, prev.currentScreen]
        : prev.screenStack;
      
      return {
        ...prev,
        hideBusinessHeader: true,
        currentScreen: newScreenInfo,
        screenStack: newScreenStack,
      };
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
    pushNavigationContext,
    popNavigationContext,
    getCurrentContext,
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
  const { setNestedNavigation, setRootNavigation, pushNavigationContext, popNavigationContext, getCurrentContext } = useNavigation();

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
    pushNavigationContext,
    popNavigationContext,
    getCurrentContext,
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
