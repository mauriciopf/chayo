import type { ConversationSegment } from './types'
import { openAIService } from '@/lib/shared/services/OpenAIService'

export async function generateEmbeddings(segments: ConversationSegment[]): Promise<number[][]> {
  const texts = segments.map(segment => segment.text)
  return await openAIService.generateEmbeddings(texts)
} 