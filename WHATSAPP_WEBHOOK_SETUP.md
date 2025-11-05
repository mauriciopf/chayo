# WhatsApp Webhook Setup Guide

## 1. Add Environment Variables

Add these to your `.env.local` (development) and Vercel (production):

```bash
# WhatsApp/Facebook Configuration
FACEBOOK_APP_SECRET=your_facebook_app_secret
WHATSAPP_WEBHOOK_VERIFY_TOKEN=chayo_wh_secure_2024_xyz789abc123def456

# Example verify token (use your own random string):
# WHATSAPP_WEBHOOK_VERIFY_TOKEN=chayo_whatsapp_webhook_2024_secure_token_xyz123
```

**Important**: 
- `FACEBOOK_APP_SECRET`: Get this from your Facebook App Dashboard → Settings → Basic
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`: Choose any random secure string (you'll enter this in Facebook too)

## 2. Configure Facebook App Webhook

1. **Go to Facebook App Dashboard** → WhatsApp → Configuration

2. **Webhook Settings**:
   - Click "Edit" next to Callback URL
   - **Callback URL**: `https://chayo.ai/api/whatsapp/webhooks`
     - For local testing: Use ngrok → `https://your-ngrok-url.ngrok.io/api/whatsapp/webhooks`
   - **Verify Token**: Enter the exact same value as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - Click "Verify and Save"

3. **Subscribe to Webhooks**:
   - Find "Webhook fields" section
   - Subscribe to these fields:
     - ✅ **`account_update`** (REQUIRED - for embedded signup tracking)
     - ✅ **`messages`** (optional - for receiving incoming messages)
     - ✅ **`message_template_status_update`** (optional - for template approvals)

## 3. Test the Webhook

### Local Testing with ngrok:
```bash
# Terminal 1: Start your dev server
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000

# Use the ngrok URL in Facebook webhook settings:
# https://abc123.ngrok.io/api/whatsapp/webhooks/account-update
```

### Check Logs:
Your webhook will log events like:
- `PARTNER_APP_INSTALLED` - User completes Embedded Signup ✅
- `PARTNER_APP_UNINSTALLED` - User revokes access ⚠️
- `ACCOUNT_VIOLATION` - Policy violation ❌
- `DISABLED_UPDATE` - Account disabled/reinstated
- `ACCOUNT_DELETED` - Account deleted

## 4. Webhook URL Format

| Environment | Webhook URL |
|------------|-------------|
| Production | `https://chayo.ai/api/whatsapp/webhooks` |
| Staging | `https://staging.chayo.ai/api/whatsapp/webhooks` |
| Local (ngrok) | `https://[your-ngrok-id].ngrok.io/api/whatsapp/webhooks` |

## 5. What the Webhook Does

### Webhook Fields Handled:

#### `account_update` (REQUIRED):
- **PARTNER_APP_INSTALLED**: Logs when user completes signup (actual linking happens in `/api/whatsapp/signup`)
- **PARTNER_APP_UNINSTALLED**: Deactivates the WhatsApp connection in database
- **ACCOUNT_VIOLATION**: Logs policy violations
- **DISABLED_UPDATE**: Logs account status changes
- **ACCOUNT_DELETED**: Logs account deletion

#### `messages` (optional):
- Receives incoming WhatsApp messages from customers
- TODO: Implement message storage and auto-response logic

#### `message_template_status_update` (optional):
- Notifies when message templates are approved/rejected by WhatsApp
- TODO: Implement template status tracking

### Security:
- Verifies webhook signature using `FACEBOOK_APP_SECRET`
- Only processes events from verified Facebook requests
- Returns 403 for invalid signatures

## 6. Troubleshooting

### Webhook verification fails:
- ✅ Check `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches in both .env and Facebook settings
- ✅ Ensure your server is publicly accessible (not localhost directly)
- ✅ Check ngrok is running if testing locally

### Events not received:
- ✅ Verify you subscribed to `account_update` in Facebook dashboard
- ✅ Check webhook URL is correct and publicly accessible
- ✅ Look at server logs for incoming requests
- ✅ Test webhook using Facebook's "Test" button

### Signature verification fails:
- ✅ Ensure `FACEBOOK_APP_SECRET` is correct
- ✅ Check you're not modifying the request body before verification
- ✅ Verify the secret matches your Facebook App (not a test/sandbox app)

