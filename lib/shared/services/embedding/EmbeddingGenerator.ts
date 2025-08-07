import type { ConversationSegment } from './types'

export async function generateEmbeddings(segments: ConversationSegment[]): Promise<number[][]> {
  const texts = segments.map(segment => segment.text)
  const { openAIService } = await import('../OpenAIService')
  return await openAIService.generateEmbeddings(texts)
} 