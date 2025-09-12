const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration for React Native monorepo
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */

// Get the project root (mobile app) and monorepo root
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

// Get the default React Native Metro config
const defaultConfig = getDefaultConfig(projectRoot);

const config = {
  // Set project root to mobile app directory
  projectRoot: projectRoot,
  
  // Watch the entire monorepo for changes
  watchFolders: [monorepoRoot],
  
  resolver: {
    // Node modules paths for both app and monorepo
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    
    // Platform extensions
    platforms: ['ios', 'android', 'native', 'web'],
    
    // Disable platform-specific extensions that might cause conflicts
    disableHierarchicalLookup: false,
  },
  
  // Transformer settings
  transformer: {
    // Enable inline requires for better performance
    inlineRequires: true,
  },
};

module.exports = mergeConfig(defaultConfig, config);
