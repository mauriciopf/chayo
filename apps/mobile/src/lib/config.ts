// Configuration types and utilities for mobile app
// Inlined from @chayo/config package

export interface AppConfig {
  organizationId: string;
  organizationSlug: string;
  businessName: string;
  appName: string;
  theme: ThemeConfig;
  enabledTools: string[];
  webBaseUrl: string;
  apiBaseUrl: string;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  logoUrl?: string;
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

// Default theme constants (matching API defaults for consistency)
export const DEFAULT_THEME: ThemeConfig = {
  primary: '#0A84FF',
  secondary: '#2C2C2E',
  accent: '#FF9500',
  background: '#1C1C1E',
  surface: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#3A3A3C',
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

  static async loadConfigBySlug(organizationSlug: string): Promise<AppConfig | null> {
    try {
      const response = await fetch(`https://chayo.vercel.app/api/app-config/${organizationSlug}`);
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to load app config by slug:', error);
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
