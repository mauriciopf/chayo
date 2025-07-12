# WhatsApp Integration Setup

This document explains how to set up the WhatsApp Business integration using Twilio.

## Overview

The WhatsApp integration allows your AI agents to automatically respond to WhatsApp messages through Twilio's WhatsApp Business API.

## Prerequisites

1. **Twilio Account**: Sign up at https://twilio.com
2. **WhatsApp Business Account**: Verified and approved by Meta
3. **Twilio WhatsApp Sender**: Must be approved by Twilio
4. **Supabase Database**: Tables created with the provided migration

## Setup Steps

### 1. Twilio Configuration

1. Get your Twilio credentials:
   - Account SID
   - Auth Token
   - (Optional) Messaging Service SID

2. Set up WhatsApp Sender:
   - Go to Twilio Console > Messaging > Senders > WhatsApp senders
   - Request WhatsApp sender approval
   - Wait for approval (can take 1-3 business days)

3. Configure webhooks in Twilio:
   - Webhook URL: `https://your-domain.com/api/twilio/webhook`
   - Fallback URL: `https://your-domain.com/api/twilio/fallback`
   - Status Callback URL: `https://your-domain.com/api/twilio/status`

### 2. Environment Variables

Add these to your `.env.local` file:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_MESSAGING_SERVICE_SID=your_twilio_messaging_service_sid (optional)
TWILIO_WEBHOOK_URL=https://your-domain.com/api/twilio/webhook
```

### 3. Database Setup

Run the migration script to create necessary tables:

```sql
-- Run the contents of supabase/whatsapp_integration.sql
-- This creates the messages table and updates agent_channels
```

### 4. Frontend Integration

The WhatsApp onboarding flow is integrated into the integrations page at `/integrations`.

## API Endpoints

### Setup Endpoint
- **URL**: `/api/whatsapp/setup`
- **Method**: POST
- **Body**: 
  ```json
  {
    "phoneNumber": "1234567890",
    "countryCode": "1",
    "agentId": "uuid",
    "businessName": "Optional",
    "businessDescription": "Optional"
  }
  ```

### Status Check
- **URL**: `/api/whatsapp/status?agentId=uuid`
- **Method**: GET

### Webhook (Twilio)
- **URL**: `/api/twilio/webhook`
- **Method**: POST
- **Content-Type**: application/x-www-form-urlencoded

### Test Endpoint
- **URL**: `/api/whatsapp/test`
- **Method**: GET (status) / POST (test data)

## Usage Flow

1. User goes to `/integrations`
2. Selects WhatsApp Business channel
3. Fills out the onboarding form:
   - Selects country code
   - Enters WhatsApp Business phone number
   - Optionally adds business information
4. System creates Twilio messaging service (if needed)
5. System registers the phone number
6. System stores configuration in database
7. Incoming messages trigger webhook
8. AI generates responses based on agent configuration
9. Responses sent back via Twilio

## Database Schema

### agent_channels (extended)
```sql
- phone_number: TEXT
- country_code: TEXT  
- twilio_messaging_service_sid: TEXT
- twilio_phone_number_sid: TEXT
- webhook_url: TEXT
- status: TEXT (pending_verification, verified, active, error)
- user_id: UUID
```

### messages (new table)
```sql
- id: UUID (primary key)
- agent_id: UUID (foreign key)
- channel_id: UUID (foreign key)
- channel_type: TEXT
- direction: TEXT (inbound/outbound)
- content: TEXT
- from_number: TEXT
- to_number: TEXT
- twilio_message_sid: TEXT
- parent_message_id: UUID (for threading)
- status: TEXT
- error_code: TEXT
- error_message: TEXT
- metadata: JSONB
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## Troubleshooting

### Common Issues

1. **Phone number not valid**: Ensure the number is Twilio-verified
2. **Webhook not receiving**: Check Twilio webhook configuration
3. **Messages not sending**: Verify Twilio credentials and account status
4. **Database errors**: Ensure migration was run successfully

### Testing

1. Test API endpoints: `GET /api/whatsapp/test`
2. Check webhook: Send test message to Twilio number
3. Verify database: Check agent_channels and messages tables

## Security Notes

- All webhooks should use HTTPS in production
- Twilio credentials should be kept secure
- Database has Row Level Security (RLS) enabled
- User authentication required for all setup operations

## Next Steps

1. Implement AI response generation with OpenAI/ChatGPT
2. Add message threading and conversation history
3. Implement message templates and quick replies
4. Add analytics and reporting
5. Implement rate limiting and error handling
