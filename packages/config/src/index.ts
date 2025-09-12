// Types
export * from './types';

// Configuration loader
export * from './loader';

// URL generation
export * from './urls';

// Navigation configuration
export * from './navigation';

// Theme constants
export * from './theme-constants';
import { DEFAULT_THEME } from './theme-constants';

// Default configurations
export const DEFAULT_CONFIG = {
  appName: 'Chayo',
  theme: DEFAULT_THEME,
  enabledTools: [],
} as const;