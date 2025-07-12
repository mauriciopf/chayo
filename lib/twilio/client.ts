import twilio from 'twilio'

// Check if Twilio credentials are properly configured
const hasValidCredentials = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  
  return accountSid && 
         authToken && 
         accountSid.startsWith('AC') && 
         accountSid.length > 10 &&
         authToken.length > 10
}

// Only create client if credentials are valid
export const twilioClient = hasValidCredentials() 
  ? twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
  : null

export const TWILIO_CONFIG = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
  webhookUrl: process.env.TWILIO_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_SITE_URL}/api/twilio/webhook`,
  isConfigured: hasValidCredentials()
}
