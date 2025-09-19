// Configuration types and utilities for mobile app
// Inlined from @chayo/config package

export interface AppConfig {
  organizationId: string;
  organizationSlug: string;
  businessName: string;
  appName: string;
  enabledTools: string[];
  webBaseUrl: string;
  apiBaseUrl: string;
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
}

// Configuration loader class
export class ConfigLoader {
  static async loadConfig(organizationId: string): Promise<AppConfig | null> {
    try {
      // Simplified config - no theme customization, static app design
      return {
        organizationId,
        organizationSlug: 'unknown', // Will be set by app-config endpoint
        businessName: 'Business', // Will be set by app-config endpoint
        appName: 'Chayo',
        enabledTools: [], // Will be populated by app-config endpoint
        webBaseUrl: 'https://chayo.vercel.app',
        apiBaseUrl: 'https://chayo.vercel.app'
      };
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
