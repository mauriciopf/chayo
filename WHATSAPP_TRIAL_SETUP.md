# WhatsApp Trial System Configuration

This document outlines the setup and configuration for the 3-day WhatsApp trial system.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# CRON Secret Token for scheduled jobs
CRON_SECRET_TOKEN=your-secure-random-token-here

# Twilio Configuration (required for WhatsApp)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Database Setup

1. Run the SQL scripts to create the required tables:
   ```bash
   # Execute the SQL in your Supabase dashboard or via CLI
   supabase migration create whatsapp_trials
   # Copy contents from supabase/whatsapp_trials.sql
   ```

## CRON Job Setup

Set up a scheduled job to check for expired trials. You can use:

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/whatsapp/expire-trials",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Option 2: External CRON Service

Use a service like cron-job.org or similar to call:
```
POST https://your-domain.com/api/whatsapp/expire-trials
Headers:
  Authorization: Bearer your-cron-secret-token
```

Schedule: Every 6 hours (`0 */6 * * *`)

### Option 3: Manual Trigger

You can manually trigger trial expiration by making a POST request to:
```
curl -X POST https://your-domain.com/api/whatsapp/expire-trials \
  -H "Authorization: Bearer your-cron-secret-token"
```

## API Endpoints

### Trial Management
- `GET /api/whatsapp/trials` - List user's trials
- `POST /api/whatsapp/trials` - Manage trials (expire, etc.)

### Trial Expiration (CRON)
- `POST /api/whatsapp/expire-trials` - Process expired trials
- `GET /api/whatsapp/expire-trials` - Health check

### WhatsApp Status (Enhanced)
- `GET /api/whatsapp/status?agentId=<id>` - Get status with trial info

## Trial Flow

1. **Trial Creation**: When a user selects "Get New Twilio Number" in the WhatsApp onboarding
2. **Trial Duration**: 3 days from creation
3. **Trial Expiration**: Automated via CRON job
4. **Number Release**: Twilio phone number is released automatically
5. **User Notification**: Status updated to show trial expired

## Database Schema

### whatsapp_trials table
- `id` - UUID primary key
- `user_id` - References auth.users
- `agent_id` - References agents
- `phone_number` - Twilio phone number
- `twilio_number_sid` - Twilio number SID for API calls
- `trial_start_date` - When trial started
- `trial_end_date` - When trial expires (start + 3 days)
- `status` - 'active', 'expired', 'released'
- `created_at` - Record creation timestamp
- `updated_at` - Last update timestamp

## Monitoring

Monitor the following:
- CRON job execution logs
- Trial expiration success/failure rates
- Twilio API errors during number release
- User feedback on trial experience

## Testing

Test the trial system:
1. Create a new WhatsApp channel with "Get New Twilio Number"
2. Verify trial record is created
3. Manually trigger expiration endpoint
4. Verify number is released and status updated
