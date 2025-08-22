interface SlugDetectionResult {
  isBusinessSlug: boolean;
  confidence: number;
  suggestedResponse?: string;
  businessSlug?: string; // The cleaned business slug if detected
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
              content: `You are a business slug detector. Determine if a user's message is a business code/slug or conversational.

BUSINESS SLUGS: Short alphanumeric strings (3-30 chars), may contain hyphens/underscores. Examples: "abc123", "my-business", "health-clinic". Usually standalone, no spaces.

CONVERSATIONAL: Questions, greetings, explanations, sentences with spaces.

Respond ONLY with: "SLUG" or "CONVERSATION"

Be conservative - if unsure, respond "CONVERSATION".`
            },
            {
              role: 'user',
              content: `User was asked for their business code. They said: "${message}"`
            }
          ],
          temperature: 0.3,
          max_tokens: 200,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content?.trim();
        
        if (content === 'SLUG') {
          return {
            isBusinessSlug: true,
            confidence: 0.9,
            businessSlug: message.trim().toLowerCase(), // Return the message itself as the slug
          };
        } else {
          return {
            isBusinessSlug: false,
            confidence: 0.8,
            suggestedResponse: 'Por favor, escribe el código de tu negocio. Suele ser una combinación de letras y números.',
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
    
    // Basic pattern matching as fallback
    const looksLikeSlug = /^[a-zA-Z0-9_-]{3,30}$/.test(trimmedMessage) && 
                         !/^[0-9]+$/.test(trimmedMessage) && // Not just numbers
                         !/(hola|hello|hi|que|what|como|how|ayuda|help)/i.test(trimmedMessage);

    if (looksLikeSlug) {
      return {
        isBusinessSlug: true,
        confidence: 0.7,
        businessSlug: trimmedMessage.toLowerCase(), // Return the message itself as the slug
      };
    }

    return {
      isBusinessSlug: false,
      confidence: 0.8,
      suggestedResponse: 'Por favor, escribe el código de tu negocio. Suele ser una combinación de letras y números.',
    };
  }
}
