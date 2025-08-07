/**
 * Question Format Configuration Loader
 * 
 * This module provides TypeScript interfaces and loading functionality
 * for the universal question format configuration defined in questionFormat.yaml
 * 
 * Uses import-based loading to avoid process.cwd() issues and provide
 * compile-time type safety for the question format specification.
 */

import yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'

// TypeScript interfaces for the question format configuration
export interface QuestionFormatConfig {
  format_version: string
  description: string
  json_schema: JsonSchema
  field_specifications: FieldSpecifications
  response_templates: ResponseTemplates
  formatting_rules: FormattingRules
  anti_patterns: AntiPatterns
  contextual_examples: ContextualExamples
}

export interface JsonSchema {
  description: string
  response_types: {
    structured_question: ResponseType
    conversational_message: ResponseType
  }
}

export interface ResponseType {
  description: string
  required_fields: string[]
  optional_fields: string[]
}

export interface FieldSpecifications {
  message: FieldSpec
  field_name: FieldSpec
  field_type: FieldTypeSpec
  multiple_choices: FieldSpec
  allow_multiple: FieldSpec
  status: StatusFieldSpec
  helper_text: FieldSpec
}

export interface FieldSpec {
  type: string
  description: string
  requirements?: string[]
  examples?: string[]
  use_cases?: string[]
  default?: any
  format?: string
  patterns?: Record<string, string[]>
  quality_guidelines?: string[]
  validation?: string
}

export interface FieldTypeSpec extends FieldSpec {
  allowed_values: string[]
  specifications: Record<string, {
    description: string
    use_cases: string[]
    requirements?: string[]
    validation: string
  }>
}

export interface StatusFieldSpec extends FieldSpec {
  allowed_values: {
    onboarding: string[]
    business_operations: string[]
  }
}

export interface ResponseTemplates {
  multiple_choice_question: ResponseTemplate
  text_input_question: ResponseTemplate
  conversational_response: ResponseTemplate
}

export interface ResponseTemplate {
  description: string
  template: string
  example: string
}

export interface FormattingRules {
  json_requirements: string[]
  content_requirements: string[]
  quality_standards: string[]
}

export interface AntiPatterns {
  forbidden_formats: string[]
  content_issues: string[]
  technical_problems: string[]
}

export interface ContextualExamples {
  healthcare: Record<string, string>
  salon_spa: Record<string, string>
  restaurant: Record<string, string>
}

/**
 * Question Format Loader Class
 * Provides centralized access to question format configuration
 */
export class QuestionFormatLoader {
  private static config: QuestionFormatConfig | null = null
  private static configPath = path.join(__dirname, 'questionFormat.yaml')

  /**
   * Load the question format configuration
   * Uses caching to avoid repeated file reads
   */
  static async loadConfig(): Promise<QuestionFormatConfig> {
    if (this.config) {
      return this.config
    }

    try {
      const yamlContent = fs.readFileSync(this.configPath, 'utf8')
      this.config = yaml.load(yamlContent) as QuestionFormatConfig
      return this.config
    } catch (error) {
      console.error('Error loading questionFormat.yaml:', error)
      throw new Error(`Failed to load question format configuration: ${error}`)
    }
  }

  /**
   * Generate the complete formatting instructions for AI prompts
   */
  static async getFormattingInstructions(): Promise<string> {
    const config = await this.loadConfig()
    
    return `## 📋 UNIVERSAL QUESTION FORMAT SPECIFICATION
${config.description}

**🚨 ABSOLUTE REQUIREMENT: JSON-ONLY RESPONSES**
${config.formatting_rules.json_requirements.map(rule => `- ${rule}`).join('\n')}

**📊 SUPPORTED RESPONSE TYPES:**

### 1. STRUCTURED QUESTION (Data Collection)
For questions that collect business information:

Required Fields: ${config.json_schema.response_types.structured_question.required_fields.join(', ')}
Optional Fields: ${config.json_schema.response_types.structured_question.optional_fields.join(', ')}

**EXAMPLE - Multiple Choice:**
\`\`\`json
${config.response_templates.multiple_choice_question.example}
\`\`\`

**EXAMPLE - Text Input:**
\`\`\`json
${config.response_templates.text_input_question.example}
\`\`\`

### 2. CONVERSATIONAL MESSAGE (No Data Collection)
For responses that don't require user input:

Required Fields: ${config.json_schema.response_types.conversational_message.required_fields.join(', ')}
Optional Fields: ${config.json_schema.response_types.conversational_message.optional_fields.join(', ')}

**EXAMPLE:**
\`\`\`json
${config.response_templates.conversational_response.example}
\`\`\`

**🎯 FIELD SPECIFICATIONS:**

### message
${config.field_specifications.message.description}
Requirements:
${config.field_specifications.message.requirements?.map(req => `- ${req}`).join('\n') || ''}

### field_name  
${config.field_specifications.field_name.description}
Format: ${config.field_specifications.field_name.format}
Requirements:
${config.field_specifications.field_name.requirements?.map(req => `- ${req}`).join('\n') || ''}

### field_type
${config.field_specifications.field_type.description}
Allowed Values: ${config.field_specifications.field_type.allowed_values.join(', ')}

**Field Type Usage:**
${Object.entries(config.field_specifications.field_type.specifications).map(([type, spec]) => 
  `- **${type}**: ${spec.description}\n  Use for: ${spec.use_cases.join(', ')}`
).join('\n')}

### multiple_choices
${config.field_specifications.multiple_choices.description}
Requirements:
${config.field_specifications.multiple_choices.requirements?.map(req => `- ${req}`).join('\n') || ''}

Quality Guidelines:
${config.field_specifications.multiple_choices.quality_guidelines?.map(guide => `- ${guide}`).join('\n') || ''}

### status (Progress Tracking)
${config.field_specifications.status.description}

**Onboarding Values:** ${config.field_specifications.status.allowed_values.onboarding.join(', ')}
**Business Operation Values:** ${config.field_specifications.status.allowed_values.business_operations.join(', ')}

**🚫 CRITICAL ANTI-PATTERNS TO AVOID:**

Forbidden Formats:
${config.anti_patterns.forbidden_formats.map(pattern => `- ❌ ${pattern}`).join('\n')}

Content Issues:
${config.anti_patterns.content_issues.map(issue => `- ❌ ${issue}`).join('\n')}

Technical Problems:
${config.anti_patterns.technical_problems.map(problem => `- ❌ ${problem}`).join('\n')}

**✅ QUALITY STANDARDS:**
${config.formatting_rules.quality_standards.map(standard => `- ${standard}`).join('\n')}

**🎯 REMEMBER:** Every response must be valid JSON that starts with { and ends with }. No markdown, no code blocks, no additional text outside the JSON structure.`
  }

  /**
   * Get specific field validation rules
   */
  static async getFieldValidation(fieldType: string): Promise<FieldSpec | null> {
    const config = await this.loadConfig()
    return (config.field_specifications as any)[fieldType] || null
  }

  /**
   * Get response template for a specific type
   */
  static async getResponseTemplate(templateType: keyof ResponseTemplates): Promise<ResponseTemplate | null> {
    const config = await this.loadConfig()
    return config.response_templates[templateType] || null
  }

  /**
   * Get contextual examples for a specific business type
   */
  static async getContextualExamples(businessType: keyof ContextualExamples): Promise<Record<string, string> | null> {
    const config = await this.loadConfig()
    return config.contextual_examples[businessType] || null
  }

  /**
   * Validate a JSON response against the format specification
   */
  static async validateResponse(response: any): Promise<{ valid: boolean; errors: string[] }> {
    const config = await this.loadConfig()
    const errors: string[] = []

    // Check if it's a valid response type
    const isStructuredQuestion = response.message && response.field_name && response.field_type
    const isConversationalMessage = response.message && !response.field_name

    if (!isStructuredQuestion && !isConversationalMessage) {
      errors.push('Response must be either a structured question or conversational message')
    }

    // Validate required fields for structured questions
    if (isStructuredQuestion) {
      const requiredFields = config.json_schema.response_types.structured_question.required_fields
      for (const field of requiredFields) {
        if (!response[field]) {
          errors.push(`Missing required field: ${field}`)
        }
      }

      // Validate field_type
      if (response.field_type && !config.field_specifications.field_type.allowed_values.includes(response.field_type)) {
        errors.push(`Invalid field_type: ${response.field_type}`)
      }

      // Validate multiple_choice requirements
      if (response.field_type === 'multiple_choice' && !response.multiple_choices) {
        errors.push('multiple_choices array is required for multiple_choice field_type')
      }

      // Validate field_name format (snake_case)
      if (response.field_name && !/^[a-z][a-z0-9_]*$/.test(response.field_name)) {
        errors.push('field_name must be in snake_case format')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

/**
 * Get universal question format instructions for AI prompts
 */
export async function getUniversalQuestionFormatInstructions(): Promise<string> {
  return QuestionFormatLoader.getFormattingInstructions()
}