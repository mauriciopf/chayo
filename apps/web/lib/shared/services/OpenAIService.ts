import OpenAI from 'openai'

/**
 * Centralized service for all OpenAI API calls
 * Provides consistent error handling and configuration across the application
 */
export class OpenAIService {
  private static instance: OpenAIService
  private client: OpenAI

  private constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API key not set')
    }
    
    this.client = new OpenAI({
      apiKey: apiKey
    })
  }

  /**
   * Get singleton instance of OpenAIService
   */
  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService()
    }
    return OpenAIService.instance
  }

  /**
   * Make a simple completion request for text responses (no structured output)
   * @param messages - Array of chat messages
   * @param options - Optional configuration for the request
   * @returns The AI response content
   */
  public async callCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: {
      model?: string
      temperature?: number
      maxTokens?: number
    } = {}
  ): Promise<string> {
    const {
      model = 'gpt-4o-mini',
      temperature = 0.9,
      maxTokens = 1000
    } = options

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false
      })

      // Type assertion to handle the union type properly
      const chatCompletion = response as OpenAI.Chat.ChatCompletion
      return chatCompletion.choices[0]?.message?.content || ''
    } catch (error: any) {
      // Handle specific OpenAI errors with user-friendly messages
      if (error?.status === 429) {
        console.error('OpenAI quota exceeded:', error)
        throw new Error("I apologize, but I'm currently experiencing high demand and cannot process your request right now. Please try again in a few minutes, or contact support if this issue persists.")
      } else if (error?.status === 401) {
        console.error('OpenAI API key invalid:', error)
        throw new Error("I apologize, but there's a configuration issue with my AI service. Please contact support for assistance.")
      } else if (error?.status === 400) {
        console.error('OpenAI bad request:', error)
        throw new Error("I apologize, but there was an issue with your request. Please try rephrasing your message.")
      } else {
        console.error('OpenAI API error:', error)
        throw new Error("I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment.")
      }
    }
  }

  /**
   * Make a structured chat completion request using OpenAI's Structured Outputs
   * @param messages - Array of chat messages
   * @param schema - JSON schema for structured output
   * @param options - Optional configuration for the request
   * @returns Parsed structured response
   */
  public async callStructuredCompletion<T>(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    schema: any,
    options: {
      model?: string
      temperature?: number
      maxTokens?: number
    } = {}
  ): Promise<T> {
    const {
      model = 'gpt-4o-mini',
      temperature = 0.7,
      maxTokens = 1000
    } = options

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
        response_format: schema
      })

      // Type assertion to handle the union type properly
      const chatCompletion = response as OpenAI.Chat.ChatCompletion
      const content = chatCompletion.choices[0]?.message?.content || '{}'
      
      // Parse and return the structured response
      return JSON.parse(content) as T
    } catch (error: any) {
      // Handle specific OpenAI errors with user-friendly messages
      if (error?.status === 429) {
        console.error('OpenAI quota exceeded:', error)
        throw new Error("I apologize, but I'm currently experiencing high demand and cannot process your request right now. Please try again in a few minutes, or contact support if this issue persists.")
      } else if (error?.status === 401) {
        console.error('OpenAI API key invalid:', error)
        throw new Error("I apologize, but there's a configuration issue with my AI service. Please contact support for assistance.")
      } else if (error?.status === 400) {
        console.error('OpenAI bad request:', error)
        throw new Error("I apologize, but there was an issue with your request. Please try rephrasing your message.")
      } else {
        console.error('OpenAI API error:', error)
        throw new Error("I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment.")
      }
    }
  }

  /**
   * Generate embeddings for text content
   * @param texts - Array of text strings to generate embeddings for
   * @param model - Embedding model to use
   * @returns Array of embedding vectors
   */
  public async generateEmbeddings(
    texts: string[],
    model: string = 'text-embedding-ada-002'
  ): Promise<number[][]> {
    try {
      const response = await this.client.embeddings.create({
        model,
        input: texts,
      })
      return response.data.map((item: any) => item.embedding)
    } catch (error: any) {
      console.error('OpenAI embeddings error:', error)
      throw new Error('Failed to generate embeddings')
    }
  }

  /**
   * Transcribe audio using Whisper API
   * @param audioFile - Audio file to transcribe
   * @param options - Optional configuration
   * @returns Transcription text
   */
  public async transcribeAudio(
    audioFile: File,
    options: {
      model?: string
      language?: string
      responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt'
    } = {}
  ): Promise<string> {
    const {
      model = 'whisper-1',
      responseFormat = 'json'
    } = options

    try {
      const response = await this.client.audio.transcriptions.create({
        file: audioFile,
        model,
        response_format: responseFormat,
        ...(options.language && { language: options.language })
      })
      
      // Return text based on response format
      return typeof response === 'string' ? response : (response as any).text || ''
    } catch (error: any) {
      // Handle specific OpenAI errors with user-friendly messages
      if (error?.status === 429) {
        console.error('OpenAI Whisper quota exceeded:', error)
        throw new Error("I apologize, but I'm currently experiencing high demand for audio transcription. Please try again in a few minutes.")
      } else if (error?.status === 401) {
        console.error('OpenAI API key invalid:', error)
        throw new Error("I apologize, but there's a configuration issue with the transcription service. Please contact support.")
      } else {
        console.error('OpenAI Whisper error:', error)
        throw new Error("I apologize, but I'm experiencing difficulties with audio transcription right now. Please try again in a moment.")
      }
    }
  }

  /**
   * Get the OpenAI client instance for direct use (when needed)
   * Use this sparingly - prefer the wrapper methods above
   */
  public getClient(): OpenAI {
    return this.client
  }
}

// Export lazy singleton getter for server-side only usage
export const openAIService = {
  getInstance: () => OpenAIService.getInstance(),
  callCompletion: (messages: any[], options?: any) => OpenAIService.getInstance().callCompletion(messages, options),
  callStructuredCompletion: <T>(messages: any[], schema: any, options?: any) => OpenAIService.getInstance().callStructuredCompletion<T>(messages, schema, options),
  generateEmbeddings: (texts: string[], options?: any) => OpenAIService.getInstance().generateEmbeddings(texts, options),
  transcribeAudio: (audioFile: any, options?: any) => OpenAIService.getInstance().transcribeAudio(audioFile, options),
  getClient: () => OpenAIService.getInstance().getClient()
}