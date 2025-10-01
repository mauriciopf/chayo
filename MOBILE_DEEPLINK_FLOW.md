# Mobile App Deep Link Flow - QR Code to Business

## 📱 Overview

The mobile app now supports a **QR code → Business flow** where:

1. **Business owner** completes onboarding → Generates QR code in dashboard
2. **QR code** contains deep link: `chayo://business/{slug}`
3. **Customer scans QR** → Opens mobile app → Shows vibe card
4. **Organization slug** is stored in AsyncStorage
5. **On app reopen** → Customer goes directly to their business (not marketplace)

---

## 🔄 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Business Owner (Web Dashboard)                             │
│  1. Completes onboarding                                    │
│  2. QR Code generated with: chayo://business/{slug}         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Customer Scans QR Code                                     │
│  - Opens mobile app                                         │
│  - Deep link detected: chayo://business/acme-dental         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  DeepLinkService                                            │
│  1. Parses deep link                                        │
│  2. Extracts organization slug                              │
│  3. Stores slug in AsyncStorage                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  BusinessInitialView Screen                                 │
│  - Fetches vibe card from API                               │
│  - Shows business info, story, values                       │
│  - "Enter Business" button → BusinessDetail screen          │
│  - "Explore Marketplace" → Clears slug, goes to Marketplace │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  On App Reopen                                              │
│  - App.tsx checks AsyncStorage for stored slug             │
│  - If slug exists → initialRoute = 'BusinessInitialView'   │
│  - If no slug → initialRoute = 'Marketplace'               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Implementation Details

### 1. **QR Code Generation (Web)**
**File:** `apps/web/lib/features/chat/components/ClientQRCode.tsx`

```tsx
// Generates mobile deep link (not web URL)
const chatUrl = `chayo://business/${organizationSlug}`
```

### 2. **Deep Link API Endpoint (Web)**
**File:** `apps/web/app/api/vibe-card/[slug]/route.ts`

```typescript
GET /api/vibe-card/{slug}

Response:
{
  success: true,
  organization: { id, name, slug },
  vibeCard: {
    business_name,
    business_type,
    origin_story,
    value_badges,
    perfect_for,
    vibe_colors,
    vibe_aesthetic,
    ai_generated_image_url
  }
}
```

### 3. **Deep Link Service (Mobile)**
**File:** `apps/mobile/src/services/DeepLinkService.ts`

- Parses deep link: `chayo://business/{slug}`
- Verifies organization exists via API
- Stores slug in AsyncStorage
- Returns slug to navigation handler

### 4. **Storage Service (Mobile)**
**File:** `apps/mobile/src/services/StorageService.ts`

New methods:
```typescript
setOrganizationSlug(slug: string)
getOrganizationSlug(): Promise<string | null>
clearOrganizationSlug()
```

### 5. **BusinessInitialView Screen (Mobile)**
**File:** `apps/mobile/src/screens/BusinessInitialView.tsx`

**Features:**
- Fetches vibe card data from API using stored slug
- Displays business vibe card with:
  - AI-generated image
  - Business name & type
  - Origin story
  - Value badges
  - "Perfect for" customer types
  - Custom brand colors
- **"Entrar al Negocio"** button → Navigates to BusinessDetail
- **"Explorar Otros Negocios"** button → Clears slug & goes to Marketplace

### 6. **App.tsx Navigation (Mobile)**
**File:** `apps/mobile/App.tsx`

```typescript
// On app start
const storedSlug = await StorageService.getOrganizationSlug()

if (storedSlug) {
  initialRoute = 'BusinessInitialView'  // Customer has scanned QR
} else {
  initialRoute = 'Marketplace'          // Fresh install, no QR
}
```

**Deep Link Listener:**
```typescript
DeepLinkService.setupDeepLinkListener((organizationSlug) => {
  // Slug is stored automatically
  // User will see BusinessInitialView on next app open
})
```

---

## 📍 Navigation Stack

```typescript
RootStackParamList = {
  Marketplace: undefined                    // Default for fresh users
  BusinessInitialView: undefined            // For QR code users
  BusinessDetail: {
    organizationSlug: string
    businessName: string
  }
  // ... other screens
}
```

---

## 🎯 User Flows

### **Flow A: Fresh Install (No QR Code)**
1. User downloads app
2. Opens app → `Marketplace` screen
3. Browses vibe cards
4. Taps card → `BusinessDetail` screen

### **Flow B: QR Code Scan (First Time)**
1. Customer scans QR code
2. App opens with deep link
3. `DeepLinkService` stores slug
4. **Next app open** → `BusinessInitialView`
5. Customer sees their business vibe card
6. Taps "Entrar al Negocio" → `BusinessDetail`

### **Flow C: Returning Customer (Has Scanned QR)**
1. Customer opens app
2. App checks AsyncStorage → finds slug
3. **Directly opens** `BusinessInitialView`
4. Customer immediately sees their business

### **Flow D: Customer Wants to Explore**
1. From `BusinessInitialView`
2. Taps "Explorar Otros Negocios"
3. Slug is cleared from AsyncStorage
4. Navigates to `Marketplace`
5. **Next app open** → Back to `Marketplace` (no stored slug)

---

## 🔐 Security & Validation

1. **Deep link validation:** `DeepLinkService.verifyOrganizationSlug()` checks if org exists
2. **API validation:** `/api/vibe-card/[slug]` verifies organization in database
3. **Graceful fallback:** If vibe card not found, shows error with retry/marketplace options

---

## 🎨 Design Notes

- **BusinessInitialView** uses vibe card colors for theming
- Displays AI-generated image with brand color overlay
- Spanish translations throughout
- Smooth animations (fade for BusinessInitialView, slide for BusinessDetail)

---

## 🚀 Testing

### Test Deep Link:
1. Generate QR code in web dashboard after onboarding
2. Scan QR with phone (or use deep link tester)
3. Verify app opens and shows `BusinessInitialView`
4. Check AsyncStorage has slug stored
5. Close and reopen app → Should open `BusinessInitialView` again
6. Tap "Explorar Otros Negocios" → Goes to Marketplace
7. Close and reopen app → Should open `Marketplace` (slug cleared)

### Deep Link Format:
```
chayo://business/{organizationSlug}
```

Example:
```
chayo://business/acme-dental
chayo://business/yoga-studio-23
```

---

## 📝 Future Enhancements

1. **Universal Links:** Add associated domains for `https://chayo.vercel.app/mobile/{slug}`
2. **Multiple Businesses:** Allow customers to save multiple businesses
3. **Push Notifications:** Notify customers about business updates
4. **Offline Support:** Cache vibe card data for offline viewing

