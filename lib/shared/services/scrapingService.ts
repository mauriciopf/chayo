import { chromium } from 'playwright';
import { openAIService } from './OpenAIService';
import { BusinessInfoExtraction, BusinessInfoExtractionSchema } from '@/lib/shared/schemas/websiteScrapingSchemas';

export interface WebsiteScrapingResult {
  success: boolean;
  businessInfo?: Omit<BusinessInfoExtraction, 'hasEnoughInfo' | 'confidence' | 'extractedContent'>;
  rawContent?: string;
  error?: string;
}

export class ScrapingService {
  /**
   * Render a website using Puppeteer and extract HTML content
   */
  async renderWebsite(url: string): Promise<{ success: boolean; html?: string; error?: string }> {
    let browser: any = null;
    try {
      console.log('🌐 Starting website scraping for:', url);
      
      browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--disable-gpu'
        ]
      });
      
      const page = await browser.newPage();
      
      // Set viewport and user agent to avoid bot detection
      await page.setViewportSize({ width: 1366, height: 768 });
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      // Playwright's built-in timeout handling - will throw TimeoutError if exceeded
      await page.goto(url, { 
        waitUntil: "networkidle", 
        timeout: 5000 // 5 seconds timeout - if it can't load quickly, continue with onboarding
      });
      
      // Optional: small extra wait for late JS animations
      await new Promise(resolve => setTimeout(resolve, 500));

      const html = await page.content();
      
      console.log('✅ Website scraped successfully, HTML length:', html.length);
      return { success: true, html };
      
    } catch (error) {
      console.error('❌ Website scraping failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown scraping error' 
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Extract business information from HTML using AI with Structured Outputs
   */
  async extractBusinessInfo(html: string, url: string): Promise<WebsiteScrapingResult> {
    try {
      console.log('🤖 Extracting business information with AI...');
      
      // Clean and truncate HTML to avoid token limits
      const cleanedHtml = this.cleanHtml(html);
      
      const extractionPrompt = `Analyze this website content and extract key business information.

Website URL: ${url}
Website Content:
${cleanedHtml}

Instructions:
1. Extract business name, type, and contact information if clearly available
2. Set hasEnoughInfo to true ONLY if you find: business name, business type, AND at least one contact method (phone, email, or address)
3. Provide a confidence score based on how clear and complete the information is
4. Create a comprehensive summary in extractedContent that includes all found information
5. If information is not clearly stated, leave fields empty rather than guessing`;

      // 🎯 STRUCTURED OUTPUTS: Use BusinessInfoExtractionSchema for guaranteed structure
      const extractionResult = await openAIService.callStructuredCompletion<BusinessInfoExtraction>([
        { 
          role: 'system', 
          content: 'You are a business information extraction specialist. Extract clear, factual business information from website content. Be precise and only mark hasEnoughInfo as true when you have business name, type, and contact info.' 
        },
        { role: 'user', content: extractionPrompt }
      ], BusinessInfoExtractionSchema, {
        model: 'gpt-4o-mini',
        temperature: 0.1, // Low temperature for factual extraction
        maxTokens: 1000
      });

      console.log('✅ AI extraction completed with structured output:', {
        hasEnoughInfo: extractionResult.hasEnoughInfo,
        businessName: extractionResult.businessName,
        businessType: extractionResult.businessType,
        confidence: extractionResult.confidence
      });
      
      // Validate required fields are present
      if (!extractionResult.extractedContent) {
        console.warn('⚠️ Missing extractedContent in AI response');
        extractionResult.extractedContent = 'No content extracted';
      }
      
      if (typeof extractionResult.confidence !== 'number' || extractionResult.confidence < 0 || extractionResult.confidence > 1) {
        console.warn('⚠️ Invalid confidence value, setting to 0.5');
        extractionResult.confidence = 0.5;
      }
      
      return {
        success: true,
        businessInfo: extractionResult.hasEnoughInfo ? {
          businessName: extractionResult.businessName,
          businessType: extractionResult.businessType,
          contactInfo: extractionResult.contactInfo,
          description: extractionResult.description,
          services: extractionResult.services,
          hours: extractionResult.hours
        } : undefined,
        rawContent: extractionResult.extractedContent
      };
      
    } catch (error) {
      console.error('❌ Business info extraction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown extraction error'
      };
    }
  }

  /**
   * Clean HTML content for AI processing
   */
  private cleanHtml(html: string): string {
    // Remove script tags, style tags, and other non-content elements
    let cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ') // Remove all HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Truncate to avoid token limits (roughly 3000 tokens = 12000 characters)
    if (cleaned.length > 12000) {
      cleaned = cleaned.substring(0, 12000) + '...';
    }

    return cleaned;
  }

  // Note: evaluateBusinessInfo and parseBusinessInfo methods removed - 
  // now using OpenAI Structured Outputs for reliable extraction

  /**
   * Complete website scraping and business info extraction flow
   */
  async scrapeAndExtractBusinessInfo(url: string): Promise<WebsiteScrapingResult> {
    // Step 1: Scrape the website
    const scrapingResult = await this.renderWebsite(url);
    
    if (!scrapingResult.success || !scrapingResult.html) {
      return {
        success: false,
        error: scrapingResult.error || 'Failed to scrape website'
      };
    }

    // Step 2: Extract business information
    const extractionResult = await this.extractBusinessInfo(scrapingResult.html, url);
    
    return extractionResult;
  }
}

// Export singleton instance
export const scrapingService = new ScrapingService();