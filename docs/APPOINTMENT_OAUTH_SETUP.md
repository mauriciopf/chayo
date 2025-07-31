# Appointment Provider Integration Guide

This document explains how appointment booking providers are integrated - some use OAuth, others use manual URL setup.

## Integration Types

### ✅ **Calendly** - OAuth Integration
**Automatic setup with user authorization**

### ⚠️ **Vagaro** - Manual URL Setup  
**No public OAuth API available**

### ⚠️ **Square** - Manual URL Setup
**OAuth too complex for simple booking integration**

## Environment Variables (Calendly Only)

Add these environment variables to your `.env.local` file for Calendly OAuth:

```env
# App URL for OAuth redirects
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Calendly OAuth
CALENDLY_CLIENT_ID=your_calendly_client_id
CALENDLY_CLIENT_SECRET=your_calendly_client_secret
```

## Setup Instructions

### 1. Calendly OAuth Setup

1. Go to [Calendly Developer Console](https://developer.calendly.com/)
2. Create a new OAuth application
3. Set redirect URI to: `http://localhost:3000/api/appointment-auth/calendly/callback`
4. Copy Client ID and Client Secret to environment variables
5. Scope required: `default`

### 2. Vagaro Manual Setup

1. Business signs into their Vagaro account
2. Goes to **Settings → Website & Widgets**
3. Copies their public booking URL
4. Pastes URL into Chayo setup form

### 3. Square Manual Setup

1. Business signs into Square Dashboard
2. Goes to **Appointments → Settings**
3. Finds their public booking URL
4. Pastes URL into Chayo setup form

## How Each Integration Works

### Calendly OAuth Flow (Automatic)

1. **User clicks "Connect to Calendly"** 
   - Frontend calls `/api/organizations/[id]/appointment-auth/calendly`
   - Backend checks if Calendly OAuth credentials are configured
   - If not configured, returns "OAuth not configured" message

2. **OAuth Authorization**
   - Backend generates secure state parameter
   - Redirects user to Calendly OAuth authorization URL
   - User authorizes Chayo app in their Calendly account

3. **OAuth Callback**
   - Calendly redirects back with authorization code
   - Backend exchanges code for access token
   - Fetches user's scheduling URL from Calendly API
   - Stores tokens and URL in database automatically

4. **Connected**
   - User sees "Connected" status with their Calendly URL
   - Can now save settings and enable appointments
   - Calendly widget embeds automatically

### Manual URL Setup (Vagaro/Square)

1. **User selects Vagaro or Square**
2. **Setup instructions shown**
   - Clear step-by-step guide to find their booking URL
   - Provider-specific dashboard navigation
3. **Manual URL entry**
   - User copies booking URL from their provider dashboard
   - Pastes URL into Chayo setup form
4. **Save settings**
   - URL validated and stored
   - Clients redirected to provider's booking page

## Error Handling

### OAuth Errors (Calendly)
- **Not configured**: Missing environment variables
- **Authorization denied**: User cancels OAuth flow
- **Invalid credentials**: Wrong client ID/secret
- **API failure**: Calendly API unavailable

### Manual Setup Errors (Vagaro/Square)
- **Invalid URL**: URL format validation fails
- **Missing URL**: User tries to save without entering URL

## Database Schema

Appointment settings are stored in the `appointment_settings` table:

```sql
CREATE TABLE appointment_settings (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    provider TEXT NOT NULL, -- 'calendly', 'square', 'vagaro', 'custom'
    provider_url TEXT, -- Retrieved from OAuth or manually entered
    settings JSONB DEFAULT '{}', -- OAuth tokens and user info
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

The `settings` JSONB column stores:
- `access_token`: OAuth access token
- `refresh_token`: OAuth refresh token (if available)
- `expires_at`: Token expiration timestamp
- `user_info`: Provider-specific user information

## Security Considerations

- State parameters include organization ID, user ID, and timestamp for security
- Tokens are stored securely in the database
- Redirect URIs must match exactly what's configured with each provider
- Access tokens should be refreshed when they expire (not yet implemented)