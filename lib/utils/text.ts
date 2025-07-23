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