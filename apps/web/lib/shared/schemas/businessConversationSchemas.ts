/**
 * JSON Schemas for Business Conversation Responses (Post-Onboarding)
 * 
 * These schemas define the structure for AI responses during normal business operations,
 * after the onboarding process is complete. They use OpenAI's Structured Outputs feature
 * to guarantee consistent JSON responses without complex prompt engineering.
 */

// TypeScript interfaces for business conversation responses
export interface BusinessConversationalResponse {
  message: string
  status: 'active' | 'helping' | 'clarifying' | 'completed'
}

export interface BusinessQuestionResponse {
  message: string
  question_template: string
  field_name: string
  field_type: 'text' | 'multiple_choice' | 'boolean' | 'number'
  multiple_choices?: string[] | null
  allow_multiple?: boolean | null
  status: 'collecting_info' | 'follow_up' | 'clarifying'
}

// OpenAI Structured Output Schemas
export const BusinessConversationalSchema = {
  type: "json_schema",
  json_schema: {
    name: "BusinessConversational",
    strict: true,
    schema: {
      type: "object",
      properties: {
        message: { 
          type: "string",
          description: "The conversational response to the user"
        },
        status: { 
          type: "string", 
          enum: ["active", "helping", "clarifying", "completed"],
          description: "Current conversation status"
        },
      },
      required: ["message", "status"],
      additionalProperties: false,
    },
  },
} as const

export const BusinessQuestionSchema = {
  type: "json_schema",
  json_schema: {
    name: "BusinessQuestion",
    strict: true,
    schema: {
      type: "object",
      properties: {
        message: { 
          type: "string",
          description: "The question or response message to display to the user"
        },
        question_template: {
          type: "string",
          description: "The core question being asked, extracted from the message"
        },
        field_name: { 
          type: "string",
          description: "Unique identifier for this business information field"
        },
        field_type: { 
          type: "string", 
          enum: ["text", "multiple_choice", "boolean", "number"],
          description: "The type of data being collected"
        },
        multiple_choices: { 
          type: "array", 
          items: { type: "string" }, 
          nullable: true,
          description: "Available choices for multiple_choice field_type"
        },
        allow_multiple: { 
          type: "boolean", 
          nullable: true,
          description: "Whether multiple choices can be selected"
        },
        status: { 
          type: "string", 
          enum: ["collecting_info", "follow_up", "clarifying"],
          description: "Current information collection status"
        },
      },
      required: ["message", "question_template", "field_name", "field_type", "status"],
      additionalProperties: false,
    },
  },
} as const

// Union type for all business conversation responses
export type BusinessConversationResponse = BusinessConversationalResponse | BusinessQuestionResponse