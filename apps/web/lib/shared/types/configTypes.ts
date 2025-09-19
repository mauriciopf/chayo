import { z } from 'zod';

// Tool types that can be enabled/disabled
export const AVAILABLE_TOOLS = [
  'appointments',
  'payments', 
  'documents',
  'faqs',
  'intake_forms',
  'products',
  'customer_support'
] as const;

export type ToolType = typeof AVAILABLE_TOOLS[number];

// App configuration (simplified - no theme customization)
export const AppConfigSchema = z.object({
  // Organization info
  organizationSlug: z.string(),
  organizationId: z.string(),
  businessName: z.string(),
  
  // App branding (static)
  appName: z.string().default('Chayo'),
  
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