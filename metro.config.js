const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');

// Define paths
const appRoot = path.resolve(__dirname, 'apps/mobile');
const monorepoRoot = __dirname;

// Get base config for the mobile app
const base = getDefaultConfig(appRoot);

module.exports = {
  ...base,
  
  // Set project root to mobile app directory
  projectRoot: appRoot,
  
  // Watch the entire monorepo for changes
  watchFolders: [monorepoRoot],
  
  resolver: {
    ...base.resolver,
    
    // Resolver main fields - avoid 'source' to prevent resolution issues
    resolverMainFields: ['react-native', 'main', 'browser'],
    
    // Node modules paths for both app and monorepo
    nodeModulesPaths: [
      path.join(appRoot, 'node_modules'),
      path.join(monorepoRoot, 'node_modules'),
    ],
    
    // Custom resolver for @chayo/* packages to use source files
    resolveRequest: (context, moduleName, platform) => {
      // Handle @chayo/* packages - resolve to source files
      if (moduleName.startsWith('@chayo/')) {
        const packageName = moduleName.replace('@chayo/', '');
        const packagePath = path.join(monorepoRoot, 'packages', packageName);
        
        try {
          // Try to resolve to the package's source entry point
          const packageJsonPath = path.join(packagePath, 'package.json');
          const packageJson = require(packageJsonPath);
          
          // Use source field if available, otherwise fall back to main
          const entryPoint = packageJson.source || packageJson.main || 'src/index.ts';
          const resolvedPath = path.join(packagePath, entryPoint);
          
          return {
            filePath: resolvedPath,
            type: 'sourceFile',
          };
        } catch (error) {
          // If package.json doesn't exist or can't be read, fall back to default resolution
          console.warn(`Could not resolve @chayo/${packageName}:`, error.message);
        }
      }
      
      // Fall back to default resolver for all other modules
      return context.resolveRequest(context, moduleName, platform);
    },
  },
  
  transformer: {
    ...base.transformer,
    
    // Enable inline requires for better performance
    inlineRequires: true,
  },
  
  serializer: {
    ...base.serializer,
    
    // Customize module ID generation for better caching
    createModuleIdFactory: () => (path) => {
      // Use relative paths for better caching across builds
      return path.replace(monorepoRoot, '').replace(/\\/g, '/');
    },
  },
};
