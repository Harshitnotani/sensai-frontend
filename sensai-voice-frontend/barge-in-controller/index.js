// Barge-in Controller

export class BargeInController {
  constructor(voiceInput, voiceOutput, transcribeFunction) {
    this.voiceInput = voiceInput;
    this.voiceOutput = voiceOutput;
    this.transcribe = transcribeFunction; // The transcribeWithWhisper function
    this.isListeningForBargeIn = false;
    this.bargeInKeywords = ['stop', 'pause', 'wait', 'hold on', 'interrupt', 'cancel', 'start over', 'reset'];
    this.onBargeInCallback = null;
    this.recognition = null; // No longer using Web Speech API recognition directly for barge-in
    this.setupVoiceInputForBargeIn();
  }

  setupVoiceInputForBargeIn() {
    if (!this.voiceInput) {
      console.warn('VoiceInput not provided to BargeInController. Barge-in will not function.');
      return;
    }

    this.voiceInput.onData(async (audioBlob) => {
      if (this.isListeningForBargeIn) {
        const transcript = await this.transcribe(audioBlob);
        if (transcript) {
          const detectedKeyword = this.detectBargeInKeyword(transcript);
          if (detectedKeyword) {
            this.handleBargeIn(detectedKeyword);
          }
        }
      }
    });
  }

  detectBargeInKeyword(transcript) {
    const lowerTranscript = transcript.toLowerCase();
    for (const keyword of this.bargeInKeywords) {
      if (lowerTranscript.includes(keyword)) {
        return keyword;
      }
    }
    return null;
  }

  handleBargeIn(keyword) {
    console.log(`Barge-in detected: "${keyword}"`);
    
    // Stop the voice output
    if (this.voiceOutput && this.voiceOutput.isCurrentlySpeaking()) {
      this.voiceOutput.stop();
    }
    
    // Stop listening for barge-in (this will also stop voiceInput.onData for barge-in)
    this.stopListeningForBargeIn();
    
    // Call the callback
    if (this.onBargeInCallback) {
      this.onBargeInCallback(keyword);
    }
  }

  startListeningForBargeIn() {
    if (!this.isListeningForBargeIn) {
      // VoiceInput is continuously recording, so we just toggle our internal flag
      this.isListeningForBargeIn = true;
      console.log('Barge-in listening started');
    }
  }

  stopListeningForBargeIn() {
    if (this.isListeningForBargeIn) {
      this.isListeningForBargeIn = false;
      console.log('Barge-in listening stopped');
    }
  }

  setBargeInKeywords(keywords) {
    this.bargeInKeywords = keywords.map(k => k.toLowerCase());
  }

  onBargeIn(callback) {
    this.onBargeInCallback = callback;
  }

  // Auto-start barge-in listening when voice output starts
  setupAutoBargeIn() {
    if (this.voiceOutput) {
      this.voiceOutput.onStart(() => {
        this.startListeningForBargeIn();
      });
      
      this.voiceOutput.onEnd(() => {
        this.stopListeningForBargeIn();
      });
    }
  }
}
