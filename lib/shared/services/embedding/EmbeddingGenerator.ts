import { OpenAI } from 'openai'
import type { ConversationSegment } from './types'

export async function generateEmbeddings(segments: ConversationSegment[]): Promise<number[][]> {
  const texts = segments.map(segment => segment.text)
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: texts,
  })
  return response.data.map((item: any) => item.embedding)
} 