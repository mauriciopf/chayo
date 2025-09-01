import { z } from 'zod';

// Tool types that can be enabled/disabled
export const AVAILABLE_TOOLS = [
  'appointments',
  'payments', 
  'documents',
  'faqs',
  'intake_forms',
  'mobile-branding'
] as const;

export type ToolType = typeof AVAILABLE_TOOLS[number];

// Theme configuration
export const ThemeConfigSchema = z.object({
  primaryColor: z.string().default('#007AFF'),
  secondaryColor: z.string().default('#5856D6'),
  backgroundColor: z.string().default('#FFFFFF'),
  textColor: z.string().default('#000000'),
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
}

// Navigation tab configuration
export interface TabConfig {
  name: string;
  label: string;
  icon: string;
  component: 'native-chat' | 'native' | 'webview';
  url?: string;
  enabled: boolean;
}