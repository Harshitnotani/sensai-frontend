// User Confirmation Handler

export class UserConfirmationHandler {
  constructor(voiceInput) {
    this.voiceInput = voiceInput;
    this.isWaitingForConfirmation = false;
    this.onConfirmationCallback = null;
    this.confirmationKeywords = {
      yes: ['yes', 'yeah', 'yep', 'sure', 'okay', 'ok', 'correct', 'right', 'true', 'affirmative'],
      no: ['no', 'nope', 'nah', 'not', 'wrong', 'false', 'negative', 'cancel', 'stop'],
      maybe: ['maybe', 'perhaps', 'possibly', 'not sure', 'unsure', 'dunno']
    };
    this.recognition = null;
    this.setupRecognition();
  }

  setupRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new SpeechRecognition();
    } else {
      console.warn('Speech recognition not available for confirmation');
      return;
    }

    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      if (this.isWaitingForConfirmation) {
        const transcript = event.results[0][0].transcript.toLowerCase();
        const response = this.detectConfirmationResponse(transcript);
        
        if (response) {
          this.handleConfirmation(response);
        } else {
          // Ask for clarification
          this.askForClarification();
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Confirmation recognition error:', event.error);
      if (this.isWaitingForConfirmation) {
        this.askForClarification();
      }
    };

    this.recognition.onend = () => {
      if (this.isWaitingForConfirmation) {
        // Restart listening if still waiting
        setTimeout(() => {
          if (this.isWaitingForConfirmation) {
            this.recognition.start();
          }
        }, 1000);
      }
    };
  }

  detectConfirmationResponse(transcript) {
    for (const [response, keywords] of Object.entries(this.confirmationKeywords)) {
      for (const keyword of keywords) {
        if (transcript.includes(keyword)) {
          return response;
        }
      }
    }
    return null;
  }

  handleConfirmation(response) {
    this.isWaitingForConfirmation = false;
    this.recognition.stop();
    
    console.log(`Confirmation received: ${response}`);
    
    if (this.onConfirmationCallback) {
      this.onConfirmationCallback(response);
    }
  }

  askForConfirmation(question, callback) {
    this.isWaitingForConfirmation = true;
    this.onConfirmationCallback = callback;
    
    // Speak the question
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(question);
      utterance.onend = () => {
        // Start listening for response
        this.recognition.start();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      // If no TTS, just start listening
      this.recognition.start();
    }
  }

  askForClarification() {
    const clarificationText = "I didn't understand. Please say yes or no.";
    
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(clarificationText);
      utterance.onend = () => {
        this.recognition.start();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      this.recognition.start();
    }
  }

  setConfirmationKeywords(keywords) {
    this.confirmationKeywords = keywords;
  }

  stopWaitingForConfirmation() {
    this.isWaitingForConfirmation = false;
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}
