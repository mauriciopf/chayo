# React Navigation Setup - Chayo Mobile

This document outlines the navigation structure for the Chayo Mobile app using React Navigation with bottom tabs.

## Installed Dependencies

### Core Navigation
- `@react-navigation/native` - Core navigation library
- `@react-navigation/bottom-tabs` - Bottom tab navigator
- `@react-navigation/native-stack` - Native stack navigator
- `@react-navigation/stack` - JavaScript stack navigator

### Required Dependencies
- `react-native-screens` - Native screen management
- `react-native-safe-area-context` - Safe area handling
- `react-native-gesture-handler` - Gesture handling
- `react-native-reanimated` - Animations

## Planned Tab Structure

Based on the "Business ALL-App" concept, here are the planned tabs:

### 1. **Home** 🏠
- Business dashboard overview
- Quick actions
- Recent activity
- Notifications

### 2. **Chat** 💬
- Chat with Chayo AI
- Customer conversations
- Chat history
- Voice messages

### 3. **Appointments** 📅
- View upcoming appointments
- Book new appointments
- Reschedule/cancel
- Calendar integration

### 4. **Payments** 💳
- Payment links
- Transaction history
- Saved payment methods
- Invoices

### 5. **Profile** 👤
- Business settings
- User profile
- App preferences
- Support & help

## File Structure

```
src/
├── navigation/
│   └── AppNavigator.tsx        # Main navigation setup
├── screens/
│   ├── HomeScreen.tsx
│   ├── ChatScreen.tsx
│   ├── AppointmentsScreen.tsx
│   ├── PaymentsScreen.tsx
│   └── ProfileScreen.tsx
├── components/
│   └── shared/                 # Reusable components
├── services/
│   └── api/                    # API calls
└── types/
    └── navigation.ts           # Navigation type definitions
```

## Next Steps

1. **Create Screen Components**: Build individual screen components
2. **Add Icons**: Install and configure icon library (react-native-vector-icons)
3. **Implement Navigation**: Replace placeholder screens with real components
4. **Add Authentication Flow**: Implement login/signup screens
5. **Configure Deep Linking**: Set up URL schemes for the app

## Usage

Once implemented, you can navigate between tabs and screens:

```typescript
// Navigate to a specific tab
navigation.navigate('Chat');

// Navigate with parameters
navigation.navigate('Appointments', { appointmentId: '123' });

// Go back
navigation.goBack();
```

## Integration with Web App

The mobile app will share:
- **API endpoints** from `packages/shared`
- **Types and schemas** for data consistency
- **Business logic** where applicable

This ensures consistency between web and mobile experiences while maintaining platform-specific UI/UX.