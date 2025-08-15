# Chayo Mobile App Architecture

## 🏗️ **Architecture Overview**

The Chayo mobile app is built with a **modular, white-label architecture** that supports dynamic configuration per organization.

### **Key Features**
- ✅ **Dynamic Tab Navigation** - Tabs are generated based on organization's enabled tools
- ✅ **ChatGPT-Style Native Chat** - Beautiful, smooth chat experience
- ✅ **WebView Tool Integration** - Existing web tools rendered in mobile-optimized WebViews
- ✅ **OTA Updates** - Over-the-air updates using Expo Updates
- ✅ **White-Label Ready** - Runtime configuration loading per organization

## 📁 **Project Structure**

```
apps/mobile/
├── src/
│   ├── components/
│   │   ├── WebViewScreen.tsx      # Reusable WebView component
│   │   └── index.ts               # Component exports
│   ├── screens/
│   │   ├── ChatScreen.tsx         # Native chat (ChatGPT style)
│   │   ├── AppointmentsScreen.tsx # Appointments WebView
│   │   ├── PaymentsScreen.tsx     # Payments WebView
│   │   ├── DocumentsScreen.tsx    # Documents WebView
│   │   ├── FAQsScreen.tsx         # FAQs WebView
│   │   ├── WhatsAppScreen.tsx     # WhatsApp WebView
│   │   └── index.ts               # Screen exports
│   ├── navigation/
│   │   └── AppNavigator.tsx       # Dynamic tab navigation
│   ├── context/
│   │   └── AppConfigContext.tsx   # App configuration provider
│   ├── hooks/
│   │   └── useAppConfig.ts        # Configuration hook
│   └── types/
│       └── navigation.ts          # Navigation type definitions
├── App.tsx                        # Main app entry point
├── app.config.js                  # Expo configuration
├── eas.json                       # EAS build/update config
└── package.json                   # Dependencies
```

## 🔧 **Configuration System**

### **packages/config**
Shared configuration package that handles:
- **AppConfig Types** - TypeScript definitions for app configuration
- **URL Generation** - Dynamic URL creation for tools
- **Navigation Config** - Tab generation based on enabled tools
- **Config Loading** - API integration for fetching organization settings

### **Configuration Flow**
1. **App Start** → Load organization config by slug/email
2. **Config Loaded** → Generate navigation tabs based on enabled tools
3. **Dynamic Tabs** → Show only enabled tools as tabs
4. **WebView URLs** → Mobile-optimized URLs with `mobile=true&hideNav=true`

## 🎨 **UI/UX Design**

### **Native Chat (Home Tab)**
- **ChatGPT-inspired design** with smooth animations
- **Message bubbles** with proper spacing and colors
- **Typing indicators** and loading states
- **Error handling** with retry functionality
- **Auto-scroll** to latest messages

### **WebView Screens**
- **Mobile-optimized** with injected CSS to hide navigation
- **Pull-to-refresh** functionality
- **Loading states** and error handling
- **Custom user agent** for tracking mobile usage

### **Tab Navigation**
- **Dynamic tabs** based on organization's enabled tools
- **Emoji icons** (can be replaced with proper icons)
- **Consistent theming** using organization's primary color

## 🔗 **API Integration**

### **Client Chat API**
```typescript
POST /api/client-chat
{
  "message": "User message",
  "organizationId": "org-id",
  "locale": "es",
  "messages": [...previousMessages]
}
```

### **Organization Config API** (To be implemented)
```typescript
GET /api/organizations/{slug}/mobile-config
Response: {
  organizationSlug: string,
  organizationId: string,
  businessName: string,
  appName: string,
  theme: { primaryColor, secondaryColor, ... },
  enabledTools: ['appointments', 'payments', ...]
}
```

## 🚀 **White-Label Strategy**

### **Free Tier (Current Implementation)**
- **Single app binary** serves all organizations
- **Runtime configuration** loaded by organization slug
- **QR code entry** for customers (no login required)
- **Email login** for business owners

### **Paid Tier (Future)**
- **Dedicated app binaries** with custom branding
- **App Store presence** with organization's name/logo
- **Deep customization** beyond just colors and features

## 📱 **Entry Points**

### **QR Code Flow**
1. User scans QR code with organization slug
2. App loads configuration for that organization
3. Shows tools and chat specific to that business

### **Email Login Flow**
1. User enters email address
2. System looks up associated organization
3. Loads configuration and shows business-specific experience

## 🔄 **OTA Updates**

- **Expo Updates** integration for seamless updates
- **Update prompts** in Spanish for user experience
- **Automatic checks** on app start
- **Graceful fallbacks** if updates fail

## 🛠️ **Development Commands**

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev:mobile

# Build for different environments
pnpm build:dev
pnpm build:preview  
pnpm build:prod

# Push OTA updates
pnpm update:dev
pnpm update:preview
pnpm update:prod
```

## 🎯 **Next Steps**

1. **Deep Link Handling** - Support for QR codes and custom URL schemes
2. **Icon System** - Replace emoji icons with proper icon library
3. **Offline Support** - Cache configuration and show appropriate messages
4. **Push Notifications** - Integration with chat system
5. **Voice Input** - Add voice message support to chat
6. **Biometric Auth** - For business owner login
7. **Analytics** - Track usage and feature adoption

## 🔧 **Configuration Example**

```typescript
const exampleConfig: AppConfig = {
  organizationSlug: 'acme-dental',
  organizationId: 'org-123',
  businessName: 'ACME Dental Clinic',
  appName: 'Chayo', // Free tier
  theme: {
    primaryColor: '#007AFF',
    secondaryColor: '#5856D6',
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
  },
  enabledTools: ['appointments', 'documents', 'faqs'],
  webBaseUrl: 'https://chayo-ai-site.vercel.app',
  apiBaseUrl: 'https://chayo-ai-site.vercel.app',
};
```

This configuration would generate:
- **Home tab** (native chat)
- **Book tab** (appointments WebView)
- **Forms tab** (documents WebView)  
- **Help tab** (FAQs WebView)

The payments and WhatsApp tabs would be hidden since they're not in `enabledTools`.