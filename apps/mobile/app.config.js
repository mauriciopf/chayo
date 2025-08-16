export default {
  expo: {
    name: "Chayo",
    slug: "chayo-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#1C1C1E"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.chayo.mobile",
      buildNumber: "1",
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSExceptionDomains: {
            "chayo.vercel.app": {
              NSExceptionAllowsInsecureHTTPLoads: true,
              NSExceptionMinimumTLSVersion: "TLSv1.0",
              NSExceptionRequiresForwardSecrecy: false
            }
          }
        },
        UIAppFonts: [
          "Feather.ttf",
          "Ionicons.ttf", 
          "MaterialIcons.ttf"
        ]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1C1C1E"
      },
      package: "com.chayo.mobile",
      versionCode: 1
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-updates",
        {
          username: "chayo-ai"
        }
      ]
    ],
    updates: {
      url: "https://u.expo.dev/YOUR_PROJECT_ID"
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    extra: {
      eas: {
        projectId: "YOUR_PROJECT_ID"
      }
    }
  }
};