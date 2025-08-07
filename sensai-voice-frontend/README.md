# Sensai Voice System - Complete Implementation

A comprehensive voice-driven system with speech recognition, text-to-speech, UI highlighting, barge-in functionality, and confirmation handling.

## 🚀 Features

- **Speech Recognition**: Real-time speech-to-text using Web Speech API
- **Text-to-Speech**: Natural voice output with configurable voices
- **UI Highlighting**: Dynamic highlighting and focus of UI elements
- **Barge-in**: Interrupt ongoing speech with keywords like "stop", "pause"
- **Confirmation Handling**: Yes/no detection for dialog flows
- **No API Keys Required**: Uses browser's built-in capabilities

## 📁 Project Structure

```
sensai-voice-frontend/
├── voice-input/              # Speech recognition module
│   ├── index.js
│   └── demo-web-speech.html
├── voice-output/             # Text-to-speech module
│   └── index.js
├── ui-highlight-controller/  # UI highlighting module
│   └── index.js
├── barge-in-controller/      # Interruption detection
│   └── index.js
├── user-confirmation-handler/ # Yes/no detection
│   └── index.js
├── voice-system/             # Complete system integration
│   └── index.js
├── complete-demo.html        # Full feature demo
└── README.md                 # This file
```

## 🛠️ Setup Instructions

### Prerequisites
- Modern web browser (Chrome, Edge, Safari)
- Local web server (for ES6 modules)

### Quick Start

1. **Clone/Download the project**
   ```bash
   # Navigate to the voice frontend directory
   cd sensai-voice-frontend
   ```

2. **Start a local web server**
   ```bash
   # Using Python (recommended)
   python -m http.server 8080
   
   # Or using Node.js
   npx http-server -p 8080
   ```

3. **Open the demo**
   - Go to: `http://localhost:8080/complete-demo.html`
   - Allow microphone permissions when prompted

## 🎯 Usage Guide

### Basic Usage

```javascript
import { VoiceSystem } from './voice-system/index.js';

const voiceSystem = new VoiceSystem();

// Start the system
voiceSystem.start();

// Speak text and highlight UI
voiceSystem.speakAndHighlight("Hello world!", "#myButton", "focus");

// Listen for user input
voiceSystem.listenForInput((text) => {
  console.log("User said:", text);
});

// Ask for confirmation
voiceSystem.askForConfirmation("Do you want to proceed?", (response) => {
  if (response === 'yes') {
    // Proceed with action
  }
});
```

### Individual Modules

#### Speech Recognition
```javascript
import { WebSpeechRecognition } from './voice-input/index.js';

const recognition = new WebSpeechRecognition();
recognition.onResult((text, isFinal) => {
  if (isFinal) {
    console.log("Final transcript:", text);
  }
});
recognition.startListening();
```

#### Text-to-Speech
```javascript
import { VoiceOutput } from './voice-output/index.js';

const tts = new VoiceOutput();
tts.speak("Hello world!", { rate: 1.0, pitch: 1.0 });
```

#### UI Highlighting
```javascript
import { UIHighlightController } from './ui-highlight-controller/index.js';

const highlight = new UIHighlightController();
highlight.highlight("#myButton", "focus");
highlight.clickElement("#myButton");
```

#### Barge-in Detection
```javascript
import { BargeInController } from './barge-in-controller/index.js';

const bargeIn = new BargeInController(voiceInput, voiceOutput);
bargeIn.onBargeIn((keyword) => {
  console.log("Interrupted with:", keyword);
});
```

#### Confirmation Handling
```javascript
import { UserConfirmationHandler } from './user-confirmation-handler/index.js';

const confirmation = new UserConfirmationHandler(voiceInput);
confirmation.askForConfirmation("Continue?", (response) => {
  console.log("Response:", response); // 'yes', 'no', or 'maybe'
});
```

## 🎮 Demo Features

### Complete Demo (`complete-demo.html`)
- **System Controls**: Start/stop the voice system
- **Speech Recognition**: Real-time transcription
- **Text-to-Speech**: Speak text with different voices
- **UI Highlighting**: Highlight and focus elements
- **Barge-in Test**: Interrupt speech with keywords
- **Confirmation Test**: Yes/no detection

### Web Speech Demo (`voice-input/demo-web-speech.html`)
- Simple speech recognition demo
- Real-time transcription display
- No backend required

## 🔧 Configuration

### Barge-in Keywords
```javascript
voiceSystem.setBargeInKeywords(['stop', 'pause', 'wait', 'interrupt']);
```

### Confirmation Keywords
```javascript
voiceSystem.setConfirmationKeywords({
  yes: ['yes', 'yeah', 'sure', 'okay'],
  no: ['no', 'nope', 'not', 'cancel'],
  maybe: ['maybe', 'perhaps', 'unsure']
});
```

### Voice Settings
```javascript
// Get available voices
const voices = voiceSystem.getAvailableVoices();

// Set specific voice
voiceSystem.setVoice(voices[0]);
```

## 🌐 Browser Support

| Feature | Chrome | Edge | Safari | Firefox |
|---------|--------|------|--------|---------|
| Speech Recognition | ✅ | ✅ | ✅ | ❌ |
| Text-to-Speech | ✅ | ✅ | ✅ | ✅ |
| ES6 Modules | ✅ | ✅ | ✅ | ✅ |

**Note**: Firefox doesn't support Web Speech API for speech recognition.

## 🚨 Troubleshooting

### Common Issues

1. **"Module not found" errors**
   - Make sure you're serving files through a web server
   - Don't open HTML files directly (`file://` protocol)

2. **"Speech recognition not supported"**
   - Use Chrome, Edge, or Safari
   - Firefox doesn't support speech recognition

3. **Microphone not working**
   - Check browser permissions
   - Allow microphone access when prompted
   - Try refreshing the page

4. **No speech output**
   - Check system volume
   - Try different voices
   - Ensure browser supports speech synthesis

5. **Barge-in not working**
   - Speak clearly and loudly
   - Use exact keywords: "stop", "pause", "wait", "interrupt"
   - Check console for errors

### Debug Mode

Open browser console (F12) to see:
- Speech recognition events
- Barge-in detection
- Confirmation responses
- Error messages

## 📚 API Reference

### VoiceSystem Class

#### Methods
- `start()` - Start the voice system
- `stop()` - Stop the voice system
- `speakAndHighlight(text, selector, type)` - Speak and highlight UI
- `listenForInput(callback)` - Listen for user speech
- `askForConfirmation(question, callback)` - Ask yes/no question
- `clickElement(selector)` - Click UI element
- `focusElement(selector)` - Focus UI element
- `clearHighlights()` - Remove all highlights

#### Properties
- `voiceInput` - Speech recognition instance
- `voiceOutput` - Text-to-speech instance
- `uiHighlight` - UI highlighting instance
- `bargeIn` - Barge-in controller instance
- `confirmation` - Confirmation handler instance

## 🔄 Integration with Existing Projects

### React Integration
```javascript
import { VoiceSystem } from './voice-system/index.js';

function MyComponent() {
  const [voiceSystem] = useState(() => new VoiceSystem());
  
  useEffect(() => {
    voiceSystem.start();
    return () => voiceSystem.stop();
  }, []);
  
  // Use voiceSystem methods...
}
```

### Vue Integration
```javascript
import { VoiceSystem } from './voice-system/index.js';

export default {
  mounted() {
    this.voiceSystem = new VoiceSystem();
    this.voiceSystem.start();
  },
  beforeDestroy() {
    this.voiceSystem.stop();
  }
}
```

## 🎯 Next Steps

1. **Test the complete demo** to understand all features
2. **Integrate into your existing project** using the API reference
3. **Customize keywords and voices** for your use case
4. **Add error handling** for production use
5. **Implement conversation flow** using the confirmation system

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Ensure you're using a supported browser
4. Test with the provided demos first

---

**Happy Voice Development! 🎤✨**
