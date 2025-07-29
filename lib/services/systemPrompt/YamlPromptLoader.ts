import yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'

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
      const fileName = isSetupCompleted ? 'systemPrompt.yaml' : 'onboardingSystemPrompt.yaml'
      const yamlPath = path.join(process.cwd(), 'lib', 'services', 'systemPrompt', fileName)
      const yamlContent = fs.readFileSync(yamlPath, 'utf8')
      const config = yaml.load(yamlContent) as SystemPromptConfig
      
      // Only cache the onboarding config to avoid conflicts
      if (!isSetupCompleted) {
        this.config = config
      }
      return config
    } catch (error) {
      console.error(`Error loading ${isSetupCompleted ? 'systemPrompt.yaml' : 'onboardingSystemPrompt.yaml'}:`, error)
      throw error
    }
  }


  static async buildSystemPrompt(locale: string = 'en', trainingContext?: string, isSetupCompleted?: boolean): Promise<string> {
    const config = await this.loadConfig(isSetupCompleted)
    
    const languageSection = config.language[locale as keyof typeof config.language] || config.language.en
    
    return `${config.identity}

${config.objective}

${config.behavior}

${config.refinement_mode}

${config.rules}

${config.dynamics}

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