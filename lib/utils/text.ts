// Text utility functions

export function chunkText(text: string, chunkSize = 1000): string[] {
  const chunks = []
  let i = 0
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize))
    i += chunkSize
  }
  return chunks
}

// Helper function to generate a slug from a name
export function generateSlugFromName(name: string): string {
  // Convert to lowercase and replace spaces/special chars with hyphens
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  
  // Add a random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `${baseSlug}-${randomSuffix}`
} 