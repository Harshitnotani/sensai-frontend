import { logEvent, logJourneyEnd, logJourneyStart } from '../utils/analytics.js';
import { addToOfflineSubmissionQueue, API_ENDPOINTS, joinCourse, signUp, submitOfflineTask } from '../utils/api.js';
import { DIALOG_FLOWS, INTENT_MAPPING } from './dialog-config.js';

export class DialogManager {
  constructor() {
    this.currentJourney = null;
    this.currentStepIndex = -1;
    this.collectedData = {};
  }

  reset() {
    if (this.currentJourney) {
      logJourneyEnd(this.currentJourney, 'aborted', this.collectedData);
    }
    this.currentJourney = null;
    this.currentStepIndex = -1;
    this.collectedData = {};
  }

  // Recognize user intent using GPT-based model (via backend API)
  async recognizeIntent(transcript) {
    try {
      const response = await fetch(API_ENDPOINTS.recognizeIntent, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: transcript }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const intent = data.intent;

      if (intent && intent !== 'none') {
        logEvent('intent_recognized', { transcript, intent });
        return intent;
      } else {
        logEvent('intent_not_recognized', { transcript });
        return null;
      }
    } catch (error) {
      console.error('Error recognizing intent via API:', error);
      logEvent('intent_recognition_api_failure', { transcript, error: error.message });
      // Fallback to simple keyword matching if API fails
      const lowerTranscript = transcript.toLowerCase();
      for (const phrase in INTENT_MAPPING) {
        if (lowerTranscript.includes(phrase)) {
          logEvent('intent_recognized_fallback', { transcript, intent: INTENT_MAPPING[phrase] });
          return INTENT_MAPPING[phrase];
        }
      }
      return null;
    }
  }

  startJourney(intent) {
    if (DIALOG_FLOWS[intent]) {
      this.currentJourney = intent;
      this.currentStepIndex = 0;
      this.collectedData = {}; // Clear data for new journey
      logJourneyStart(intent);
      return this.getCurrentStep();
    }
    return null;
  }

  nextStep() {
    if (this.currentJourney && this.currentStepIndex < DIALOG_FLOWS[this.currentJourney].steps.length - 1) {
      this.currentStepIndex++;
      return this.getCurrentStep();
    }
    return null; // End of journey or no active journey
  }

  getCurrentStep() {
    if (this.currentJourney && this.currentStepIndex !== -1) {
      return DIALOG_FLOWS[this.currentJourney].steps[this.currentStepIndex];
    }
    return null;
  }

  // New method to perform actions based on the current step
  async performAction(actionName) {
    const data = this.getCollectedData();
    const journeyType = this.currentJourney; // Get the current journey type
    console.log(`Performing action: ${actionName} for journey: ${journeyType} with data:`, data);
    logEvent('action_performed', { journey: journeyType, action: actionName, data });
    try {
      let result = null;
      switch (actionName) {
        case 'captureFullName':
        case 'captureEmail':
        case 'capturePassword':
        case 'captureCourseName':
        case 'captureTaskDescription':
          // These are data collection steps, no immediate API call
          break;
        case 'confirmSignUp':
          result = await signUp(data);
          console.log('Sign Up API response:', result);
          logEvent('api_call_success', { api: 'signUp', data, result });
          break;
        case 'confirmJoinCourse':
          result = await joinCourse(data);
          console.log('Join Course API response:', result);
          logEvent('api_call_success', { api: 'joinCourse', data, result });
          break;
        case 'confirmOfflineSubmission':
          result = await submitOfflineTask(data);
          console.log('Offline Submission API response:', result);
          logEvent('api_call_success', { api: 'submitOfflineTask', data, result });
          break;
        default:
          console.warn(`Unknown action: ${actionName}`);
      }
      if (this.currentJourney && !this.nextStep()) { // Check if journey is about to complete
        logJourneyEnd(this.currentJourney, 'success', data);
      }
      return { success: true, result };
    } catch (error) {
      console.error(`Error performing action ${actionName}:`, error);
      logEvent('api_call_failure', { api: actionName, data, error: error.message });
      // Add to offline queue if API call failed for confirmation steps
      if (actionName.startsWith('confirm')) {
        addToOfflineSubmissionQueue({
          type: journeyType,
          data: data,
          action: actionName
        });
        console.log('Action added to offline submission queue.');
        logEvent('offline_queue_add', { journey: journeyType, action: actionName, data });
        return { success: false, error, queued: true };
      }
      if (this.currentJourney) {
        logJourneyEnd(this.currentJourney, 'failure', data);
      }
      return { success: false, error };
    }
  }

  async handleInput(transcript) { // Make this method async
    if (this.currentJourney) {
      const currentStep = this.getCurrentStep();
      if (currentStep) {
        this.collectData(currentStep.name, transcript);
        logEvent('input_collected', { journey: this.currentJourney, step: currentStep.name, transcript, data: this.collectedData });

        if (currentStep.expectedInputType === 'confirmation') {
            return this.nextStep();
        } else {
            // For other input types, perform the action before moving to the next step
            const actionResult = await this.performAction(currentStep.action);
            if (actionResult.success) {
                return this.nextStep();
            } else if (actionResult.queued) {
              // If action was queued, consider it a success for dialog flow purposes
              return this.nextStep();
            } else {
                // If action failed and not queued, stay on current step or provide error feedback
                return null; // Indicates an issue, VoiceSystem should handle feedback
            }
        }
      }
    } else {
      const intent = await this.recognizeIntent(transcript); // Await the intent recognition
      if (intent) {
        return this.startJourney(intent);
      }
    }
    return null;
  }

  collectData(key, value) {
    this.collectedData[key] = value;
  }

  getCollectedData() {
    return this.collectedData;
  }
}
