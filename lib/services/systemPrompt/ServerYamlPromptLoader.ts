import { SystemPromptConfig, YamlPromptLoader } from './YamlPromptLoader'
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

  static async buildSystemPrompt(locale: string = 'en', trainingContext?: string, isSetupCompleted?: boolean, currentStage?: string): Promise<string> {
    // Use the YamlPromptLoader to build the system prompt with the appropriate config
    return await YamlPromptLoader.buildSystemPrompt(locale, trainingContext, isSetupCompleted, currentStage)
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