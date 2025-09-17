import { z } from 'zod';

// Default theme constants (inlined for Vercel compatibility)
const DEFAULT_THEME = {
  primaryColor: '#0A84FF',
  secondaryColor: '#2C2C2E',
  backgroundColor: '#1C1C1E',
  textColor: '#FFFFFF',
};

// Tool types that can be enabled/disabled
export const AVAILABLE_TOOLS = [
  'appointments',
  'payments', 
  'documents',
  'faqs',
  'intake_forms',
  'mobile-branding',
  'products',
  'customer_support'
] as const;

export type ToolType = typeof AVAILABLE_TOOLS[number];

// Theme configuration - using inlined defaults
export const ThemeConfigSchema = z.object({
  primaryColor: z.string().default(DEFAULT_THEME.primaryColor),
  secondaryColor: z.string().default(DEFAULT_THEME.secondaryColor),
  backgroundColor: z.string().default(DEFAULT_THEME.backgroundColor),
  textColor: z.string().default(DEFAULT_THEME.textColor),
  logoUrl: z.string().optional(),
});

export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;

// App configuration
export const AppConfigSchema = z.object({
  // Organization info
  organizationSlug: z.string(),
  organizationId: z.string(),
  businessName: z.string(),
  
  // App branding (for free tier, defaults to Chayo)
  appName: z.string().default('Chayo'),
  theme: ThemeConfigSchema.default({}),
  
  // Dynamic features
  enabledTools: z.array(z.enum(AVAILABLE_TOOLS)).default([]),
  
  // API configuration
  webBaseUrl: z.string(),
  apiBaseUrl: z.string(),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

// Tool URL mapping
export interface ToolUrlConfig {
  appointments: string;
  payments: string;
  documents: string;
  faqs: string;
  intake_forms: string;
  'mobile-branding': string;
  products: string;
}

// Navigation tab configuration
export interface TabConfig {
  name: string;
  label: string;
  icon: string;
  component: 'native-chat' | 'webview';
  url?: string;
  enabled: boolean;
}