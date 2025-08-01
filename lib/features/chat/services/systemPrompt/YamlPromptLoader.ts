import yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'
import { getLocaleInstructions } from './i18nPromptUtils'
import { getMultipleChoiceFormattingInstructions } from './multipleChoiceFormatting'

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

  static async loadConfig(isSetupCompleted?: boolean): Promise<SystemPromptConfig> {
    if (this.config && !isSetupCompleted) {
      return this.config
    }

    try {
      // Choose the appropriate YAML file based on setup completion status
      const fileName = isSetupCompleted ? 'businessSystemPrompt.yaml' : 'onboardingSystemPrompt.yaml'
      const yamlPath = path.join(process.cwd(), 'lib', 'features', 'chat', 'services', 'systemPrompt', fileName)
      const yamlContent = fs.readFileSync(yamlPath, 'utf8')
      const config = yaml.load(yamlContent) as SystemPromptConfig
      
      // Only cache the onboarding config to avoid conflicts
      if (!isSetupCompleted) {
        this.config = config
      }
      return config
    } catch (error) {
      console.error(`Error loading ${isSetupCompleted ? 'businessSystemPrompt.yaml' : 'onboardingSystemPrompt.yaml'}:`, error)
      throw error
    }
  }


  static async buildSystemPrompt(locale: string = 'en', trainingContext?: string, isSetupCompleted?: boolean, currentStage?: string): Promise<string> {
    const config = await this.loadConfig(isSetupCompleted)
    
    // Get simplified language instructions
    const localeInstructions = getLocaleInstructions(locale)
    
    // Use YAML language section as fallback, but prefer the generic i18n instructions
    const languageSection = config.language?.[locale as keyof typeof config.language] || config.language?.en || localeInstructions.responseLanguage
    
    return `${config.identity}

${config.objective}

${config.behavior}

${config.refinement_mode || ''}

${config.rules}

${config.dynamics}

${currentStage && !isSetupCompleted ? `
---
## 🎯 CURRENT ONBOARDING STAGE
You are currently in: ${currentStage.toUpperCase()}

STAGE PROGRESSION RULES:
- You MUST complete all questions for the current stage before moving to the next stage
- Only emit status signals for the CURRENT stage you're working on
- NEVER jump to "STATUS: setup_complete" until ALL THREE STAGES are complete
- Stage order: stage_1 → stage_2 → stage_3 → setup_complete
- Current stage context: ${currentStage === 'stage_1' ? 'Core Setup (Universal Questions)' : currentStage === 'stage_2' ? 'Adaptive Branching (Dynamic Industry Questions)' : 'Branding & Tone'}
` : ''}

---
## 🌍 LANGUAGE INSTRUCTIONS
${localeInstructions.responseLanguage}

## ADDITIONAL CONTEXT INSTRUCTIONS
${languageSection}

${trainingContext ? `## 📚 BUSINESS KNOWLEDGE
${trainingContext}` : ''}

${getMultipleChoiceFormattingInstructions()}`
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