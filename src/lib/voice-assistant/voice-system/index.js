// Complete Voice System Integration

import { BargeInController } from '../barge-in-controller/index.js';
import { UIHighlightController } from '../ui-highlight-controller/index.js';
import { UserConfirmationHandler } from '../user-confirmation-handler/index.js';
import { getOfflineSubmissionQueue, processOfflineSubmissionQueue } from '../utils/api.js';
import { VoiceInput, WebSpeechRecognition, transcribeWithWhisper } from '../voice-input/index.js';
import { VoiceOutput } from '../voice-output/index.js';
import { DialogManager } from './dialog-manager.js';

export class VoiceSystem {
  constructor() {
    // Initialize all modules
    this.voiceInput = new VoiceInput();
    this.webSpeechRecognition = new WebSpeechRecognition(); // New: Initialize WebSpeechRecognition
    this.voiceOutput = new VoiceOutput();
    this.uiHighlight = new UIHighlightController();
    this.bargeIn = new BargeInController(this.voiceInput, this.voiceOutput, transcribeWithWhisper);
    this.confirmation = new UserConfirmationHandler(this.voiceInput);
    this.dialogManager = new DialogManager();
    
    // Setup auto barge-in
    this.bargeIn.setupAutoBargeIn();

    // Handle barge-in events
    this.bargeIn.onBargeIn(() => {
      console.log('Barge-in handled by VoiceSystem.');
      this.dialogManager.reset(); // Reset dialog on barge-in
      this.speakAndHighlight("Okay, I'm listening. How can I help you?");
    });
    
    // State management
    this.isActive = false;
    this.currentStep = null;

    // Bind transcribeWithWhisper to VoiceSystem instance for easier access (no longer needed here, but keeping for now)
    this.transcribeWithWhisper = transcribeWithWhisper;
  }

  // Start the voice system
  start() {
    this.isActive = true;
    console.log('Voice system started');
    // Process any pending offline submissions on startup
    this.processPendingOfflineSubmissions();
  }

  // Stop the voice system
  stop() {
    this.isActive = false;
    this.voiceOutput.stop();
    this.bargeIn.stopListeningForBargeIn();
    this.confirmation.stopWaitingForConfirmation();
    this.webSpeechRecognition.stopListening(); // Stop WebSpeechRecognition as well
    console.log('Voice system stopped');
  }

  // Speak text and highlight UI elements
  speakAndHighlight(text, selector = null, highlightType = 'default') {
    if (selector) {
      this.uiHighlight.highlight(selector, highlightType, true); // Ensure scrollIntoView is true
    }
    
    this.voiceOutput.speak(text);
  }

  // Process pending offline submissions and update UI
  async processPendingOfflineSubmissions() {
    const queue = getOfflineSubmissionQueue();
    if (queue.length > 0) {
      this.speakAndHighlight(`You have ${queue.length} pending offline submissions. Attempting to process them now.`, null, 'info');
      await processOfflineSubmissionQueue();
      const remainingQueue = getOfflineSubmissionQueue();
      if (remainingQueue.length === 0) {
        this.speakAndHighlight("All your pending offline submissions have been successfully processed!", null, 'success');
      } else {
        this.speakAndHighlight(`Failed to process ${remainingQueue.length} offline submissions. Will retry later.`, null, 'error');
      }
    }
  }

  // Listen for user input
  listenForInput(callback) {
    this.webSpeechRecognition.onResult((text, isFinal) => {
      if (this.isActive) {
        console.log('Frontend - Received from WebSpeechRecognition:', { text, isFinal });
        // The callback from page.tsx expects (text: string, isFinal: boolean)
        callback(text, isFinal); // Pass results directly to page.tsx
      }
    });
    
    this.webSpeechRecognition.onError((event) => {
      console.error('WebSpeechRecognition Error:', event.error);
      if (event.error === 'no-speech') {
        this.speakAndHighlight("I didn't detect any speech. Please try again.");
      } else if (event.error === 'not-allowed') {
        this.speakAndHighlight("Microphone access was denied. Please allow microphone access in your browser settings.");
      } else {
        this.speakAndHighlight("An error occurred with speech recognition. Please try again.");
      }
      // Only reset dialog manager if an error implies the conversation flow broke
      // For 'no-speech', we might want to stay in active listening mode or offer to continue
      // For now, reset for all errors to ensure a clean state.
      this.dialogManager.reset();
      callback('', true); // Indicate error to UI, clear interim
    });

    this.webSpeechRecognition.startListening(); // Start listening when listenForInput is called
  }

  // Ask for confirmation
  askForConfirmation(question, callback) {
    this.confirmation.askForConfirmation(question, callback);
  }

  // Set up barge-in callback
  onBargeIn(callback) {
    this.bargeIn.onBargeIn(callback);
  }

  // Click an element
  clickElement(selector) {
    this.uiHighlight.clickElement(selector);
  }

  // Focus an element
  focusElement(selector) {
    this.uiHighlight.focusElement(selector);
  }

  // Clear all highlights
  clearHighlights() {
    this.uiHighlight.unhighlightAll();
  }

  // Set barge-in keywords
  setBargeInKeywords(keywords) {
    this.bargeIn.setBargeInKeywords(keywords);
  }

  // Set confirmation keywords
  setConfirmationKeywords(keywords) {
    this.confirmation.setConfirmationKeywords(keywords);
  }

  // Get available voices
  getAvailableVoices() {
    return this.voiceOutput.getVoices();
  }

  // Set voice for output
  setVoice(voice) {
    this.voiceOutput.speak('', { voice: voice });
  }
}
