/**
 * Gets the correct site URL based on environment
 * Uses localhost:3000 in development, production URL otherwise
 */
export function getSiteUrl(): string {
  // Check if we're in development
  const isDev = process.env.NODE_ENV === 'development'
  
  if (isDev) {
    return 'http://localhost:3000'
  }
  
  // In production, use the configured site URL or fallback to window.location.origin
  return process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
}

/**
 * Gets the auth callback URL for the current environment
 */
export function getAuthCallbackUrl(): string {
  return `${getSiteUrl()}/auth/callback`
}
