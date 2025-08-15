/**
 * JSON Schemas for Tool Intent Detection
 * 
 * These schemas define the structure for AI responses in tool intent detection,
 * using OpenAI's Structured Outputs feature instead of prompt-based JSON enforcement.
 */

// TypeScript interface for tool intent responses
export interface ToolIntentResponse {
  response: string
  intents: string[]
}

// OpenAI Structured Output Schema for tool intent detection
export const ToolIntentResponseSchema = {
  type: "json_schema",
  json_schema: {
    name: "ToolIntentResponse",
    strict: true,
    schema: {
      type: "object",
      properties: {
        response: { 
          type: "string",
          description: "The helpful response to the user"
        },
        intents: { 
          type: "array",
          items: { type: "string" },
          description: "Array of detected tool intents (can be empty, single, or multiple)"
        },
      },
      required: ["response", "intents"],
      additionalProperties: false,
    },
  },
} as const