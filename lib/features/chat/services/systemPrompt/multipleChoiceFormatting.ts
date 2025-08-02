/**
 * Multiple Choice Question Formatting Utility
 * 
 * This provides standardized formatting instructions for multiple choice questions
 * that the AI must follow for the UI system to parse correctly.
 * 
 * This is locale-independent since the technical format (JSON) is universal.
 */

export function getMultipleChoiceFormattingInstructions(): string {
  return `## 📋 STRUCTURED QUESTION FORMAT
When presenting questions, you MUST return a structured JSON response for the UI system to parse correctly:

**REQUIRED JSON FORMAT:**
You must return ONLY a valid JSON object - no markdown, no code blocks, no additional text. Return this exact structure:

{
  "question_template": "Your question text here",
  "field_name": "snake_case_field_name", 
  "field_type": "text" | "multiple_choice",
  "multiple_choices": ["Option 1", "Option 2", "Option 3"]
}

**EXAMPLES:**

For multiple choice questions, return:
{
  "question_template": "What type of business do you run?",
  "field_name": "business_type",
  "field_type": "multiple_choice",
  "multiple_choices": ["Health Clinic", "Salon", "Restaurant", "Retail Store"]
}

For text questions, return:
{
  "question_template": "What is your business name?",
  "field_name": "business_name", 
  "field_type": "text"
}

**IMPORTANT RULES:**
- Return ONLY the JSON object - no markdown code blocks, no \`\`\`json, no additional text
- field_name must be snake_case (lowercase with underscores)  
- field_type must be exactly "text" or "multiple_choice"
- multiple_choices array is required for multiple_choice type, omit for text type
- Generate meaningful field_name based on the question content
- Always provide "Other" option flexibility in multiple choice arrays when appropriate

**WHEN TO USE MULTIPLE CHOICE:**
- ✅ Gathering preferences (communication methods, appointment types, service options)
- ✅ Scheduling (available times, days, duration options)  
- ✅ Collecting structured business info (payment methods, policies, services)
- ✅ Offering service selections or package options
- ✅ Yes/No questions with additional options
- ❌ Names, addresses, or unique identifiers (use "text" type)
- ❌ Complex descriptions or detailed explanations (use "text" type)`
}

export function getMultipleChoiceParsingExample(): string {
  return `{
  "question_template": "How would you like to be contacted?",
  "field_name": "contact_preference",
  "field_type": "multiple_choice",
  "multiple_choices": ["Phone", "Email", "WhatsApp", "Text Message", "Other"]
}`
}

export function getOnboardingMultipleChoiceExample(): string {
  return `{
  "question_template": "What type of business do you run?",
  "field_name": "business_type",
  "field_type": "multiple_choice", 
  "multiple_choices": ["Health Clinic", "Salon", "Restaurant", "Professional Services", "Retail Store", "Other"]
}`
} 