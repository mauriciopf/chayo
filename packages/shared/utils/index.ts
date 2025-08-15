// Shared utility functions
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString()
}

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}