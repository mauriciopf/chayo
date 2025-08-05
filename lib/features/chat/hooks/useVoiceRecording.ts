import { useState, useRef, useCallback } from 'react'

interface UseVoiceRecordingProps {
  onTranscription: (text: string) => void
  onError: (error: string) => void
  onSendMessage: (message: string) => void // Auto-send functionality (always enabled)
}

export function useVoiceRecording({ 
  onTranscription, 
  onError, 
  onSendMessage
}: UseVoiceRecordingProps) {
  // Hard-coded values for simplicity - always auto-send and auto-stop on silence
  const silenceThreshold = 1500 // 1.5 seconds
  const volumeThreshold = 0.01  // Speech detection sensitivity
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  
  // Use refs for current values to avoid dependency issues in monitoring loop
  const isRecordingRef = useRef(isRecording)
  const isSpeakingRef = useRef(isSpeaking)
  
  // Update refs when state changes
  isRecordingRef.current = isRecording
  isSpeakingRef.current = isSpeaking

  // Voice Activity Detection - continuously monitor voice activity using refs for stability
  const detectVoiceActivity = useCallback(() => {
    console.log('🔍 Detecting voice activity...')
    
    // Continue monitoring if recording
    if (!isRecordingRef.current) {
      console.log('🔍 Stopping voice detection - not recording')
      return
    }

    if (!analyserRef.current || !dataArrayRef.current) {
      console.log('🔍 Audio context not ready, continuing...')
      animationFrameRef.current = requestAnimationFrame(detectVoiceActivity)
      return
    }

    analyserRef.current.getByteFrequencyData(dataArrayRef.current)
    
    // Calculate average volume
    const average = dataArrayRef.current.reduce((sum, value) => sum + value, 0) / dataArrayRef.current.length
    const normalizedVolume = average / 255

    const wasSpeaking = isSpeakingRef.current
    const isSpeakingNow = normalizedVolume > volumeThreshold

    console.log('🔍 isSpeakingNow:', isSpeakingNow, 'volume:', normalizedVolume.toFixed(3))
    console.log('🔍 wasSpeaking:', wasSpeaking)

    if (isSpeakingNow !== wasSpeaking) {
      setIsSpeaking(isSpeakingNow)
      
      if (isSpeakingNow) {
        // User started speaking - clear any existing silence timer
        console.log('🗣️ Speech detected - volume:', normalizedVolume.toFixed(3))
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = null
        }
      } else if (wasSpeaking && !isSpeakingNow) {
        // User stopped speaking - start silence timer
        console.log('🤫 Speech ended - starting silence timer for', silenceThreshold, 'ms')
        silenceTimerRef.current = setTimeout(() => {
          console.log('🔇 Silence detected - auto-stopping recording...')
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            // Update refs immediately to stop voice detection loop
            isRecordingRef.current = false
            isSpeakingRef.current = false
            
            // Clean up voice activity detection
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current)
              silenceTimerRef.current = null
            }
            
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current)
              animationFrameRef.current = null
            }

            mediaRecorderRef.current.stop()
            setIsRecording(false)
            setIsSpeaking(false)
            setIsProcessing(true)
          }
        }, silenceThreshold)
      }
    }

    // ALWAYS continue monitoring while recording and auto-stop is enabled
    animationFrameRef.current = requestAnimationFrame(detectVoiceActivity)
  }, []) // No dependencies to keep function stable

  const startRecording = useCallback(async () => {
    try {
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

      // Set up Web Audio API for voice activity detection (always enabled)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)

      // Determine the best MIME type for the browser
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

      console.log('Using MIME type:', mimeType)

      // Create MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream, { mimeType })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release microphone
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
        
        // Clean up audio context
        if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
        }
        
        // Create audio blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        })

        // Send to Whisper API for transcription
        await transcribeAudio(audioBlob)
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        onError('Recording failed. Please try again.')
        setIsRecording(false)
      }

      // Start recording
      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      
      // Update refs immediately for voice detection
      isRecordingRef.current = true

      // Start voice activity detection (always enabled)
      console.log('🎤 Starting voice activity detection...', {
        isRecording: true,
        isRecordingRef: isRecordingRef.current
      })
      detectVoiceActivity()

    } catch (error) {
      console.error('Failed to start recording:', error)
      if (error instanceof Error && error.name === 'NotAllowedError') {
        onError('Microphone permission denied. Please allow microphone access and try again.')
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        onError('No microphone found. Please check your device settings.')
      } else {
        onError('Failed to access microphone. Please try again.')
      }
    }
  }, [onError, detectVoiceActivity])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('🛑 Stopping recording and voice detection...')
      
      // Update refs immediately to stop voice detection
      isRecordingRef.current = false
      isSpeakingRef.current = false
      
      // Clean up voice activity detection
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsSpeaking(false)
      setIsProcessing(true)
    }
  }, [isRecording])

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true)

      // Determine file extension based on MIME type
      let extension = 'webm'
      if (audioBlob.type.includes('mp4')) {
        extension = 'mp4'
      } else if (audioBlob.type.includes('ogg')) {
        extension = 'ogg'
      } else if (audioBlob.type.includes('wav')) {
        extension = 'wav'
      }

      console.log('Uploading audio:', { type: audioBlob.type, size: audioBlob.size, extension })

      // Create FormData for upload
      const formData = new FormData()
      formData.append('audio', audioBlob, `recording.${extension}`)

      // Send to our Whisper API endpoint
      const response = await fetch('/api/whisper', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', { status: response.status, error: errorData })
        throw new Error(errorData.error || `Transcription failed (${response.status})`)
      }

      const data = await response.json()
      
      if (data.text && data.text.trim()) {
        const transcribedText = data.text.trim()
        onTranscription(transcribedText)
        
        // Always auto-send
        console.log('🎯 Auto-sending transcribed message:', transcribedText)
        onSendMessage(transcribedText)
      } else {
        onError('No speech detected. Please try speaking more clearly.')
      }

    } catch (error) {
      console.error('Transcription error:', error)
      if (error instanceof Error) {
        console.error('Transcription error details:', error)
        onError(error.message)
      } else {
        console.error('Unknown transcription error:', error)
        onError('Speech recognition failed. Please try again.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('❌ Cancelling recording and voice detection...')
      
      // Update refs immediately to stop voice detection
      isRecordingRef.current = false
      isSpeakingRef.current = false
      
      // Clean up voice activity detection
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      // Stop the recorder without processing
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      
      setIsRecording(false)
      setIsSpeaking(false)
      setIsProcessing(false)
      audioChunksRef.current = []
    }
  }, [isRecording])

  return {
    isRecording,
    isProcessing,
    isSpeaking,
    startRecording,
    stopRecording,
    cancelRecording,
    isSupported: typeof navigator !== 'undefined' && 
                !!navigator.mediaDevices && 
                !!navigator.mediaDevices.getUserMedia &&
                typeof MediaRecorder !== 'undefined'
  }
}