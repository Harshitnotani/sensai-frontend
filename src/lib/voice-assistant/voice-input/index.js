// Basic Voice Input Capture using Web Audio API

export class VoiceInput {
  constructor() {
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.onDataCallback = null;
    this.onStateChange = null;
  }

  async requestMicPermission() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (err) {
      alert('Microphone access denied.');
      return false;
    }
  }

  startRecording() {
    if (!this.mediaStream) {
      throw new Error('Microphone not initialized. Call requestMicPermission() first.');
    }
    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(this.mediaStream);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.audioChunks.push(e.data);
    };
    this.mediaRecorder.onstop = () => {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      if (this.onDataCallback) this.onDataCallback(audioBlob);
    };
    this.mediaRecorder.start();
    this.isRecording = true;
    if (this.onStateChange) this.onStateChange('listening');
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      if (this.onStateChange) this.onStateChange('idle');
    }
  }

  onData(callback) {
    this.onDataCallback = callback;
  }

  onState(callback) {
    this.onStateChange = callback;
  }
}

// Free Web Speech API implementation
export class WebSpeechRecognition {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    
    // Check if Web Speech API is available
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new SpeechRecognition();
    } else {
      throw new Error('Speech recognition not supported in this browser');
    }
    
    this.setupRecognition();
  }

  setupRecognition() {
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (this.onResultCallback) {
        this.onResultCallback(finalTranscript || interimTranscript, !interimTranscript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (this.onErrorCallback) {
        this.onErrorCallback(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  startListening() {
    if (this.recognition && !this.isListening) {
      this.recognition.start();
      this.isListening = true;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  onResult(callback) {
    this.onResultCallback = callback;
  }

  onError(callback) {
    this.onErrorCallback = callback;
  }
}

import { API_ENDPOINTS } from '../utils/api.js';
// Legacy function for compatibility (now uses Web Speech API)
export async function transcribeWithWhisper(audioBlob) {
  console.log('Frontend - transcribeWithWhisper: Sending audio to backend.', audioBlob);
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');

    const response = await fetch(API_ENDPOINTS.transcribe, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Frontend - transcribeWithWhisper: HTTP error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Frontend - transcribeWithWhisper: Received transcription from backend:', data);
    return data.text;
  } catch (error) {
    console.error('Frontend - transcribeWithWhisper: Error transcribing audio with Whisper backend:', error);
    return null;
  }
}
