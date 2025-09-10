const {getDefaultConfig} = require('@expo/metro-config');
const path = require('path');

/**
 * Metro configuration for Expo monorepo
 * https://docs.expo.dev/guides/monorepos/
 *
 * @type {import('metro-config').MetroConfig}
 */

// Get the project root (mobile app) and monorepo root
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

// Get the default Expo Metro config
const defaultConfig = getDefaultConfig(projectRoot);

module.exports = {
  ...defaultConfig,
  
  // Set project root to mobile app directory
  projectRoot: projectRoot,
  
  // Watch the entire monorepo for changes
  watchFolders: [monorepoRoot],
  
  resolver: {
    ...defaultConfig.resolver,
    
    // Node modules paths for both app and monorepo
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    
    // Keep Expo's default resolver settings
    platforms: ['ios', 'android', 'native', 'web'],
  },
};
