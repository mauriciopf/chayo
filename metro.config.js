// Monorepo root metro config - delegates to mobile app
// This ensures React Native CLI finds a config at the repo root
// while preserving the mobile app's context (__dirname, paths, etc.)
module.exports = require('./apps/mobile/metro.config');
