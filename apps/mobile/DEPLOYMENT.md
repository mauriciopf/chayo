# Mobile App Deployment Setup

This guide covers setting up automated deployments for the Chayo mobile app using EAS (Expo Application Services).

## Prerequisites

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev)
2. **EAS CLI**: Install globally with `npm install -g @expo/eas-cli`
3. **App Store Connect Account** (for iOS)
4. **Google Play Console Account** (for Android)

## Initial Setup

### 1. Initialize EAS Project

```bash
cd apps/mobile
npx eas init
```

This will:
- Link your project to Expo
- Generate a project ID
- Update `app.config.js` with the project ID

### 2. Configure App Store Connect (iOS)

1. Create your app in [App Store Connect](https://appstoreconnect.apple.com)
2. Note your App Store Connect App ID (found in App Information)
3. Update `eas.json` and replace `REPLACE_WITH_APP_STORE_CONNECT_ID` with your actual App ID

### 3. Configure Google Play Console (Android)

1. Create your app in [Google Play Console](https://play.google.com/console)
2. Create a service account for API access:
   - Go to Google Cloud Console
   - Create service account with Google Play Developer API access
   - Download the JSON key file
3. Save the JSON file as `apps/mobile/play-sa.json` (don't commit this!)

### 4. GitHub Secrets Setup

Add these secrets to your GitHub repository:

#### Required Secrets

- `EAS_TOKEN`: Create with `eas token:create` command

#### iOS Secrets (if deploying to App Store)

Option A - Individual secrets:
- `APPLE_ID`: Your Apple ID email
- `APPLE_APP_SPECIFIC_PASSWORD`: App-specific password
- `APPLE_TEAM_ID`: Your Apple Developer Team ID

Option B - App Store Connect API Key:
- `APPLE_API_KEY_ID`: Key ID
- `APPLE_API_ISSUER_ID`: Issuer ID  
- `APPLE_API_PRIVATE_KEY`: Private key content

#### Android Secrets (if deploying to Google Play)

- `GOOGLE_PLAY_SERVICE_ACCOUNT`: Contents of your service account JSON file

## Build Profiles

### Development
- **Purpose**: Development builds with debugging enabled
- **iOS**: Simulator builds
- **Android**: APK builds
- **Usage**: `eas build --profile development`

### Preview  
- **Purpose**: Testing builds for internal distribution
- **iOS**: Ad-hoc distribution
- **Android**: APK builds
- **Usage**: `eas build --profile preview`

### Production
- **Purpose**: Store-ready builds
- **iOS**: App Store distribution
- **Android**: AAB (Android App Bundle)
- **Usage**: `eas build --profile production`

## Manual Deployment Commands

### Build Only
```bash
# iOS
eas build --platform ios --profile production

# Android  
eas build --platform android --profile production

# Both platforms
eas build --platform all --profile production
```

### Build + Submit to Stores
```bash
# iOS (requires App Store Connect setup)
eas build --platform ios --profile production --auto-submit

# Android (requires Google Play setup)
eas build --platform android --profile production --auto-submit
```

### OTA Updates (Over-The-Air)
```bash
# Update production channel
eas update --branch production --message "Bug fixes and improvements"

# Update preview channel
eas update --branch preview --message "New features for testing"
```

## Automated Deployment

The GitHub Actions workflow (`.github/workflows/mobile-deploy.yml`) automatically:

1. **On Push to Main**: Creates OTA update for production
2. **Manual Trigger**: Allows building specific platforms/profiles
3. **Pull Requests**: Runs build validation

### Trigger Manual Deployment

1. Go to GitHub Actions tab
2. Select "Mobile App Deploy" workflow
3. Click "Run workflow"
4. Choose platform, profile, and submit options

## File Structure

```
apps/mobile/
├── eas.json                 # EAS build configuration
├── app.config.js           # Expo app configuration  
├── play-sa.json           # Google Play service account (don't commit!)
└── DEPLOYMENT.md          # This guide

.github/workflows/
└── mobile-deploy.yml      # GitHub Actions workflow
```

## Troubleshooting

### Common Issues

1. **"Project not found"**: Run `eas init` to link project
2. **"Invalid bundle identifier"**: Ensure iOS/Android package names are unique
3. **"Keystore not found"**: EAS will generate Android keystore automatically
4. **"App Store Connect API error"**: Verify App ID and API credentials

### Debug Commands

```bash
# Check project status
eas project:info

# View build logs
eas build:list
eas build:view [BUILD_ID]

# Test configuration
eas build:configure
```

## Security Notes

- Never commit `play-sa.json` or other credential files
- Use GitHub Secrets for all sensitive data
- Rotate API tokens regularly
- Use least-privilege access for service accounts

## Next Steps

1. Complete the initial setup steps above
2. Test with a preview build first
3. Set up store listings and metadata
4. Configure automated deployment triggers
5. Monitor builds and updates through EAS dashboard