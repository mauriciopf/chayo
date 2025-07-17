# OTP Verification Debug Guide

## Current Issue
OTP codes are consistently showing "invalid code error" even with correct codes.

## Debugging Steps

### 1. Check Supabase Project Configuration

**Go to your Supabase Dashboard → Authentication → Settings**

Check these settings:
- **Enable email confirmations**: Should be `false` for OTP flow
- **Disable new user signups**: Should be `false` to allow new users
- **Enable phone confirmations**: Should be `false` unless using phone auth

### 2. Check Email Settings

**Go to Supabase Dashboard → Authentication → Email Templates**

- **Confirm signup**: Should be enabled
- **Magic Link**: Check if this is interfering
- **OTP**: Verify the template exists

### 3. Environment Variables

Verify your `.env.local` file has:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Test with Console Logs

1. Open browser DevTools → Console
2. Try the OTP flow
3. Check for console logs with:
   - 📧 OTP send attempt
   - ✅ OTP sent successfully  
   - 🔍 OTP verification attempt
   - ✅ or ❌ verification results

### 5. Check Network Tab

1. Open DevTools → Network tab
2. Send OTP code
3. Look for:
   - `/api/auth/otp/send` - should return 200 OK
   - `/api/auth/otp/verify` - check the response

### 6. Common Fixes

#### Fix 1: Disable Email Confirmation
```sql
-- Run in Supabase SQL Editor
UPDATE auth.config 
SET enable_email_confirmations = false;
```

#### Fix 2: Check User Table
```sql
-- See if users are being created
SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 5;
```

#### Fix 3: Check Auth Events
```sql
-- Check recent auth events
SELECT * FROM auth.audit_log_entries 
WHERE instance_id = (SELECT instance_id FROM auth.users LIMIT 1)
ORDER BY created_at DESC LIMIT 10;
```

### 7. Manual Test

Try this in your browser console on localhost:3000:
```javascript
// Test OTP send
const sendResponse = await fetch('/api/auth/otp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@youremail.com' })
});
console.log('Send:', await sendResponse.json());

// Then check your email and test verify with the actual code
const verifyResponse = await fetch('/api/auth/otp/verify', {
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@youremail.com', code: '123456' })
});
console.log('Verify:', await verifyResponse.json());
```

### 8. Alternative Implementation

If the issue persists, we can switch to Magic Link authentication:
```javascript
// In AuthFlow.tsx, replace OTP with magic link
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/dashboard`,
  },
});
```

## Expected Console Output

When working correctly, you should see:
```
📧 OTP send attempt for email: user@example.com
✅ OTP sent successfully to: user@example.com
🔍 OTP verification attempt: { email: 'user@example.com', code: '12****' }
🔄 Trying verification type: email (Standard email verification)  
✅ OTP verification successful with type: email
```

## Next Steps

1. Run through steps 1-4 above
2. Try the manual test in step 7
3. Check the console for specific error messages
4. Let me know what you find so I can provide targeted fixes 