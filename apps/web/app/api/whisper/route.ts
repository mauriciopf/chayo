import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Get the audio file from the request
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Validate file type and size
    const validTypes = [
      'audio/wav', 
      'audio/mpeg', 
      'audio/mp3', 
      'audio/mp4', 
      'audio/webm', 
      'audio/ogg',
      'audio/webm;codecs=opus',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/ogg;codecs=opus'
    ]
    
    // More lenient validation - accept any audio MIME type
    const isAudioFile = audioFile.type.startsWith('audio/') && audioFile.type.length > 6
    
    if (!isAudioFile) {
      console.error('Invalid audio file type:', audioFile.type)
      return NextResponse.json({ error: `Invalid audio file type: ${audioFile.type}. Expected audio/* format.` }, { status: 400 })
    }

    console.log('Accepted audio file:', { type: audioFile.type, size: audioFile.size, name: audioFile.name })

    // Max file size: 25MB (Whisper limit)
    const maxSize = 25 * 1024 * 1024
    if (audioFile.size > maxSize) {
      return NextResponse.json({ error: 'Audio file too large (max 25MB)' }, { status: 400 })
    }

    // Call OpenAI Whisper API using centralized service
    try {
      const { openAIService } = await import('@/lib/shared/services/OpenAIService')
      const transcriptionText = await openAIService.transcribeAudio(audioFile, {
        model: 'whisper-1',
        responseFormat: 'json'
      })
      
      if (!transcriptionText) {
        return NextResponse.json({ error: 'No speech detected in audio' }, { status: 400 })
      }

      return NextResponse.json({ 
        text: transcriptionText.trim(),
        language: 'unknown' // The centralized service returns just text, not the full response
      })

    } catch (error) {
      console.error('Whisper API error:', error)
      return NextResponse.json({ 
        error: `Speech recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Whisper route error:', error)
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}