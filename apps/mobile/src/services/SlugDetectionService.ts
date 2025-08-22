interface SlugDetectionResult {
  isBusinessSlug: boolean;
  confidence: number;
  suggestedResponse?: string;
  businessSlug?: string; // The cleaned business slug if detected
  mobileAppCode?: string; // The 6-digit mobile app code if detected
}

export class SlugDetectionService {
  /**
   * Detect if user input is a business slug using AI-powered analysis
   */
  static async detectSlug(message: string): Promise<SlugDetectionResult> {
    try {
      // Use OpenAI directly in mobile for intelligent slug detection
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`, // Use public env var for mobile
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a business code detector. Determine if a user's message is a business code or conversational.

BUSINESS CODES can be:
1. 6-DIGIT CODES: Exactly 6 digits like "123456", "000123", "987654"
2. BUSINESS SLUGS: Short alphanumeric strings (3-30 chars), may contain hyphens/underscores. Examples: "abc123", "my-business", "health-clinic"

CONVERSATIONAL: Questions, greetings, explanations, sentences with spaces.

Respond ONLY with: "6DIGIT", "SLUG", or "CONVERSATION"

Be conservative - if unsure, respond "CONVERSATION".`,
            },
            {
              role: 'user',
              content: `User was asked for their business code. They said: "${message}"`,
            },
          ],
          temperature: 0.3,
          max_tokens: 200,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content?.trim();

        if (content === '6DIGIT') {
          return {
            isBusinessSlug: true,
            confidence: 0.95,
            mobileAppCode: message.trim(), // Return as mobile app code
          };
        } else if (content === 'SLUG') {
          return {
            isBusinessSlug: true,
            confidence: 0.9,
            businessSlug: message.trim().toLowerCase(), // Return as business slug
          };
        } else {
          return {
            isBusinessSlug: false,
            confidence: 0.8,
            suggestedResponse: 'Por favor, escribe tu código de negocio (6 dígitos) o nombre del negocio.',
          };
        }
      }

      // Fallback if AI fails
      return this.fallbackDetection(message);
    } catch (error) {
      console.error('AI slug detection error:', error);
      // Fallback to pattern matching if AI fails
      return this.fallbackDetection(message);
    }
  }

  /**
   * Fallback pattern-based detection when AI is unavailable
   */
  private static fallbackDetection(message: string): SlugDetectionResult {
    const trimmedMessage = message.trim();

    // Check for 6-digit mobile app code first (highest priority)
    if (/^\d{6}$/.test(trimmedMessage)) {
      return {
        isBusinessSlug: true,
        confidence: 0.95,
        mobileAppCode: trimmedMessage,
      };
    }

    // Check for business slug pattern
    const looksLikeSlug = /^[a-zA-Z0-9_-]{3,30}$/.test(trimmedMessage) &&
                         !/^[0-9]{1,5}$|^[0-9]{7,}$/.test(trimmedMessage) && // Not 1-5 digits or 7+ digits
                         !/(hola|hello|hi|que|what|como|how|ayuda|help)/i.test(trimmedMessage);

    if (looksLikeSlug) {
      return {
        isBusinessSlug: true,
        confidence: 0.7,
        businessSlug: trimmedMessage.toLowerCase(),
      };
    }

    return {
      isBusinessSlug: false,
      confidence: 0.8,
      suggestedResponse: 'Por favor, escribe tu código de negocio (6 dígitos) o nombre del negocio.',
    };
  }
}
