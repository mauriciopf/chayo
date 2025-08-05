# Conversational Voice Feature

## 🎤 Overview

The Conversational Voice feature enables natural, hands-free conversations with the AI. Users can speak naturally and the system automatically detects pauses to send messages, creating a seamless conversational experience.

## ✨ Features

### **Natural Conversation Flow**
- 🎯 **Continuous Listening**: No need to click start/stop buttons repeatedly
- 🔇 **Automatic Pause Detection**: Messages auto-send after 2.5 seconds of silence
- 🗣️ **Voice Activity Detection**: Real-time detection of when user is speaking
- 📝 **Auto-Transcription**: Speech automatically converted to text and sent

### **Smart Audio Processing**
- 🎚️ **Volume Threshold**: Configurable sensitivity for speech detection
- 🔊 **Real-time Audio Analysis**: Web Audio API for voice activity detection
- 🎙️ **Multiple Format Support**: WebM, MP4, OGG audio formats
- 🚀 **OpenAI Whisper**: High-quality speech-to-text transcription

### **User Experience**
- 💡 **Visual Feedback**: Different states (listening, speaking, processing)
- 🌐 **Bilingual Support**: English and Spanish translations
- 📱 **Mobile Friendly**: Optimized for touch devices
- ♿ **Accessible**: Proper ARIA labels and keyboard navigation

## 🔧 Implementation

### **Components**

1. **`useConversationalVoice` Hook**
   - Manages continuous microphone access
   - Handles voice activity detection
   - Automatic pause detection and message sending
   - Real-time audio analysis using Web Audio API

2. **`ConversationalVoiceButton` Component**
   - Toggle button to start/stop conversational mode
   - Visual indicators for different states
   - Real-time transcript preview
   - Error handling and user feedback

3. **Integration with `ChatInput`**
   - Both traditional and conversational voice options
   - Seamless integration with existing chat flow
   - Auto-send functionality for conversational mode

### **Technical Details**

```typescript
// Voice Activity Detection
const detectVoiceActivity = () => {
  analyser.getByteFrequencyData(dataArray)
  const volume = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
  const normalizedVolume = volume / 255
  
  if (normalizedVolume > volumeThreshold) {
    // User is speaking
    clearSilenceTimer()
  } else {
    // Start silence timer
    startSilenceTimer(pauseThreshold)
  }
}
```

## 🎛️ Configuration

### **Default Settings**
- **Pause Threshold**: 2500ms (2.5 seconds)
- **Volume Threshold**: 0.01 (1% of max volume)
- **Sample Rate**: 16000 Hz (optimized for speech)
- **Audio Processing**: Echo cancellation, noise suppression, auto gain control

### **Customizable Options**
```typescript
const conversationalVoice = useConversationalVoice({
  pauseThreshold: 3000,    // Custom pause duration
  volumeThreshold: 0.015,  // Custom sensitivity
  onTranscription: (text) => {},
  onError: (error) => {},
  onSendMessage: (message) => {}
})
```

## 🎯 User Workflow

1. **Start Conversation**: Click the conversational voice button
2. **Speak Naturally**: Talk normally, no need to hold buttons
3. **Automatic Processing**: System detects speech and silence
4. **Auto-Send**: Message automatically sent after pause
5. **Continue**: Keep speaking for follow-up messages
6. **Stop**: Click button again to end conversation

## 🔄 States

| State | Icon | Color | Description |
|-------|------|-------|-------------|
| **Idle** | MicOff | Gray | Ready to start conversation |
| **Listening** | Mic | Blue | Waiting for speech |
| **Speaking** | Volume2 | Red (pulsing) | User is speaking |
| **Processing** | Loader | Yellow | Transcribing audio |

## 🌍 Internationalization

### **English Translations**
```json
"conversationalVoice": {
  "startListening": "Start conversation",
  "listening": "Listening... speak naturally",
  "speaking": "Speaking detected...",
  "processing": "Processing speech..."
}
```

### **Spanish Translations**
```json
"conversationalVoice": {
  "startListening": "Iniciar conversación",
  "listening": "Escuchando... habla naturalmente",
  "speaking": "Voz detectada...",
  "processing": "Procesando voz..."
}
```

## 🛠️ Browser Compatibility

- ✅ **Chrome**: Full support
- ✅ **Firefox**: Full support  
- ✅ **Safari**: Full support
- ✅ **Edge**: Full support
- 📱 **Mobile Safari**: Full support
- 📱 **Chrome Mobile**: Full support

## 🔐 Privacy & Security

- 🔒 **Local Processing**: Voice activity detection happens locally
- 🌐 **Secure Transmission**: Audio sent over HTTPS
- 🗑️ **No Storage**: Audio data not stored permanently
- 🔑 **Permission Based**: Requires explicit microphone permission

## 🚀 Future Enhancements

- 🔄 **Real-time Streaming**: Live transcription as you speak
- 🎯 **Context Awareness**: Smarter pause detection based on conversation flow
- 🗣️ **Voice Commands**: Support for voice navigation commands
- 🌍 **Multi-language**: Automatic language detection
- 🎚️ **Adaptive Thresholds**: AI-powered sensitivity adjustment

## 🎉 Benefits

1. **Natural Experience**: Feels like talking to a real person
2. **Hands-free Operation**: Perfect for accessibility and multitasking
3. **Faster Communication**: No typing required
4. **Reduced Friction**: Eliminates manual start/stop actions
5. **Better Engagement**: More intuitive for voice-first users