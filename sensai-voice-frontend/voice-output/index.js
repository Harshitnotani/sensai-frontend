// Voice Output Module using Web Speech API

export class VoiceOutput {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.utterance = null;
    this.isSpeaking = false;
    this.onStartCallback = null;
    this.onEndCallback = null;
    this.onErrorCallback = null;
  }

  speak(text, options = {}) {
    if (this.isSpeaking) {
      this.stop();
    }

    this.utterance = new SpeechSynthesisUtterance(text);
    
    // Set default options
    this.utterance.rate = options.rate || 1.0;
    this.utterance.pitch = options.pitch || 1.0;
    this.utterance.volume = options.volume || 1.0;
    this.utterance.lang = options.lang || 'en-US';
    
    // Set voice if specified
    if (options.voice) {
      this.utterance.voice = options.voice;
    }

    // Event handlers
    this.utterance.onstart = () => {
      this.isSpeaking = true;
      if (this.onStartCallback) this.onStartCallback();
    };

    this.utterance.onend = () => {
      this.isSpeaking = false;
      if (this.onEndCallback) this.onEndCallback();
    };

    this.utterance.onerror = (event) => {
      this.isSpeaking = false;
      if (this.onErrorCallback) this.onErrorCallback(event.error);
    };

    this.synthesis.speak(this.utterance);
  }

  stop() {
    if (this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }

  pause() {
    if (this.isSpeaking) {
      this.synthesis.pause();
    }
  }

  resume() {
    if (this.isSpeaking) {
      this.synthesis.resume();
    }
  }

  getVoices() {
    return this.synthesis.getVoices();
  }

  onStart(callback) {
    this.onStartCallback = callback;
  }

  onEnd(callback) {
    this.onEndCallback = callback;
  }

  onError(callback) {
    this.onErrorCallback = callback;
  }

  isCurrentlySpeaking() {
    return this.isSpeaking;
  }
}
