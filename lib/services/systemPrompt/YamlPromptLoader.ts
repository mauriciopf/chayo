import yaml from 'js-yaml'

export interface SystemPromptConfig {
  identity: string
  objective: string
  behavior: string
  onboarding_stages: {
    stage_1: {
      title: string
      description: string
      questions: Array<{
        name: string
        type: 'open_ended' | 'multiple_choice'
        question: string
        field_name: string
        options?: string[]
        multiple?: boolean
        other?: boolean
      }>
    }
    stage_2: {
      title: string
      description: string
      industry_questions: Record<string, string[]>
      format_note: string
    }
    stage_3: {
      title: string
      description: string
      questions: Array<{
        name: string
        type: 'multiple_choice'
        question: string
        field_name: string
        options: string[]
        multiple: boolean
        other: boolean
      }>
    }
  }
  completion: string
  refinement_mode: string
  rules: string
  dynamics: string
  completion_signal: string
  language: {
    en: string
    es: string
  }
  fallback_prompt: string
}

export class YamlPromptLoader {
  private static config: SystemPromptConfig | null = null

  static async loadConfig(): Promise<SystemPromptConfig> {
    if (this.config) {
      return this.config
    }

    // Always return default config for client-side safety
    this.config = this.getDefaultConfig()
    return this.config
  }

  private static getDefaultConfig(): SystemPromptConfig {
    return {
      identity: "You are ChayoAI, an intelligent business assistant designed to help businesses set up their AI chatbot.",
      objective: "Guide users through a comprehensive onboarding process to collect essential business information.",
      behavior: "Be helpful, professional, and guide users step by step through the setup process.",
      onboarding_stages: {
        stage_1: {
          title: "Core Setup",
          description: "Collect basic business information",
          questions: [
            {
              name: "Business Name",
              type: "open_ended",
              question: "What is the name of your business?",
              field_name: "business_name"
            },
            {
              name: "Business Type",
              type: "multiple_choice",
              question: "What type of business do you run?",
              field_name: "business_type",
              options: ["Restaurant", "Retail", "Service", "Healthcare", "Other"],
              multiple: false,
              other: true
            }
          ]
        },
        stage_2: {
          title: "Industry Specific",
          description: "Ask industry-relevant questions",
          industry_questions: {
            "Restaurant": ["What cuisine do you serve?", "Do you offer delivery?", "What are your operating hours?"],
            "Retail": ["What products do you sell?", "Do you have online ordering?", "What are your store hours?"],
            "Service": ["What services do you offer?", "Do you require appointments?", "What is your service area?"],
            "Healthcare": ["What type of healthcare do you provide?", "Do you accept insurance?", "What are your office hours?"]
          },
          format_note: "Ask 3-5 relevant questions based on the business type."
        },
        stage_3: {
          title: "Branding & Tone",
          description: "Set the tone and style for your AI",
          questions: [
            {
              name: "Communication Style",
              type: "multiple_choice",
              question: "How should your AI communicate with customers?",
              field_name: "communication_style",
              options: ["Professional", "Friendly", "Casual", "Formal"],
              multiple: false,
              other: false
            }
          ]
        }
      },
      completion: "Setup complete! Your AI is ready to help customers.",
      refinement_mode: "Continue to refine and improve your AI's responses.",
      rules: "Always be helpful and accurate in your responses.",
      dynamics: "Adapt your responses based on the business context.",
      completion_signal: "Onboarding setup is now complete.",
      language: {
        en: "English",
        es: "Español"
      },
      fallback_prompt: "I'm here to help you set up your business AI assistant. Let's start with some basic information about your business."
    }
  }

  static async buildSystemPrompt(locale: string = 'en', trainingContext?: string): Promise<string> {
    const config = await this.loadConfig()
    
    const languageSection = config.language[locale as keyof typeof config.language] || config.language.en
    
    return `${config.identity}

${config.objective}

${config.behavior}

---
## 🔄 ONBOARDING STAGES

### Stage 1: Core Setup (Universal Questions)
Ask these in order, one at a time:
${config.onboarding_stages.stage_1.questions.map((q, index) => {
  if (q.type === 'open_ended') {
    return `  ${index + 1}. ${q.name} *(open-ended)*:
     - "${q.question}"`
  } else {
    return `  ${index + 1}. ${q.name} *(multiple choice)*:
     QUESTION: "${q.question}"
     OPTIONS: ${JSON.stringify(q.options)}
     MULTIPLE: ${q.multiple}
     OTHER: ${q.other}`
  }
}).join('\n\n')}

---
### Stage 2: Adaptive Branching (Dynamic Industry Questions)
Based on the business type answer in Stage 1, dynamically ask 3–5 relevant follow-up questions:

${Object.entries(config.onboarding_stages.stage_2.industry_questions).map(([industry, questions]) => 
  `#### If ${industry.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:
  ${questions.map(q => `  - ${q}`).join('\n  ')}`
).join('\n\n')}

${config.onboarding_stages.stage_2.format_note}

---
### Stage 3: Branding & Tone
After core and adaptive questions, collect branding and messaging details:
${config.onboarding_stages.stage_3.questions.map(q => 
  `  - ${q.name}:
    QUESTION: "${q.question}"
    OPTIONS: ${JSON.stringify(q.options)}
    MULTIPLE: ${q.multiple}
    OTHER: ${q.other}`
).join('\n\n')}

${config.completion}

${config.refinement_mode}

${config.rules}

${config.dynamics}

${config.completion_signal}

---
## LANGUAGE & CONTEXT
${languageSection}

${trainingContext ? `## 📚 BUSINESS KNOWLEDGE
${trainingContext}` : ''}`
  }

  static async getFallbackPrompt(): Promise<string> {
    const config = await this.loadConfig()
    return config.fallback_prompt
  }

  static async getAllQuestions(): Promise<Array<{
    stage: string
    name: string
    type: string
    question: string
    field_name: string
    options?: string[]
    multiple?: boolean
    other?: boolean
  }>> {
    const config = await this.loadConfig()
    const questions: Array<{
      stage: string
      name: string
      type: string
      question: string
      field_name: string
      options?: string[]
      multiple?: boolean
      other?: boolean
    }> = []

    // Stage 1 questions
    config.onboarding_stages.stage_1.questions.forEach(q => {
      questions.push({
        stage: 'stage_1',
        name: q.name,
        type: q.type,
        question: q.question,
        field_name: q.field_name,
        options: q.options,
        multiple: q.multiple,
        other: q.other
      })
    })

    // Stage 3 questions
    config.onboarding_stages.stage_3.questions.forEach(q => {
      questions.push({
        stage: 'stage_3',
        name: q.name,
        type: q.type,
        question: q.question,
        field_name: q.field_name,
        options: q.options,
        multiple: q.multiple,
        other: q.other
      })
    })

    return questions
  }
} 