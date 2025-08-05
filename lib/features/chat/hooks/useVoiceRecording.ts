import { useState, useRef, useCallback } from 'react'

interface UseVoiceRecordingProps {
  onTranscription: (text: string) => void
  onError: (error: string) => void
  onSendMessage?: (message: string) => void // Optional auto-send functionality
  autoSend?: boolean // Whether to automatically send transcribed messages
    }

export function useVoiceRecording({ onTranscription, onError, onSendMessage, autoSend = false }: UseVoiceRecordingProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      })

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
        stream.getTracks().forEach(track => track.stop())
        
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
  }, [onError])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
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
        
        // Auto-send if enabled
        if (autoSend && onSendMessage) {
          console.log('🎯 Auto-sending transcribed message:', transcribedText)
          onSendMessage(transcribedText)
        }
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
      // Stop the recorder without processing
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      setIsProcessing(false)
      audioChunksRef.current = []
    }
  }, [isRecording])

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    cancelRecording,
    isSupported: typeof navigator !== 'undefined' && 
                !!navigator.mediaDevices && 
                !!navigator.mediaDevices.getUserMedia &&
                typeof MediaRecorder !== 'undefined'
  }
}