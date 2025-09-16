const path = require('path');

/**
 * Metro configuration for React Native monorepo
 * Handles both development server and EAS builds
 * @type {import('metro-config').MetroConfig}
 */

// Get the project root (mobile app) and monorepo root
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

// Check if we're in an EAS build environment
const isEASBuild = process.env.EAS_BUILD === 'true' || process.env.CI === 'true';

// Get the appropriate Metro config based on environment
let getDefaultConfig;
if (isEASBuild) {
  // Use Expo Metro config for EAS builds
  console.log('📦 Using @expo/metro-config for EAS build');
  getDefaultConfig = require('@expo/metro-config').getDefaultConfig;
} else {
  // Use React Native Metro config for development
  console.log('🔧 Using @react-native/metro-config for development');
  getDefaultConfig = require('@react-native/metro-config').getDefaultConfig;
}

const defaultConfig = getDefaultConfig(projectRoot);

let config;

if (isEASBuild) {
  // Simplified config for EAS builds - avoid monorepo complexity
  config = {
    ...defaultConfig,
    resolver: {
      ...defaultConfig.resolver,
      // Path aliases still needed for @/ imports
      alias: {
        '@': path.resolve(projectRoot, 'src'),
      },
    },
    transformer: {
      ...defaultConfig.transformer,
      inlineRequires: true,
    },
  };
} else {
  // Full monorepo config for development
  config = {
    ...defaultConfig,
    
    // Watch the entire monorepo for changes (dev only)
    watchFolders: [monorepoRoot],
    
    resolver: {
      ...defaultConfig.resolver,
      
      // Node modules paths for both app and monorepo (dev only)
      nodeModulesPaths: [
        path.resolve(projectRoot, 'node_modules'),
        path.resolve(monorepoRoot, 'node_modules'),
      ],
      
      // Platform extensions
      platforms: ['ios', 'android', 'native', 'web'],
      
      // Block the monorepo root from being resolved as a module (dev only)
      blockList: [
        // Block any attempt to resolve the root's index.* as a module
        new RegExp(`^${monorepoRoot.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}/index\\.(js|jsx|ts|tsx|mjs|cjs)$`),
      ],
      
      // Path aliases
      alias: {
        '@': path.resolve(projectRoot, 'src'),
      },
    },
    
    // Transformer settings
    transformer: {
      ...defaultConfig.transformer,
      // Enable inline requires for better performance
      inlineRequires: true,
    },
  };
}

module.exports = config;
