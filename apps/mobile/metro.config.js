const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

/**
 * Metro configuration that works for both dev server and EAS builds
 * https://docs.expo.dev/guides/monorepos/
 *
 * @type {import('metro-config').MetroConfig}
 */

// Get the project root (mobile app) and monorepo root
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

// Get the default Expo Metro config
const defaultConfig = getDefaultConfig(projectRoot);

// Extend the default config for monorepo
const config = {
  ...defaultConfig,
  
  // Watch the entire monorepo for changes
  watchFolders: [monorepoRoot],
  
  resolver: {
    ...defaultConfig.resolver,
    
    // Node modules paths for both app and monorepo
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    
    // Platform extensions
    platforms: ['ios', 'android', 'native', 'web'],
  },
  
  // Transformer settings
  transformer: {
    ...defaultConfig.transformer,
    // Enable inline requires for better performance
    inlineRequires: true,
  },
};

module.exports = config;
