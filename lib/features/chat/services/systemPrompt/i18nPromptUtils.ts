export interface LocaleInstructions {
  responseLanguage: string
  tone: string
}

// Simplified interfaces - most content should be universal
export interface OnboardingLocaleInstructions extends LocaleInstructions {}

export interface BusinessLocaleInstructions extends LocaleInstructions {}

// Simplified locale instructions - focus only on language
const LOCALE_INSTRUCTIONS = {
  en: {
    responseLanguage: 'ALWAYS respond in English. Use a professional but friendly tone.',
    tone: 'professional but friendly'
  },
  es: {
    responseLanguage: 'SIEMPRE responde en español. Usa un tono profesional pero amigable.',
    tone: 'profesional pero amigable'
  }
} as const

export function getLocaleInstructions(locale: string): LocaleInstructions {
  const instructions = LOCALE_INSTRUCTIONS[locale as keyof typeof LOCALE_INSTRUCTIONS] || LOCALE_INSTRUCTIONS.en
  return instructions
}

export function getOnboardingLocaleInstructions(locale: string): OnboardingLocaleInstructions {
  const instructions = LOCALE_INSTRUCTIONS[locale as keyof typeof LOCALE_INSTRUCTIONS] || LOCALE_INSTRUCTIONS.en
  return instructions as OnboardingLocaleInstructions
}

export function getBusinessLocaleInstructions(locale: string): BusinessLocaleInstructions {
  const instructions = LOCALE_INSTRUCTIONS[locale as keyof typeof LOCALE_INSTRUCTIONS] || LOCALE_INSTRUCTIONS.en
  return instructions as BusinessLocaleInstructions
}

export function formatTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => variables[key] || match)
}

export function getSupportedLocales(): string[] {
  return Object.keys(LOCALE_INSTRUCTIONS)
}

export function isLocaleSupported(locale: string): boolean {
  return locale in LOCALE_INSTRUCTIONS
}

 