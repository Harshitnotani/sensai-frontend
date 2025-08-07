// Complete Voice System Integration

import { BargeInController } from '../barge-in-controller/index.js';
import { UIHighlightController } from '../ui-highlight-controller/index.js';
import { UserConfirmationHandler } from '../user-confirmation-handler/index.js';
import { getOfflineSubmissionQueue, processOfflineSubmissionQueue } from '../utils/api.js';
import { VoiceInput, transcribeWithWhisper } from '../voice-input/index.js';
import { VoiceOutput } from '../voice-output/index.js';
import { DialogManager } from './dialog-manager.js';

export class VoiceSystem {
  constructor() {
    // Initialize all modules
    this.voiceInput = new VoiceInput();
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

    // Bind transcribeWithWhisper to VoiceSystem instance for easier access
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
    this.voiceInput.onData(async (audioBlob) => {
      if (this.isActive) {
        console.log('Audio captured, transcribing...');
        const transcript = await this.transcribeWithWhisper(audioBlob);

        if (transcript) {
          console.log('User said:', transcript);
          const nextStep = this.dialogManager.handleInput(transcript);

          if (nextStep) {
            this.speakAndHighlight(nextStep.prompt, nextStep.uiHighlight);
            if (nextStep.expectedInputType === 'confirmation') {
              this.askForConfirmation(nextStep.prompt, async (confirmed) => {
                if (confirmed) {
                  console.log('User confirmed.');
                  const currentAction = this.dialogManager.getCurrentStep().action;
                  const actionResult = await this.dialogManager.performAction(currentAction);
                  if (actionResult.success) {
                    const afterConfirmationStep = this.dialogManager.nextStep();
                    if (afterConfirmationStep) {
                      this.speakAndHighlight(afterConfirmationStep.prompt, afterConfirmationStep.uiHighlight);
                    } else {
                      console.log('Journey completed.');
                      this.speakAndHighlight("Great! Your request has been processed.");
                      this.dialogManager.reset();
                    }
                  } else if (actionResult.queued) {
                    // If action was queued for offline submission
                    this.speakAndHighlight("It seems you're offline or there was a temporary issue. Your request has been saved and will be processed when you're back online.", null, 'info');
                    this.dialogManager.reset();
                  } else {
                    console.error('Action failed:', actionResult.error);
                    this.speakAndHighlight("I'm sorry, there was an error processing your request. Please try again.");
                    this.dialogManager.reset();
                  }
                } else {
                  console.log('User denied or provided other response.');
                  this.dialogManager.reset();
                  this.speakAndHighlight("Okay, let's try again. What can I help you with?");
                }
              });
            } else {
              // If it's a data collection step, perform the action immediately after collecting data
              const currentAction = this.dialogManager.getCurrentStep().action;
              const actionResult = await this.dialogManager.performAction(currentAction);
              if (!actionResult.success) {
                console.error('Action failed:', actionResult.error);
                this.speakAndHighlight("I'm sorry, there was an error processing your input. Please try again.");
                this.dialogManager.reset();
              }
            }
          } else {
            // If nextStep is null, it means either intent not recognized or journey completed.
            // If handleInput returns null due to an action failure in a data collection step
            if (nextStep === null && this.dialogManager.currentJourney) {
              this.speakAndHighlight("I'm sorry, I couldn't process that input. Can you please try again?");
              this.dialogManager.reset(); // Reset the journey on action failure
            } else if (this.dialogManager.currentJourney) {
              const finalActionStep = this.dialogManager.getCurrentStep(); // Get the last step's action
              if (finalActionStep && finalActionStep.action && finalActionStep.expectedInputType !== 'confirmation') { // Ensure not a confirmation step action
                const actionResult = await this.dialogManager.performAction(finalActionStep.action);
                if (actionResult.success) {
                  this.speakAndHighlight("Great! Your request has been processed.");
                } else if (actionResult.queued) {
                  this.speakAndHighlight("It seems you're offline or there was a temporary issue. Your request has been saved and will be processed when you're back online.", null, 'info');
                } else {
                  console.error('Final action failed:', actionResult.error);
                  this.speakAndHighlight("I'm sorry, there was an error completing your request. Please try again.");
                }
              }
              console.log('Journey completed.');
              this.dialogManager.reset();
            } else {
              this.speakAndHighlight("I'm not sure how to help with that. Can you please rephrase?");
            }
          }
          callback(transcript);
        } else {
          console.error('Transcription failed.');
          this.speakAndHighlight("Sorry, I couldn't understand that. Can you please try again?");
        }
      }
    });
    
    this.voiceInput.startRecording(); // Start recording when listenForInput is called
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
