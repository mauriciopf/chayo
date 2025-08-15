# Chayo Mobile - Expo Updates Setup

This document explains how to set up OTA (Over-The-Air) updates for the Chayo Mobile app using Expo Updates and EAS Update.

## Prerequisites

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev)
2. **EAS CLI**: Install globally with `npm install -g @expo/cli`

## Initial Setup

### 1. Login to Expo
```bash
npx expo login
```

### 2. Create EAS Project
```bash
cd apps/mobile
npx expo install --fix
eas init
```

### 3. Update Configuration
After running `eas init`, update the following files with your project ID:

**app.config.js**:
```javascript
updates: {
  url: "https://u.expo.dev/[your-actual-project-id]"
},
extra: {
  eas: {
    projectId: "[your-actual-project-id]"
  }
}
```

## Building the App

### Development Build
```bash
# Build for iOS
eas build --profile development --platform ios

# Build for Android  
eas build --profile development --platform android
```

### Production Build
```bash
# Build for both platforms
eas build --profile production --platform all
```

## OTA Updates

### Development Updates
```bash
pnpm update:dev "Your update message"
```

### Preview Updates
```bash
pnpm update:preview "Your update message"
```

### Production Updates
```bash
pnpm update:prod "Your update message"
```

## Update Channels

- **development**: For internal testing
- **preview**: For staging/beta testing
- **production**: For live app users

## How OTA Updates Work

1. **Automatic Check**: App checks for updates on startup
2. **User Prompt**: Shows update dialog if available
3. **Download & Apply**: Downloads and applies update seamlessly
4. **Instant Deployment**: No app store review needed

## Benefits

- ✅ **Instant Updates**: Deploy fixes immediately
- ✅ **No App Store Review**: Bypass review process for JS/content changes
- ✅ **Rollback Capability**: Revert problematic updates quickly
- ✅ **Staged Rollouts**: Test with preview before production

## Limitations

- ❌ **Native Code Changes**: Require new app store builds
- ❌ **Asset Size**: Large updates may impact user experience
- ❌ **iOS Restrictions**: Apple guidelines must be followed

## Workflow

1. **Develop**: Make changes to React Native code
2. **Test**: Use development builds and updates
3. **Stage**: Deploy to preview channel for testing
4. **Release**: Push to production channel for users

This setup enables continuous deployment for the Chayo Mobile app! 🚀