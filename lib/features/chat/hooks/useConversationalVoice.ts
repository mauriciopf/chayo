import { useState, useRef, useCallback, useEffect } from 'react'

interface UseConversationalVoiceProps {
  onTranscription: (text: string) => void
  onError: (error: string) => void
  onSendMessage: (message: string) => void
  pauseThreshold?: number // milliseconds of silence before auto-send (default: 2000ms)
  volumeThreshold?: number // minimum volume to consider as speech (default: 0.01)
}

export function useConversationalVoice({ 
  onTranscription, 
  onError, 
  onSendMessage,
  pauseThreshold = 2000, // 2 seconds of silence to allow substantial audio capture
  volumeThreshold = 0.01 
}: UseConversationalVoiceProps) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Voice Activity Detection using Web Audio API
  const detectVoiceActivity = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return

    analyserRef.current.getByteFrequencyData(dataArrayRef.current)
    
    // Calculate average volume
    const average = dataArrayRef.current.reduce((sum, value) => sum + value, 0) / dataArrayRef.current.length
    const normalizedVolume = average / 255

    const wasSpeaking = isSpeaking
    const isSpeakingNow = normalizedVolume > volumeThreshold

    if (isSpeakingNow !== wasSpeaking) {
      setIsSpeaking(isSpeakingNow)
      
      if (isSpeakingNow) {
        // User started speaking - clear any existing silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = null
        }
      } else if (wasSpeaking && !isSpeakingNow) {
        // User stopped speaking - start silence timer
        silenceTimerRef.current = setTimeout(() => {
          handleSilenceDetected()
        }, pauseThreshold)
      }
    }

    // Continue monitoring if listening
    if (isListening) {
      animationFrameRef.current = requestAnimationFrame(detectVoiceActivity)
    }
  }, [isSpeaking, isListening, pauseThreshold, volumeThreshold])

  const handleSilenceDetected = useCallback(async () => {
    console.log('🔇 Silence detected - processing speech...')
    
    if (mediaRecorderRef.current && isListening) {
      // Stop current recording to process it
      mediaRecorderRef.current.stop()
      setIsProcessing(true)
      
      // Restart recording after processing completes
      setTimeout(() => {
        if (isListening && !isProcessing) {
          console.log('🔄 Restarting recording session...')
          startNewRecordingSession()
        }
      }, 500) // Give more time for processing
    }
  }, [isListening, isProcessing])

  const startNewRecordingSession = useCallback(() => {
    if (!streamRef.current) return

    try {
      // Use exact same MIME type logic as working voice input
      let mimeType = 'audio/webm'
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm'
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus'
      }
      
      console.log('📽️ Conversational voice using MIME type:', mimeType)

      // Create new MediaRecorder instance
      const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Create audio blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        })

        // Only transcribe if there's substantial audio data (more lenient for conversational)
        if (audioBlob.size > 8000) { // Require at least 8KB for meaningful audio
          console.log('🎤 Processing substantial audio chunk:', { size: audioBlob.size, type: audioBlob.type })
          await transcribeAudio(audioBlob)
        } else {
          console.log('🔇 Skipping small audio chunk:', { size: audioBlob.size, required: 8000 })
          setIsProcessing(false)
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        onError('Recording failed. Please try again.')
      }

      // Start recording with same timing as working voice input
      mediaRecorder.start(1000) // Collect data every second (same as working voice input)

    } catch (error) {
      console.error('Failed to start new recording session:', error)
      onError('Failed to continue recording. Please try again.')
    }
  }, [onError])

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      // Determine file extension based on MIME type
      let extension = 'webm'
      if (audioBlob.type.includes('mp4')) {
        extension = 'mp4'
      } else if (audioBlob.type.includes('ogg')) {
        extension = 'ogg'
      } else if (audioBlob.type.includes('wav')) {
        extension = 'wav'
      }

      console.log('🎤 Conversational transcribing audio:', { 
        type: audioBlob.type, 
        size: audioBlob.size, 
        extension,
        chunks: audioChunksRef.current.length 
      })

      // Create FormData for upload with correct MIME type
      const formData = new FormData()
      formData.append('audio', audioBlob, `recording.${extension}`)

      // Send to our Whisper API endpoint
      const response = await fetch('/api/whisper', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('🚨 Conversational Voice - Whisper API Error:', { 
          status: response.status, 
          statusText: response.statusText,
          response: errorText 
        })
        
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.error?.message || `Transcription failed (${response.status})`)
        } catch {
          throw new Error(`Speech recognition failed (${response.status}): ${response.statusText}`)
        }
      }

      const data = await response.json()
      const transcribedText = data.text?.trim()

      if (transcribedText) {
        console.log('✅ Conversational transcribed:', transcribedText)
        
        // For conversational mode, each speech segment is a separate message
        // Don't accumulate - send each transcription as individual message
        onTranscription(transcribedText)
        onSendMessage(transcribedText)
      } else {
        console.log('🔇 No speech detected in audio chunk')
      }

    } catch (error) {
      console.error('Transcription error:', error)
      if (error instanceof Error) {
        onError(error.message)
      } else {
        onError('Speech recognition failed. Please try again.')
      }
    } finally {
      setIsProcessing(false)
      
      // Restart recording if still listening and not already recording
      if (isListening && (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive')) {
        setTimeout(() => {
          if (isListening) {
            console.log('🔄 Auto-restarting recording after transcription...')
            startNewRecordingSession()
          }
        }, 200)
      }
    }
  }

  const startListening = useCallback(async () => {
    try {
      console.log('🎤 Starting conversational listening...')
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimize for speech
        } 
      })

      streamRef.current = stream

      // Set up Web Audio API for voice activity detection
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)

      setIsListening(true)
      
      // Start first recording session
      startNewRecordingSession()
      
      // Start voice activity detection
      detectVoiceActivity()

    } catch (error) {
      console.error('Failed to start listening:', error)
      if (error instanceof Error && error.name === 'NotAllowedError') {
        onError('Microphone permission denied. Please allow microphone access and try again.')
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        onError('No microphone found. Please check your device settings.')
      } else {
        onError('Failed to access microphone. Please try again.')
      }
    }
  }, [detectVoiceActivity, startNewRecordingSession, onError, onTranscription, onSendMessage])

  const stopListening = useCallback(() => {
    console.log('🛑 Stopping conversational listening...')
    
    setIsListening(false)
    setIsSpeaking(false)
    setIsProcessing(false)
    
    // Clear timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Stop media recorder
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }

    // Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    analyserRef.current = null
    dataArrayRef.current = null
    audioChunksRef.current = []
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [stopListening])

  return {
    isListening,
    isProcessing,
    isSpeaking,
    startListening,
    stopListening,
  }
}