# Voice Input with OpenAI Whisper Integration

This document describes the voice input feature that allows users to speak instead of typing in the chat interface.

## Overview

The voice input feature uses OpenAI's Whisper API to convert speech to text, providing a seamless way for users to interact with the chat system using their voice.

## Features

- **Real-time voice recording** with visual feedback
- **Automatic speech-to-text** conversion using OpenAI Whisper
- **Multi-language support** with automatic language detection
- **Mobile-optimized interface** with touch-friendly controls
- **Error handling** with user-friendly messages
- **Microphone permission management**

## Components

### 1. API Route (`/api/whisper`)
- Handles audio file uploads
- Integrates with OpenAI Whisper API
- Validates file types and sizes
- Returns transcribed text

### 2. Voice Recording Hook (`useVoiceRecording`)
- Manages MediaRecorder API
- Handles microphone permissions
- Processes audio recording and upload
- Provides recording state management

### 3. Voice Input Button (`VoiceInputButton`)
- UI component for voice recording controls
- Visual feedback for recording states
- Error display and handling
- Mobile-responsive design

## Setup Requirements

### Environment Variables

Ensure the following environment variable is set:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### Browser Support

The voice input feature requires:
- Modern browsers with MediaRecorder API support
- HTTPS connection (required for microphone access)
- User microphone permissions

### Supported Audio Formats

- WebM (preferred)
- MP4
- MP3
- WAV
- OGG

## Usage

1. **Click the microphone button** to start recording
2. **Speak clearly** into your device's microphone
3. **Click the stop button** to end recording
4. **Wait for processing** - the transcribed text will appear in the input field

## States

### Recording States
- **Idle**: Gray microphone icon
- **Recording**: Red button with pulsing indicator
- **Processing**: Yellow button with spinner
- **Error**: Red tooltip with error message

## Error Handling

The system handles various error scenarios:

- **Permission denied**: User denies microphone access
- **No microphone**: Device has no microphone
- **Network errors**: API connection issues
- **File size limits**: Audio files exceeding 25MB
- **No speech detected**: Empty or unclear audio

## Security Considerations

- **Authentication required**: Users must be logged in
- **File validation**: Audio files are validated for type and size
- **API key protection**: OpenAI API key is server-side only
- **HTTPS required**: Microphone access requires secure connection

## Mobile Optimization

- **Touch-friendly buttons**: Larger tap targets on mobile
- **Recording indicators**: Clear visual feedback
- **Cancel option**: Easy way to cancel recording
- **Error tooltips**: Mobile-appropriate error display

## Internationalization

Voice input supports multiple languages:
- **Auto-detection**: Whisper automatically detects spoken language
- **UI translations**: Error messages and tooltips in English/Spanish
- **Transcription accuracy**: High accuracy across supported languages

## Technical Details

### Audio Processing
- **Sampling rate**: Uses device default
- **Encoding**: WebM or MP4 depending on browser support
- **Quality settings**: Optimized for speech recognition
- **File compression**: Automatic compression for efficient upload

### API Integration
- **Whisper model**: Uses `whisper-1` model
- **Response format**: JSON with transcribed text
- **Rate limiting**: Handles OpenAI rate limits gracefully
- **Error recovery**: Automatic retry logic for transient errors

## Troubleshooting

### Common Issues

1. **Microphone not working**
   - Check browser permissions
   - Ensure HTTPS connection
   - Verify device microphone settings

2. **Poor transcription quality**
   - Speak clearly and slowly
   - Reduce background noise
   - Check microphone positioning

3. **API errors**
   - Verify OpenAI API key
   - Check internet connection
   - Monitor API usage limits

### Browser Compatibility

| Browser | Support | Notes |
|---------|---------|--------|
| Chrome | ✅ Full | Best performance |
| Firefox | ✅ Full | Good support |
| Safari | ✅ Full | iOS 14.3+ required |
| Edge | ✅ Full | Chromium-based |

## Future Enhancements

- **Continuous recording**: Long-form speech support
- **Voice commands**: Special voice commands for actions
- **Multiple languages**: Language selection UI
- **Offline support**: Local speech recognition fallback
- **Voice profiles**: User-specific voice training