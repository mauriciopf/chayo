/**
 * JSON Schemas for Validation Service
 * 
 * These schemas define the structure for AI responses in validation operations,
 * using OpenAI's Structured Outputs feature instead of prompt-based JSON enforcement.
 */

// TypeScript interface for validation responses
export interface ValidationResponse {
  answered: boolean
  answer: string | null
  confidence: number | null
}

// OpenAI Structured Output Schema for validation
export const ValidationResponseSchema = {
  type: "json_schema",
  json_schema: {
    name: "ValidationResponse",
    strict: true,
    schema: {
      type: "object",
      properties: {
        answered: { 
          type: "boolean"
        },
        answer: { 
          type: ["string", "null"]
        },
        confidence: { 
          type: ["number", "null"],
          minimum: 0.0,
          maximum: 1.0
        }
      },
      required: ["answered", "answer", "confidence"],
      additionalProperties: false
    }
  }
} as const