// Configuration types and utilities for mobile app
// Inlined from @chayo/config package

export interface AppConfig {
  organizationId: string;
  name: string;
  slug: string;
  theme: ThemeConfig;
  tools: ToolConfig[];
  branding: BrandingConfig;
}

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ToolConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: Record<string, any>;
  order: number;
}

export interface BrandingConfig {
  logo?: string;
  favicon?: string;
  colors: ThemeConfig;
}

// Default theme constants
export const DEFAULT_THEME: ThemeConfig = {
  primary: '#007AFF',
  secondary: '#5856D6',
  accent: '#FF9500',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
};

// Configuration loader class
export class ConfigLoader {
  static async loadConfig(organizationId: string): Promise<AppConfig | null> {
    try {
      const response = await fetch(`https://chayo.vercel.app/api/organizations/${organizationId}/mobile-config`);
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to load app config:', error);
      return null;
    }
  }

  static async loadConfigByCode(code: string): Promise<AppConfig | null> {
    try {
      const response = await fetch(`https://chayo.vercel.app/api/app-config/mobile-code/${code}`);
      if (!response.ok) {
        throw new Error(`Failed to load config by code: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to load app config by code:', error);
      return null;
    }
  }
}

// Tool URL generator class
export class ToolUrlGenerator {
  private baseUrl: string;
  private organizationId: string;

  constructor(baseUrl: string, organizationId: string) {
    this.baseUrl = baseUrl;
    this.organizationId = organizationId;
  }

  generateToolUrl(toolType: string, toolId?: string): string {
    const base = `${this.baseUrl}/${this.organizationId}`;
    
    switch (toolType) {
      case 'appointments':
        return `${base}/appointments${toolId ? `/${toolId}` : ''}`;
      case 'forms':
        return `${base}/forms${toolId ? `/${toolId}` : ''}`;
      case 'documents':
        return `${base}/documents${toolId ? `/${toolId}` : ''}`;
      case 'products':
        return `${base}/products${toolId ? `/${toolId}` : ''}`;
      default:
        return `${base}/${toolType}${toolId ? `/${toolId}` : ''}`;
    }
  }
}
