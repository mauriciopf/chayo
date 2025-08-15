export default {
  expo: {
    name: "Chayo Mobile",
    slug: "chayo-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.chayo.mobile"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.chayo.mobile"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-updates"
    ],
    updates: {
      url: "https://u.expo.dev/[your-project-id]"
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    extra: {
      eas: {
        projectId: "[your-project-id]"
      }
    }
  }
}