import { AppConfig, AppConfigSchema, ToolType } from './types';
import { ToolUrlGenerator } from './urls';

export interface ConfigLoaderOptions {
  webBaseUrl: string;
  apiBaseUrl: string;
}

/**
 * Configuration loader for mobile app
 */
export class ConfigLoader {
  constructor(private options: ConfigLoaderOptions) {}

  /**
   * Load configuration for an organization by slug
   */
  async loadConfigBySlug(organizationSlug: string): Promise<AppConfig> {
    try {
      // Fetch organization config from API
      const response = await fetch(
        `${this.options.apiBaseUrl}/api/app-config/${organizationSlug}`
      );

      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate and parse config
      const config = AppConfigSchema.parse({
        ...data,
        webBaseUrl: this.options.webBaseUrl,
        apiBaseUrl: this.options.apiBaseUrl,
      });

      return config;
    } catch (error) {
      console.error('Error loading config:', error);
      throw error;
    }
  }

  /**
   * Load configuration for an organization by email
   */
  async loadConfigByEmail(email: string): Promise<AppConfig> {
    try {
      // First, get organization slug from email
      const response = await fetch(
        `${this.options.apiBaseUrl}/api/organizations/lookup-by-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to lookup organization: ${response.statusText}`);
      }

      const { organizationSlug } = await response.json();
      
      // Then load config by slug
      return this.loadConfigBySlug(organizationSlug);
    } catch (error) {
      console.error('Error loading config by email:', error);
      throw error;
    }
  }

  /**
   * Load configuration for an organization by ID
   */
  async loadConfigById(organizationId: string): Promise<AppConfig> {
    try {
      // First, get organization slug from ID
      const response = await fetch(
        `${this.options.apiBaseUrl}/api/organizations/lookup-by-id`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizationId }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to lookup organization: ${response.statusText}`);
      }

      const { organizationSlug } = await response.json();
      
      // Then load config by slug
      return this.loadConfigBySlug(organizationSlug);
    } catch (error) {
      console.error('Error loading config by ID:', error);
      throw error;
    }
  }

  /**
   * Get enabled tools from API
   */
  async getEnabledTools(organizationId: string): Promise<ToolType[]> {
    try {
      const response = await fetch(
        `${this.options.apiBaseUrl}/api/organizations/${organizationId}/active-agent-tools`
      );

      if (!response.ok) {
        throw new Error(`Failed to load tools: ${response.statusText}`);
      }

      const toolsData = await response.json();
      // Convert the object of enabled tools to an array
      return Object.keys(toolsData).filter(key => toolsData[key] === true) as ToolType[];
    } catch (error) {
      console.error('Error loading enabled tools:', error);
      return [];
    }
  }

  /**
   * Create tool URL generator for an organization
   */
  createUrlGenerator(organizationSlug: string): ToolUrlGenerator {
    return new ToolUrlGenerator(this.options.webBaseUrl, organizationSlug);
  }
}