export default {
  expo: {
    name: "Chayo",
    slug: "chayo-mobile",
    version: "1.1.0",
    orientation: "portrait",
    icon: "./assets/chayo_logo.png",
    userInterfaceStyle: "automatic",
    splash: {
      backgroundColor: "#1C1C1E"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.chayo.mobile",
      infoPlist: {}
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1C1C1E"
      },
      package: "com.chayo.mobile"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: ["expo-updates"],
    updates: {
      url: "https://u.expo.dev/4ec6342b-7cd8-45e0-9ce1-2c1da5e1b694"
    },
    runtimeVersion: "1.1.0",
    extra: {
      eas: {
        projectId: "4ec6342b-7cd8-45e0-9ce1-2c1da5e1b694"
      }
    }
  }
};