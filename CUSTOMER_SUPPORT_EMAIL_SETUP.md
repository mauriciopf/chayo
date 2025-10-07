# Customer Support Email Notifications Setup

## 📧 Overview

When a customer sends a message through the mobile app's Customer Support chat, the organization owner receives an instant email notification using **Supabase Database Webhooks + Edge Functions**.

### How It Works

```
Customer sends message → customer_support_messages table
                      ↓
        Supabase Database Webhook (instant trigger)
                      ↓
        Edge Function: send-support-email
                      ↓
              Resend API sends email
                      ↓
     Organization owner receives notification
```

**Benefits:**
- ⚡ **Instant** - No delays, triggers immediately
- 🎯 **Reliable** - Supabase handles retries automatically
- 🧹 **Clean** - No cron jobs or queue tables needed
- 💰 **Cost-effective** - Only runs when needed

---

## 🚀 Setup Instructions

### 1. Run Database Migration

The migration creates a helper function to get the organization owner's email:

```bash
cd /Users/a6003927/Documents/chayo
npx supabase db push --file migrations/add_customer_support_email_notifications.sql
```

Or run the SQL manually in Supabase SQL Editor.

### 2. Set Up Resend (Email Provider)

1. **Sign up** at [resend.com](https://resend.com)
2. **Verify your domain** (`chayo.ai`)
   - Go to Domains → Add Domain
   - Add DNS records to your domain provider
   - Wait for verification (usually 5-10 minutes)
3. **Create API Key**
   - Go to API Keys → Create API Key
   - Copy the key (starts with `re_`)

### 3. Deploy the Edge Function

```bash
# Navigate to your project
cd /Users/a6003927/Documents/chayo

# Link to your Supabase project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Set the Resend API key as a secret
npx supabase secrets set RESEND_API_KEY=re_your_api_key_here

# Deploy the Edge Function
npx supabase functions deploy send-support-email
```

### 4. Create Database Webhook

1. Go to **Supabase Dashboard** → **Database** → **Webhooks**
2. Click **"Create a new hook"**
3. Configure the webhook:

   | Setting | Value |
   |---------|-------|
   | **Name** | `customer-support-email-notification` |
   | **Table** | `customer_support_messages` |
   | **Events** | ☑️ Insert |
   | **Type** | `supabase_functions.http_request` |
   | **Method** | `POST` |
   | **URL** | `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-support-email` |
   | **HTTP Headers** | `Authorization: Bearer YOUR_ANON_KEY` |

4. Click **"Create webhook"**

The webhook is now active and will trigger on every new message!

---

## 🧪 Testing

### Test 1: Send a Test Message

1. Open the **Chayo mobile app**
2. Go to **Customer Support** tab
3. Log in (if not already)
4. Send a test message: "Testing email notifications"

### Test 2: Check Edge Function Logs

```bash
# View recent logs
npx supabase functions logs send-support-email --limit 10

# Follow logs in real-time
npx supabase functions logs send-support-email --follow
```

### Test 3: Check Database

```sql
-- Verify the message was inserted
SELECT * FROM customer_support_messages 
ORDER BY created_at DESC 
LIMIT 5;

-- Check which organization it belongs to
SELECT 
    m.content,
    c.organization_id,
    c.customer_name,
    o.name as org_name,
    u.email as owner_email
FROM customer_support_messages m
JOIN customer_support_conversations c ON c.id = m.conversation_id
JOIN organizations o ON o.id = c.organization_id
JOIN auth.users u ON u.id = o.owner_id
WHERE m.sender_type = 'customer'
ORDER BY m.created_at DESC
LIMIT 5;
```

### Test 4: Check Resend Dashboard

1. Go to [resend.com/emails](https://resend.com/emails)
2. You should see the email in the list
3. Click on it to see delivery status

---

## 📊 Email Template

The email includes:

- **Customer name** (from conversation or message sender)
- **Subject line** (from conversation)
- **Message content** (formatted in a nice box)
- **CTA button** → "Ver y responder" → Links to dashboard
- **Organization name** in header
- **Chayo branding** in footer

Example:

```
┌─────────────────────────────────────┐
│  📬 Nuevo mensaje de cliente        │
│  Mi Negocio                         │
└─────────────────────────────────────┘

De: Juan Pérez
Asunto: Solicitud de soporte

Mensaje:
┌─────────────────────────────────────┐
│ Hola, necesito ayuda con mi pedido  │
└─────────────────────────────────────┘

        [ Ver y responder → ]

💡 Responde desde tu dashboard de Chayo AI
Tu cliente recibirá tu respuesta en tiempo real
```

---

## 🔧 Configuration Files

### Edge Function Location
```
supabase/functions/send-support-email/index.ts
```

### Migration File
```
migrations/add_customer_support_email_notifications.sql
```

---

## 🐛 Troubleshooting

### Emails Not Sending

**1. Check Edge Function Logs**
```bash
npx supabase functions logs send-support-email --limit 20
```

Look for errors like:
- `Error fetching conversation` → Check database permissions
- `Owner email not found` → Verify organization has owner_id set
- `Failed to send email` → Check Resend API key

**2. Verify Webhook is Active**
- Go to Supabase Dashboard → Database → Webhooks
- Check that the webhook shows as "Active"
- Look at the "Runs" tab for execution history

**3. Test the Edge Function Directly**
```bash
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-support-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "type": "INSERT",
    "table": "customer_support_messages",
    "record": {
      "id": "test-id",
      "conversation_id": "YOUR_REAL_CONVERSATION_ID",
      "sender_type": "customer",
      "sender_name": "Test User",
      "content": "Test message",
      "created_at": "2025-01-01T00:00:00Z"
    },
    "schema": "public"
  }'
```

**4. Check Resend API Key**
```bash
# Verify secret is set
npx supabase secrets list

# Update if needed
npx supabase secrets set RESEND_API_KEY=re_your_new_key
```

**5. Verify Domain in Resend**
- Go to Resend Dashboard → Domains
- Ensure `chayo.ai` shows "Verified" status
- Check DNS records are correct

### Wrong Email Recipient

The system sends to `organizations.owner_id → auth.users.email`.

**Check who owns the organization:**
```sql
SELECT 
    o.id as org_id,
    o.name as org_name,
    o.owner_id,
    u.email as owner_email
FROM organizations o
JOIN auth.users u ON u.id = o.owner_id
WHERE o.id = 'YOUR_ORG_ID';
```

**Update organization owner if needed:**
```sql
UPDATE organizations 
SET owner_id = 'NEW_OWNER_USER_ID'
WHERE id = 'YOUR_ORG_ID';
```

### Webhook Not Firing

**Check webhook configuration:**
1. Go to Supabase Dashboard → Database → Webhooks
2. Click on your webhook
3. Verify:
   - Table: `customer_support_messages`
   - Events: `Insert` is checked
   - Status: Active
   - URL is correct

**Test webhook manually:**
- Click "Send test event" in webhook settings
- Check Edge Function logs for execution

---

## 🔐 Environment Variables

Required in Supabase (set via `supabase secrets`):

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

Already available in Edge Functions automatically:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin operations)

---

## 🎯 How Organization Owner is Determined

```
customer_support_messages (customer message)
         ↓
customer_support_conversations (has organization_id)
         ↓
organizations (has owner_id)
         ↓
auth.users (owner's email)
```

Every organization has **one owner** set in `organizations.owner_id`.

---

## 📈 Monitoring

### View Recent Webhook Executions
1. Supabase Dashboard → Database → Webhooks
2. Click on webhook → "Runs" tab
3. See execution history with timestamps and status

### View Edge Function Logs
```bash
# Last 50 logs
npx supabase functions logs send-support-email --limit 50

# Real-time monitoring
npx supabase functions logs send-support-email --follow
```

### Resend Email Analytics
- Go to [resend.com/emails](https://resend.com/emails)
- View delivery rates, opens, clicks
- Check bounces and complaints

---

## 💡 Tips

1. **Test with Real Conversations**: Always test with a real customer conversation to ensure the full flow works
2. **Check Spam Folders**: First emails from Resend may go to spam until domain reputation builds
3. **Use Service Role Key**: Edge Function needs service role key to access `auth.users` table
4. **Monitor Costs**: Resend free tier includes 3,000 emails/month, Edge Functions have generous free tier
5. **Add More Recipients**: To notify multiple team members, modify the Edge Function to query `team_members` table

---

## 🚀 Future Enhancements

Possible improvements:
- [ ] Notify all team members (not just owner)
- [ ] Add email preferences (opt-out, frequency)
- [ ] SMS notifications via Twilio
- [ ] Slack/Discord integration
- [ ] Mobile push notifications
- [ ] Email templates in multiple languages
- [ ] Rich email with conversation history

---

## 📚 Related Documentation

- [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Resend Email API](https://resend.com/docs/send-with-nodejs)

---

## ✅ Checklist

Use this checklist to ensure everything is set up correctly:

- [ ] Database migration run successfully
- [ ] Resend account created and domain verified
- [ ] Resend API key generated
- [ ] Edge Function deployed (`supabase functions deploy send-support-email`)
- [ ] Secret set (`supabase secrets set RESEND_API_KEY=...`)
- [ ] Database webhook created and active
- [ ] Test message sent from mobile app
- [ ] Email received by organization owner
- [ ] Edge Function logs show success
- [ ] Resend dashboard shows email delivered

---

**Support:** If you encounter issues, check the troubleshooting section above or review the Edge Function logs for detailed error messages.
