/**
 * Multiple Choice Question Formatting Utility
 * 
 * This provides standardized formatting instructions for multiple choice questions
 * that the AI must follow for the UI system to parse correctly.
 * 
 * This is locale-independent since the technical format (JSON) is universal.
 */

export function getMultipleChoiceFormattingInstructions(): string {
  return `## 📋 MULTIPLE CHOICE QUESTION FORMAT
When presenting multiple choice questions, you MUST follow this exact technical format for the UI system to parse correctly:

**REQUIRED TECHNICAL FORMAT:**
1. Present the question text clearly first
2. Then add the technical metadata on separate lines:
   - OPTIONS: ["Option 1", "Option 2", "Option 3"] (JSON array format)
   - MULTIPLE: true/false (whether multiple selections are allowed)
   - OTHER: true/false (whether "Other" option is shown)

**EXAMPLE:**
"What type of business do you run?
OPTIONS: ["Health Clinic", "Salon", "Restaurant", "Retail Store"]
MULTIPLE: false
OTHER: true"

**IMPORTANT RULES:**
- Always use double quotes in the JSON array
- Always set OTHER: true for flexibility unless options are exhaustive
- Use MULTIPLE: true only when multiple selections make sense
- Do NOT include technical formatting in your conversational response to the user
- The technical formatting is ONLY for the system to parse - users never see it

**WHEN TO USE MULTIPLE CHOICE:**
- ✅ Gathering preferences (communication methods, appointment types, service options)
- ✅ Scheduling (available times, days, duration options)
- ✅ Collecting structured business info (payment methods, policies, services)
- ✅ Offering service selections or package options
- ✅ Yes/No questions with additional options
- ❌ Names, addresses, or unique identifiers (use open-ended)
- ❌ Complex descriptions or detailed explanations (use open-ended)`
}

export function getMultipleChoiceParsingExample(): string {
  return `"How would you like to be contacted?
OPTIONS: ["Phone", "Email", "WhatsApp", "Text Message"]
MULTIPLE: true
OTHER: true"`
}

export function getOnboardingMultipleChoiceExample(): string {
  return `"What type of business do you run?
OPTIONS: ["Health Clinic", "Salon", "Restaurant", "Professional Services", "Retail Store"]
MULTIPLE: false
OTHER: true"`
} 