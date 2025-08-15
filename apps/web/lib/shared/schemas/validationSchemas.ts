/**
 * JSON Schemas for Validation Service
 * 
 * These schemas define the structure for AI responses in validation operations,
 * using OpenAI's Structured Outputs feature instead of prompt-based JSON enforcement.
 */

// TypeScript interface for validation responses
export interface ValidationResponse {
  answered: boolean
  answer?: string
  confidence?: number
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
          type: "boolean",
          description: "Whether the question was answered in the conversation"
        },
        answer: { 
          type: "string",
          description: "The extracted answer if the question was answered"
        },
        confidence: { 
          type: "number",
          minimum: 0.0,
          maximum: 1.0,
          description: "Confidence level in the validation result"
        },
      },
      required: ["answered"],
      additionalProperties: false,
    },
  },
} as const