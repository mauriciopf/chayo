import { SystemPromptConfig } from './YamlPromptLoader'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

export class ServerYamlPromptLoader {
  private static config: SystemPromptConfig | null = null

  static loadConfig(): SystemPromptConfig {
    if (this.config) {
      return this.config
    }

    // Read from the actual systemPrompt.yaml file
    this.config = this.loadYamlConfig()
    return this.config
  }

  private static loadYamlConfig(): SystemPromptConfig {
    try {
      // Read the systemPrompt.yaml file
      const yamlPath = path.join(process.cwd(), 'lib', 'services', 'systemPrompt', 'systemPrompt.yaml')
      const yamlContent = fs.readFileSync(yamlPath, 'utf8')
      const config = yaml.load(yamlContent) as SystemPromptConfig
      
      return config
    } catch (error) {
      console.error('Error loading systemPrompt.yaml:', error)
      // Fallback to a minimal config if YAML loading fails
      throw error
    }
  }

  static async buildSystemPrompt(locale: string = 'en', trainingContext?: string): Promise<string> {
    const config = this.loadConfig()
    
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
    const config = this.loadConfig()
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
    const config = this.loadConfig()
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

    // Stage 1 questions (7 questions)
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

    // Note: Stage 2 questions are dynamic and will be added based on business type selection
    // They are not included in the initial question set to keep them truly dynamic

    // Stage 3 questions (3 questions)
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