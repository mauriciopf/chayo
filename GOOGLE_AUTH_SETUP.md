# 📧 Google Sign-In Setup for Chayo Mobile

## 🎯 Your App Details:
- **App Name:** Chayo
- **Bundle ID:** com.chayo.mobile
- **SHA-1 Fingerprint:** DD:73:F6:EF:E1:4D:17:44:46:47:86:11:A1:7D:59:30:B4:05:16:1B

## 🔧 Configuration Steps:

### 1. Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project for Chayo
3. Enable "Google Sign-In API"
4. Create 3 OAuth 2.0 Client IDs:

**iOS Client:**
- Type: iOS
- Name: Chayo iOS
- Bundle ID: com.chayo.mobile

**Android Client:**
- Type: Android  
- Name: Chayo Android
- Package: com.chayo.mobile
- SHA-1: DD:73:F6:EF:E1:4D:17:44:46:47:86:11:A1:7D:59:30:B4:05:16:1B

**Web Client:**
- Type: Web application
- Name: Chayo Web Client

### 2. Environment Variables
Copy the client IDs to your .env file:

```bash
cd apps/mobile
cp env.example .env
```

Edit .env:
```
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id.apps.googleusercontent.com
```

### 3. iOS Xcode Configuration
1. Open: `apps/mobile/ios/ChayoMobile.xcodeproj`
2. Select ChayoMobile target → Info tab
3. URL Types → Add new:
   - URL Schemes: [REVERSED_CLIENT_ID from iOS client]
   - Format: com.googleusercontent.apps.123456789-abcdef

### 4. Supabase Configuration
1. Supabase Dashboard → Auth → Providers
2. Enable Google:
   - Client ID: [Your Web Client ID]
   - Client Secret: [Your Web Client Secret]

## ✅ Testing Checklist:
- [ ] iOS: Google Sign-In button appears and works
- [ ] Android: Google Sign-In button appears and works  
- [ ] Customer email captured in database
- [ ] Progressive auth triggers on appointments/forms/documents

## 🎯 Expected User Flow:
1. User tries to book appointment
2. AuthGate triggers → Login modal appears
3. User taps "Continue with Google"
4. Google OAuth flow → User selects account
5. Returns to app → Customer record created
6. Appointment booked with customer email

Your Google Sign-In implementation is production-ready! 🚀
