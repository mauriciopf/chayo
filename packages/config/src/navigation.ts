import { TabConfig, ToolType, AppConfig, AVAILABLE_TOOLS } from './types';
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
    const toolConfigs: Partial<Record<ToolType, Omit<TabConfig, 'enabled' | 'url'>>> = {
      appointments: {
        name: 'Appointments',
        label: 'Book',
        icon: 'calendar',
        component: 'native',
      },
      payments: {
        name: 'Payments', 
        label: 'Pay',
        icon: 'credit-card',
        component: 'webview',
      },
      documents: {
        name: 'Documents',
        label: 'Documents',
        icon: 'file-text',
        component: 'native',
      },
      faqs: {
        name: 'FAQs',
        label: 'Help',
        icon: 'help-circle',
        component: 'native',
      },
      intake_forms: {
        name: 'Intake Forms',
        label: 'Forms',
        icon: 'clipboard',
        component: 'native',
      },
      products: {
        name: 'Products & Services',
        label: 'Products',
        icon: 'package',
        component: 'native',
      },
      // Note: mobile-branding is excluded as it's a backend configuration tool, not a user-facing tab
    };

    // Add enabled tool tabs - filter out unknown tools gracefully
    this.config.enabledTools.forEach((tool) => {
      // Only process tools that are known to this version of the app
      if (AVAILABLE_TOOLS.includes(tool as ToolType)) {
        const toolConfig = toolConfigs[tool as ToolType];
        if (toolConfig) {
          tabs.push({
            ...toolConfig,
            url: this.urlGenerator.getMobileOptimizedUrl(
              this.urlGenerator.getToolUrl(tool as ToolType)
            ),
            enabled: true,
          });
        }
      } else {
        // Log unknown tools for debugging but don't crash
        console.log(`🔧 Unknown tool "${tool}" ignored - not supported in this app version`);
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

  /**
   * Get only the tools that are known to this app version
   */
  getKnownEnabledTools(): ToolType[] {
    return this.config.enabledTools.filter(tool => 
      AVAILABLE_TOOLS.includes(tool as ToolType)
    ) as ToolType[];
  }
}