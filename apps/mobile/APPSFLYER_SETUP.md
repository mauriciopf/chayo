# AppsFlyer Setup Guide for Chayo Mobile App

## ✅ Completed

- ✅ Installed `react-native-appsflyer@^6.14.3`
- ✅ Ran `pod install` for iOS
- ✅ Updated `DeepLinkService.ts` with AppsFlyer SDK

## 📝 Configuration Credentials

- **Dev Key**: `jTd7SWWPyXcbcjNjScR2Ki`
- **iOS App ID**: `id6751903645`
- **iOS Bundle ID**: `com.chayo.mobile`
- **Android Package**: `com.chayo.mobile`

## 🍎 iOS Setup

### 1. Initialize in App.tsx

Already configured in `DeepLinkService.ts`, just call:

```typescript
import { useEffect } from 'react';
import { DeepLinkService } from './src/services/DeepLinkService';

function App() {
  useEffect(() => {
    // Initialize AppsFlyer
    DeepLinkService.initializeAppsFlyer();
    
    return () => {
      DeepLinkService.cleanupAppsFlyer();
    };
  }, []);
  
  // Rest of your app...
}
```

### 2. Configure AppDelegate (iOS)

No additional configuration needed! React Native 0.60+ has autolinking.

## 🤖 Android Setup

### 1. Update `AndroidManifest.xml`

Edit `apps/mobile/android/app/src/main/AndroidManifest.xml`:

Add inside `<application>` tag:

```xml
<application>
    <!-- AppsFlyer Dev Key -->
    <meta-data
        android:name="appsflyer-devkey"
        android:value="jTd7SWWPyXcbcjNjScR2Ki" />
    
    <!-- Your existing code -->
</application>
```

### 2. Deep Link Intent Filters

Add inside `<activity android:name=".MainActivity">`:

```xml
<activity
    android:name=".MainActivity"
    android:launchMode="singleTask">
    
    <!-- Your existing intent filters -->
    
    <!-- AppsFlyer Deep Link -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data
            android:scheme="https"
            android:host="chayo.onelink.me" />
    </intent-filter>
    
    <!-- Custom URI Scheme -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="chayo" />
    </intent-filter>
</activity>
```

## 🔗 OneLink Setup

1. Go to [AppsFlyer Dashboard](https://hq1.appsflyer.com/)
2. Navigate to **Engagement** → **OneLink**
3. Create a new OneLink template
4. Configure:
   - **Template Name**: Chayo Mobile
   - **iOS Destination**: `https://apps.apple.com/app/chayo/id6751903645`
   - **Android Destination**: `https://play.google.com/store/apps/details?id=com.chayo.mobile`
   - **Deep Link Scheme**: `chayo://`

5. Get your OneLink URL (e.g., `https://chayo.onelink.me/XXXX`)
6. Update in `DeepLinkService.ts`:

```typescript
// Line ~106
const oneLinkUrl = 'https://chayo.onelink.me/YOUR_ID'; // Replace YOUR_ID
```

## 📊 Usage Examples

### Create a Deep Link

```typescript
const link = DeepLinkService.generateAppsFlyerLink('acme-dental', {
  campaignId: 'qr-code-2025',
  mediaSource: 'social',
  channel: 'instagram',
});
```

### Track Events

```typescript
await DeepLinkService.trackAppsFlyerEvent('business_opened', {
  organizationSlug: 'acme-dental',
  timestamp: Date.now(),
});
```

### Set User ID

```typescript
await DeepLinkService.setAppsFlyerUserId(userId);
```

## ✅ Testing

### Test Deep Link on iOS

```bash
xcrun simctl openurl booted "chayo://business/test-business"
```

### Test Deep Link on Android

```bash
adb shell am start -W -a android.intent.action.VIEW -d "chayo://business/test-business" com.chayo.mobile
```

### Test OneLink (after setup)

```bash
# iOS
xcrun simctl openurl booted "https://chayo.onelink.me/XXXX?deep_link_value=test-business"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "https://chayo.onelink.me/XXXX?deep_link_value=test-business" com.chayo.mobile
```

## 🔍 Deferred Deep Linking Flow

1. **User clicks link** → `https://chayo.onelink.me/XXXX?organizationSlug=acme-dental`
2. **No app installed** → Redirected to App Store/Play Store
3. **User installs app**
4. **First launch** → AppsFlyer SDK fires `onInstallConversionData`
5. **DeepLinkService** extracts `organizationSlug` and stores it
6. **App navigates** to Acme Dental business page

## 🐛 Debugging

Enable debug mode (already configured in `DeepLinkService.ts`):

```typescript
const options = {
  devKey: 'jTd7SWWPyXcbcjNjScR2Ki',
  appId: 'id6751903645',
  isDebug: __DEV__, // Shows logs in development
};
```

Check logs:
- **iOS**: Check Xcode console for `[AppsFlyer]` logs
- **Android**: `adb logcat | grep AppsFlyer`

## 📚 Resources

- [AppsFlyer React Native Plugin](https://dev.appsflyer.com/hc/docs/react-native-plugin)
- [AppsFlyer Dashboard](https://hq1.appsflyer.com/)
- [OneLink Documentation](https://support.appsflyer.com/hc/en-us/articles/207032246-OneLink)

## ⚠️ Important Notes

- ✅ **No need to install manually** - autolinking handles native modules
- ✅ **Dev key already configured** in DeepLinkService
- ✅ **iOS App ID already configured** in DeepLinkService
- ⚠️ **Update OneLink URL** after creating template in dashboard
- ⚠️ **Android requires** AndroidManifest.xml updates (see above)

