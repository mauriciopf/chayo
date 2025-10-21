export default {
  expo: {
    name: 'ChayoMobile',
    slug: 'chayo-mobile',
    owner: 'chayo-ai',
    version: '1.1.9',
    orientation: 'portrait',
    icon: './assets/chayo_logo.png',
    userInterfaceStyle: 'automatic',
    splash: {
      backgroundColor: '#1C1C1E',
    },
    assetBundlePatterns: [
      '**/*',
    ],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.chayo.mobile',
      infoPlist: {},
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/chayo_logo.png',
        backgroundColor: '#1C1C1E',
      },
      package: 'com.chayo.mobile',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: ['expo-updates'],
    updates: {
      url: 'https://u.expo.dev/74f0a115-1928-4581-86d2-a81a2f76d355',
    },
    runtimeVersion: '1.1.9',
    extra: {
      eas: {
        projectId: '74f0a115-1928-4581-86d2-a81a2f76d355',
      },
    },
  },
};
