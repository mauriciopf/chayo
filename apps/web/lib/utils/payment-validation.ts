/**
 * Payment validation utilities
 */

/**
 * Validates email format
 * @param email - Email address to validate
 * @returns True if email is valid
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates description length
 * @param description - Description text
 * @param maxLength - Maximum allowed length (default: 500)
 * @returns True if description is valid
 */
export function isValidDescription(description: string, maxLength: number = 500): boolean {
  if (!description) return true // Optional field
  return description.length <= maxLength
}

/**
 * Validates amount is positive and not zero
 * @param amount - Amount in cents
 * @returns True if amount is valid
 */
export function isValidAmount(amount: number): boolean {
  return amount > 0 && Number.isFinite(amount)
}

/**
 * Validates currency code (ISO 4217)
 * @param currency - 3-letter currency code
 * @returns True if currency code is valid
 */
export function isValidCurrency(currency: string): boolean {
  if (!currency) return false
  
  const validCurrencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY',
    'MXN', 'BRL', 'ARS', 'CLP', 'COP', 'PEN', // Latin America
  ]
  
  return validCurrencies.includes(currency.toUpperCase())
}

/**
 * Sanitizes user input to prevent XSS
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return ''
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, 1000) // Limit length
}

