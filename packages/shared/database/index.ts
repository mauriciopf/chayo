// Database configuration and types
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Database table names
export const TABLES = {
  USERS: 'users',
  ORGANIZATIONS: 'organizations',
  AGENTS: 'agents',
  TEAM_MEMBERS: 'team_members',
  CONVERSATIONS: 'conversations',
  CONVERSATION_EMBEDDINGS: 'conversation_embeddings',
} as const