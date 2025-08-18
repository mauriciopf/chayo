import { TabConfig, ToolType, AppConfig } from './types';
import { ToolUrlGenerator } from './urls';

/**
 * Navigation configuration generator
 */
export class NavigationConfigGenerator {
  constructor(
    private config: AppConfig,
    private urlGenerator: ToolUrlGenerator
  ) {}

  /**
   * Generate tab configuration based on enabled tools
   */
  generateTabs(): TabConfig[] {
    const tabs: TabConfig[] = [
      // Home tab - always enabled (native chat)
      {
        name: 'Home',
        label: 'Chat',
        icon: 'message-circle',
        component: 'native-chat',
        enabled: true,
      },
    ];

    // Add tool-based tabs
    const toolConfigs: Record<ToolType, Omit<TabConfig, 'enabled' | 'url'>> = {
      appointments: {
        name: 'Appointments',
        label: 'Book',
        icon: 'calendar',
        component: 'webview',
      },
      payments: {
        name: 'Payments', 
        label: 'Pay',
        icon: 'credit-card',
        component: 'webview',
      },
      documents: {
        name: 'Documents',
        label: 'Forms',
        icon: 'file-text',
        component: 'webview',
      },
      faqs: {
        name: 'FAQs',
        label: 'Help',
        icon: 'help-circle',
        component: 'webview',
      },
      'mobile-branding': {
        name: 'Mobile Branding',
        label: 'Branding',
        icon: 'smartphone',
        component: 'webview',
      },
    };

    // Add enabled tool tabs
    this.config.enabledTools.forEach((tool) => {
      const toolConfig = toolConfigs[tool];
      if (toolConfig) {
        tabs.push({
          ...toolConfig,
          url: this.urlGenerator.getMobileOptimizedUrl(
            this.urlGenerator.getToolUrl(tool)
          ),
          enabled: true,
        });
      }
    });

    return tabs;
  }

  /**
   * Get enabled tabs only
   */
  getEnabledTabs(): TabConfig[] {
    return this.generateTabs().filter(tab => tab.enabled);
  }

  /**
   * Check if a specific tool is enabled
   */
  isToolEnabled(tool: ToolType): boolean {
    return this.config.enabledTools.includes(tool);
  }
}