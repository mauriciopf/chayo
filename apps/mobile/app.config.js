// Expo Updates configuration for React Native CLI (bare workflow)
// This is NOT an Expo managed workflow - we're using RN CLI with Expo Updates only

export default {
  expo: {
    name: "Chayo Mobile",
    slug: "chayo-mobile", 
    version: "1.0.0",
    runtimeVersion: {
      policy: "appVersion"
    },
    updates: {
      url: "https://u.expo.dev/[your-project-id]"
    },
    extra: {
      eas: {
        projectId: "[your-project-id]"
      }
    }
  }
};