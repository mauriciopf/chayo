export type ChatContextType = 'business_setup' | 'whatsapp_setup' | 'calendar_setup' | 'video_agent_setup';

export function getSystemMessageForContext(context: ChatContextType): string {
  switch (context) {
    case 'whatsapp_setup':
      return "Let's connect your WhatsApp channel! Please follow the steps to link your WhatsApp account.";
    case 'calendar_setup':
      return "Let's add calendar booking to your agent. Please follow the steps to connect your calendar.";
    case 'video_agent_setup':
      return "Let's launch your Video Agent. Please follow the steps to set up video chat for your business.";
    case 'business_setup':
    default:
      return "You are now back in business setup mode. Continue adding information about your business.";
  }
} 