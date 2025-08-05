import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const supabase = getSupabaseServerClient()
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

    // Prepare FormData for OpenAI Whisper API
    const whisperFormData = new FormData()
    whisperFormData.append('file', audioFile)
    whisperFormData.append('model', 'whisper-1')
    // Note: language auto-detection is default, no need to specify
    whisperFormData.append('response_format', 'json')

    // Call OpenAI Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: whisperFormData,
    })

    if (!whisperResponse.ok) {
      const errorData = await whisperResponse.json().catch(() => ({ error: 'Unknown error' }))
      console.error('Whisper API error:', {
        status: whisperResponse.status,
        statusText: whisperResponse.statusText,
        error: errorData
      })
      
      if (whisperResponse.status === 429) {
        return NextResponse.json({ error: 'Too many requests. Please try again in a moment.' }, { status: 429 })
      } else if (whisperResponse.status === 401) {
        return NextResponse.json({ error: 'Authentication failed with OpenAI' }, { status: 500 })
      } else {
        return NextResponse.json({ 
          error: `Speech recognition failed: ${errorData.error?.message || errorData.error || 'Unknown error'}` 
        }, { status: 500 })
      }
    }

    const transcription = await whisperResponse.json()
    
    if (!transcription.text) {
      return NextResponse.json({ error: 'No speech detected in audio' }, { status: 400 })
    }

    return NextResponse.json({ 
      text: transcription.text.trim(),
      language: transcription.language || 'unknown'
    })

  } catch (error) {
    console.error('Whisper API error:', error)
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}