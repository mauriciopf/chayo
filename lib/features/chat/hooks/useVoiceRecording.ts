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
  // Improved voice detection settings for better precision
  const silenceThreshold = 1000 // 1 second - natural conversation flow
  const volumeThreshold = 0.03  // Higher threshold - less sensitive to background noise  
  const minAudioSize = 15000    // Minimum 15KB audio size to avoid processing tiny sounds
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
  const pauseRecordingRef = useRef<(() => void) | null>(null)
  const resumeRecordingRef = useRef<(() => void) | null>(null)
  
  // Update refs when state changes
  isRecordingRef.current = isRecording
  isSpeakingRef.current = isSpeaking

  // Audio transcription function
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
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
        
        // Always auto-send (no manual stop button needed)
        console.log('🎯 Auto-sending transcribed speech segment:', transcribedText)
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
  }, [onTranscription, onSendMessage, onError])

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
    
    // Improved speech detection: focus on human speech frequency range (300Hz - 3400Hz)
    const speechRange = dataArrayRef.current.slice(8, 85) // Approximate range for human speech
    const speechAverage = speechRange.reduce((sum, value) => sum + value, 0) / speechRange.length
    const normalizedSpeechVolume = speechAverage / 255
    
    // Also check overall volume to avoid false positives from high-frequency noise
    const overallAverage = dataArrayRef.current.reduce((sum, value) => sum + value, 0) / dataArrayRef.current.length
    const normalizedOverallVolume = overallAverage / 255

    const wasSpeaking = isSpeakingRef.current
    // Speech detected if both speech frequencies AND overall volume are above threshold
    const isSpeakingNow = normalizedSpeechVolume > volumeThreshold && normalizedOverallVolume > (volumeThreshold * 0.5)

    console.log('🔍 isSpeakingNow:', isSpeakingNow, 'speech:', normalizedSpeechVolume.toFixed(3), 'overall:', normalizedOverallVolume.toFixed(3))
    console.log('🔍 wasSpeaking:', wasSpeaking)

    if (isSpeakingNow !== wasSpeaking) {
      setIsSpeaking(isSpeakingNow)
      
      if (isSpeakingNow) {
        // User started speaking - clear silence timer and resume if needed
        console.log('🗣️ Speech detected - speech:', normalizedSpeechVolume.toFixed(3), 'overall:', normalizedOverallVolume.toFixed(3))
        
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = null
        }
        
        // If processing (paused), resume recording
        if (isProcessing && isRecordingRef.current && resumeRecordingRef.current) {
          console.log('🔄 Resuming recording after speech detection...')
          resumeRecordingRef.current()
        }
      } else if (wasSpeaking && !isSpeakingNow) {
        // User stopped speaking - start auto-transcription timer
        console.log('🤫 Speech ended - starting auto-transcription timer for', silenceThreshold, 'ms')
        silenceTimerRef.current = setTimeout(() => {
          console.log('🔇 Silence detected - auto-transcribing speech segment...')
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording' && pauseRecordingRef.current) {
            pauseRecordingRef.current()
          }
        }, silenceThreshold)
      }
    }

    // ALWAYS continue monitoring while recording and auto-stop is enabled
    animationFrameRef.current = requestAnimationFrame(detectVoiceActivity)
  }, [isProcessing]) // Simplified dependencies to avoid circular refs

  // Process current speech segment - transcribe and auto-send without manual stop
  const pauseRecording = useCallback(() => {
    console.log('🎙️ Processing speech segment (auto-transcribe on silence)...')
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      // Request any pending data to be emitted immediately for complete audio capture
      try {
        mediaRecorderRef.current.requestData()
      } catch (error) {
        console.log('requestData not supported, proceeding with stop')
      }
      
      // Stop recording to get complete audio blob - this triggers onstop with all data
      mediaRecorderRef.current.stop()
      setIsProcessing(true)
      setIsSpeaking(false)
      
      // Clear silence timer since we're processing
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
    }
  }, [])

  // Set ref for use in detectVoiceActivity
  pauseRecordingRef.current = pauseRecording

  // Resume recording - start new recording session for continued conversation
  const resumeRecording = useCallback(() => {
    console.log('▶️ Resuming recording for continued conversation...')
    
    if (!streamRef.current || !isRecordingRef.current) {
      console.log('❌ Cannot resume - no stream or recording session ended')
      return
    }

    try {
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
        // Create audio blob from chunks - this is the most reliable way to get complete audio  
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        })

        // Only transcribe if we have meaningful audio data (avoid hallucinated transcriptions)
        if (audioBlob.size >= minAudioSize) {
          console.log('🎙️ Auto-transcribing resumed speech segment:', { 
            size: audioBlob.size, 
            type: audioBlob.type,
            threshold: minAudioSize 
          })
          
          // Send to Whisper API for transcription and auto-send
          await transcribeAudio(audioBlob)
        } else {
          console.log('🔇 Skipping tiny resumed audio segment:', { 
            size: audioBlob.size, 
            required: minAudioSize,
            reason: 'Too small - likely background noise'
          })
          setIsProcessing(false)
        }
        
        // After processing, resume recording if still in session (conversational mode)
        if (isRecordingRef.current && !isProcessing) {
          setTimeout(() => {
            if (isRecordingRef.current && resumeRecordingRef.current) {
              console.log('🔄 Auto-resuming recording for continued conversation...')
              resumeRecordingRef.current()
            }
          }, 200)
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        onError('Recording failed. Please try again.')
      }

      // Start recording with data collection every second
      mediaRecorder.start(1000)
      setIsProcessing(false)
      
      console.log('🎤 Resumed recording - ready for next speech segment')
    } catch (error) {
      console.error('Failed to resume recording:', error)
      onError('Failed to resume recording. Please try again.')
    }
  }, [onError, transcribeAudio, isProcessing])

  // Set ref for use in detectVoiceActivity
  resumeRecordingRef.current = resumeRecording

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
        // Create audio blob from chunks - this is the most reliable way to get complete audio
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        })

        // Only transcribe if we have meaningful audio data (avoid hallucinated transcriptions)
        if (audioBlob.size >= minAudioSize) {
          console.log('🎙️ Auto-transcribing speech segment:', { 
            size: audioBlob.size, 
            type: audioBlob.type,
            threshold: minAudioSize 
          })
          
          // Send to Whisper API for transcription and auto-send
          await transcribeAudio(audioBlob)
        } else {
          console.log('🔇 Skipping tiny audio segment to avoid hallucination:', { 
            size: audioBlob.size, 
            required: minAudioSize,
            reason: 'Too small - likely background noise'
          })
          setIsProcessing(false)
        }
        
        // After processing, resume recording if still in session (conversational mode)
        if (isRecordingRef.current && !isProcessing) {
          setTimeout(() => {
            if (isRecordingRef.current && resumeRecordingRef.current) {
              console.log('🔄 Auto-resuming recording for continued conversation...')
              resumeRecordingRef.current()
            }
          }, 200)
        }
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

      // Start voice activity detection for automatic transcription
      console.log('🎤 Voice recording session started - improved precision, natural conversation', {
        silenceThreshold: silenceThreshold + 'ms',
        volumeThreshold: volumeThreshold,
        minAudioSize: minAudioSize + ' bytes',
        isRecording: true
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
    if (isRecording) {
      console.log('🛑 User manually stopping recording session...')
      
      // Update refs immediately to stop voice detection and session
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

      // Stop current recording if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      
      // Clean up resources
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }

      setIsRecording(false)
      setIsSpeaking(false)
      setIsProcessing(false)
    }
  }, [isRecording])



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
    pauseRecording,
    resumeRecording,
    cancelRecording,
    isSupported: typeof navigator !== 'undefined' && 
                !!navigator.mediaDevices && 
                !!navigator.mediaDevices.getUserMedia &&
                typeof MediaRecorder !== 'undefined'
  }
}