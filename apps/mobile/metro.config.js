const {getDefaultConfig} = require('@expo/metro-config');
const path = require('path');

/**
 * Metro configuration for monorepo
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */

// Get the project root (mobile app) and monorepo root
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = {
  watchFolders: [monorepoRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    disableHierarchicalLookup: false,
    platforms: ['ios', 'android', 'native'],
    resolverMainFields: ['react-native', 'main', 'browser'],
    resolveRequest: (context, moduleName, platform) => {
      // Custom resolver for @chayo/* packages to use source files
      if (moduleName.startsWith('@chayo/')) {
        const packageName = moduleName.replace('@chayo/', '');
        const packagePath = path.resolve(monorepoRoot, 'packages', packageName);
        
        try {
          // Check if package exists
          const packageJsonPath = path.resolve(packagePath, 'package.json');
          const packageJson = require(packageJsonPath);
          
          // Use source field if available, otherwise fall back to src/index.ts
          const sourceEntry = packageJson.source || 'src/index.ts';
          const sourcePath = path.resolve(packagePath, sourceEntry);
          
          // Check if source file exists
          const fs = require('fs');
          if (fs.existsSync(sourcePath)) {
            return {
              filePath: sourcePath,
              type: 'sourceFile',
            };
          }
        } catch (error) {
          // If anything fails, fall back to default resolution
          console.warn(`Failed to resolve @chayo/${packageName} to source, falling back to default resolution:`, error.message);
        }
      }
      
      // Fall back to default resolution for everything else
      return context.resolveRequest(context, moduleName, platform);
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
};

const defaultConfig = getDefaultConfig(projectRoot);
module.exports = {
  ...defaultConfig,
  ...config,
  // Explicitly set projectRoot to ensure Metro uses the mobile app directory
  projectRoot: projectRoot,
  resolver: {
    ...defaultConfig.resolver,
    ...config.resolver,
  },
  transformer: {
    ...defaultConfig.transformer,
    ...config.transformer,
  },
};
