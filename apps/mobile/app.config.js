export default {
  expo: {
    name: 'Chayo',
    slug: 'chayo-mobile',
    owner: 'chayo-ai',
    version: '1.1.5',
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
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1C1C1E',
      },
      package: 'com.chayo.mobile',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: ['expo-updates'],
    updates: {
      url: 'https://u.expo.dev/4ec6342b-7cd8-45e0-9ce1-2c1da5e1b694',
    },
    runtimeVersion: '1.1.5',
    extra: {
      eas: {
        projectId: '74f0a115-1928-4581-86d2-a81a2f76d355',
      },
    },
  },
};
