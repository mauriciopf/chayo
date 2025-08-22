/**
 * Utility functions for generating and validating 6-digit mobile app codes
 */

/**
 * Generate a random 6-digit code
 */
export function generateMobileAppCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate if a string is a valid 6-digit mobile app code
 */
export function isValidMobileAppCode(code: string): boolean {
  // Must be exactly 6 digits
  return /^\d{6}$/.test(code);
}

/**
 * Format a mobile app code for display (e.g., "123456" -> "123 456")
 */
export function formatMobileAppCode(code: string): string {
  if (!isValidMobileAppCode(code)) {
    return code;
  }
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

/**
 * Remove formatting from a mobile app code (e.g., "123 456" -> "123456")
 */
export function cleanMobileAppCode(code: string): string {
  return code.replace(/\D/g, '');
}

/**
 * Generate a unique mobile app code using Supabase
 * This is the web version - for server-side use
 */
export async function generateUniqueMobileAppCode(supabase: any): Promise<string> {
  let attempts = 0;
  const maxAttempts = 50;
  
  while (attempts < maxAttempts) {
    const code = generateMobileAppCode();
    
    // Check if code already exists
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('mobile_app_code', code)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // No rows returned, code is unique
      return code;
    }
    
    if (error) {
      throw new Error(`Database error while checking code uniqueness: ${error.message}`);
    }
    
    attempts++;
  }
  
  throw new Error(`Could not generate unique mobile app code after ${maxAttempts} attempts`);
}
