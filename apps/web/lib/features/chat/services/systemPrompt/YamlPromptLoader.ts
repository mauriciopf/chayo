import yaml from 'js-yaml'
import { getLocaleInstructions } from './i18nPromptUtils'
// Note: getUniversalQuestionFormatInstructions removed - using OpenAI Structured Outputs instead

// Import YAML files directly - webpack will handle them
import onboardingYaml from './onboardingSystemPrompt.yaml'
import businessYaml from './businessSystemPrompt.yaml'

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
      // Choose the appropriate YAML content based on setup completion status
      const yamlContent = isSetupCompleted ? businessYaml : onboardingYaml
      const config = yaml.load(yamlContent) as SystemPromptConfig
      
      // Only cache the onboarding config to avoid conflicts
      if (!isSetupCompleted) {
        this.config = config
      }
      return config
    } catch (error) {
      console.error(`Error loading ${isSetupCompleted ? 'business' : 'onboarding'} system prompt:`, error)
      throw error
    }
  }


  static async buildSystemPrompt(locale: string = 'es', trainingContext?: string, isSetupCompleted?: boolean): Promise<string> {
    const config = await this.loadConfig(isSetupCompleted)
    
    // Get simplified language instructions
    const localeInstructions = getLocaleInstructions(locale)
    
    // Use YAML language section as fallback, but prefer the generic i18n instructions
    const languageSection = config.language?.[locale as keyof typeof config.language] || config.language?.es || localeInstructions.responseLanguage
    
    // 🎯 STRUCTURED OUTPUTS: No longer need complex JSON formatting instructions
    // OpenAI's response_format parameter guarantees proper JSON structure
    
    return `${config.identity}

${config.objective}

${config.behavior}

${config.refinement_mode || ''}

${config.rules}

${config.dynamics}

## 🌍 LANGUAGE INSTRUCTIONS
${localeInstructions.responseLanguage}

## ADDITIONAL CONTEXT INSTRUCTIONS
${languageSection}

${trainingContext ? `## 📚 BUSINESS KNOWLEDGE
${trainingContext}` : ''}

## 🎯 RESPONSE FORMAT
Response structure is automatically enforced via OpenAI Structured Outputs. Focus on providing helpful, accurate content.`
  }

  static async getFallbackPrompt(): Promise<string> {
    const config = await this.loadConfig()
    return config.fallback_prompt
  }


} 
