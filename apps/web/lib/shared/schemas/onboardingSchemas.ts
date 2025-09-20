/**
 * JSON Schemas for OpenAI Structured Outputs
 * These replace the error-prone JSON formatting instructions in system prompts
 */

// Unified schema for onboarding - handles both questions AND completion with conditional logic
export const OnboardingSchema = {
  type: "json_schema",
  json_schema: {
    name: "onboarding_response",
    strict: true,
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "The conversational message to display to the user"
        },
        status: {
          type: "string",
          enum: [
            "onboarding_in_progress",
            "setup_complete"
          ],
          description: "Current onboarding status"
        },
        field_name: {
          type: "string",
          enum: [
            "business_name",
            "business_type", 
            "origin_story",
            "value_badges",
            "perfect_for"
          ],
          description: "Essential vibe card field name"
        },
        field_type: {
          type: "string",
          enum: ["text", "multiple_choice", "array"],
          description: "Type of input expected"
        },
        question_template: {
          type: "string", 
          description: "The actual question being asked"
        },
        multiple_choices: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Array of choices for multiple choice questions"
        },
        allow_multiple: {
          type: "boolean",
          description: "Whether multiple choices can be selected"
        }
      },
      oneOf: [
        {
          // Completion case - only message and status required
          properties: {
            status: { const: "setup_complete" }
          },
          required: ["message", "status"]
        },
        {
          // Question case - all fields required
          properties: {
            status: { const: "onboarding_in_progress" }
          },
          required: ["message", "status", "field_name", "field_type", "question_template", "multiple_choices", "allow_multiple"]
        }
      ],
      additionalProperties: false
    }
  }
} as const

// Schema for business conversation responses (post-onboarding)
export const BusinessResponseSchema = {
  type: "json_schema",
  json_schema: {
    name: "business_response", 
    strict: true,
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "The response message as a realistic customer"
        },
        customer_type: {
          type: "string",
          enum: ["first_time", "returning", "price_conscious", "urgent", "premium_seeker", "comparison_shopper"],
          description: "Type of customer persona being portrayed"
        },
        intent: {
          type: "string",
          enum: ["inquiry", "booking", "pricing", "availability", "complaint", "compliment", "information"],
          description: "Intent behind the customer question"
        }
      },
      required: ["message"],
      additionalProperties: false
    }
  }
} as const

// Type definitions for TypeScript
export interface OnboardingQuestionResponse {
  message: string
  status: "onboarding_in_progress" | "setup_complete"
  field_name: string
  field_type: "text" | "multiple_choice" | "boolean" | "number" | "array"
  question_template: string
  multiple_choices: string[]
  allow_multiple: boolean
}

export interface OnboardingStatusResponse {
  message: string
  status: "setup_complete"
}

export interface CustomerSimulationResponse {
  message: string
  customer_type?: "first_time" | "returning" | "price_conscious" | "urgent" | "premium_seeker" | "comparison_shopper"
  intent?: "inquiry" | "booking" | "pricing" | "availability" | "complaint" | "compliment" | "information"
}