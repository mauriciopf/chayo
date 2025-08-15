// Types
export * from './types';

// Configuration loader
export * from './loader';

// URL generation
export * from './urls';

// Navigation configuration
export * from './navigation';

// Default configurations
export const DEFAULT_CONFIG = {
  appName: 'Chayo',
  theme: {
    primaryColor: '#007AFF',
    secondaryColor: '#5856D6', 
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
  },
  enabledTools: [],
} as const;