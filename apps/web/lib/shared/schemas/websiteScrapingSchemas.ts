/**
 * JSON Schemas for Website Scraping and Business Information Extraction
 * 
 * These schemas define the structure for AI responses when extracting business
 * information from website content using OpenAI's Structured Outputs feature.
 */

// TypeScript interface for business information extraction
export interface BusinessInfoExtraction {
  hasEnoughInfo: boolean
  businessName?: string
  businessType?: string
  contactInfo?: {
    phone?: string
    email?: string
    address?: string
  }
  description?: string
  services?: string[]
  hours?: string
  confidence: number
  extractedContent: string
}

// OpenAI Structured Output Schema for business information extraction
export const BusinessInfoExtractionSchema = {
  type: "json_schema",
  json_schema: {
    name: "BusinessInfoExtraction",
    strict: true,
    schema: {
      type: "object",
      properties: {
        hasEnoughInfo: {
          type: "boolean",
          description: "Whether sufficient business information was found (business name, type, and contact info)"
        },
        businessName: {
          type: "string",
          description: "The name of the business"
        },
        businessType: {
          type: "string", 
          description: "Type of business (e.g., restaurant, salon, clinic, law firm, etc.)"
        },
        contactInfo: {
          type: "object",
          properties: {
            phone: {
              type: "string",
              description: "Business phone number"
            },
            email: {
              type: "string",
              description: "Business email address"
            },
            address: {
              type: "string",
              description: "Business physical address"
            }
          },
          additionalProperties: false
        },
        description: {
          type: "string",
          description: "Brief description of what the business does"
        },
        services: {
          type: "array",
          items: {
            type: "string"
          },
          description: "List of main services or products offered"
        },
        hours: {
          type: "string",
          description: "Business hours or operating schedule"
        },
        confidence: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Confidence level in the extracted information (0.0 to 1.0)"
        },
        extractedContent: {
          type: "string",
          description: "Summary of all extracted business information for embedding storage"
        }
      },
      required: ["hasEnoughInfo", "confidence", "extractedContent"],
      additionalProperties: false
    }
  }
} as const