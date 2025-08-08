'use client';

import { VoiceSystem } from '@/lib/voice-assistant/voice-system/index';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function VoiceAssistantPage() {
  const [status, setStatus] = useState('Inactive');
  const [transcript, setTranscript] = useState('Your speech will appear here...');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confirmationResult, setConfirmationResult] = useState('');
  const [isVoiceSystemActive, setIsVoiceSystemActive] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitted' | 'failed'>('idle');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const voiceSystemRef = useRef<VoiceSystem | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      voiceSystemRef.current = new VoiceSystem();
      
      voiceSystemRef.current.onBargeIn((keyword: string) => {
        console.log(`Barge-in detected: ${keyword}`);
        if (voiceSystemRef.current) {
          voiceSystemRef.current.speakAndHighlight(`You said ${keyword}. I've stopped speaking.`);
        }
      });
    }

    return () => {
      if (voiceSystemRef.current) {
        voiceSystemRef.current.stop();
      }
    };
  }, []);

  const startVoiceSystem = async () => {
    if (voiceSystemRef.current) {
      try {
        const granted = await voiceSystemRef.current.voiceInput.requestMicPermission();
        if (granted) {
          setHasMicPermission(true);
          voiceSystemRef.current.start();
          setStatus('Active');
          setIsVoiceSystemActive(true);
        } else {
          alert('Microphone permission denied. Cannot start voice system.');
        }
      } catch (error) {
        console.error("Error requesting microphone permission:", error);
        alert('Error requesting microphone permission. Please check console.');
      }
    }
  };

  const stopVoiceSystem = () => {
    if (voiceSystemRef.current) {
      voiceSystemRef.current.stop();
      setStatus('Inactive');
      setIsVoiceSystemActive(false);
      setHasMicPermission(false); // Reset permission status on stop
    }
  };

  const startListening = useCallback(() => {
    if (voiceSystemRef.current && hasMicPermission) {
      setTranscript('Listening...');
      setInterimTranscript('');
      voiceSystemRef.current.listenForInput(async (text: string, isFinal: boolean) => {
        console.log('Frontend - Received from listenForInput:', { text, isFinal });
        if (isFinal) {
          setTranscript(`You said: ${text}`);
          setInterimTranscript(''); // Clear interim once final is received

          if (text) {
            console.log('User said:', text);
            const dialogResult = await voiceSystemRef.current.dialogManager.handleInput(text); // Await the async call

            if (dialogResult) {
              // If handleInput returned a next step, speak and highlight
              voiceSystemRef.current.speakAndHighlight(dialogResult.prompt, dialogResult.uiHighlight);
            } else {
              // If handleInput returned null, it means no intent was recognized or action failed
              // Check if a journey is still active or if it was reset
              if (voiceSystemRef.current.dialogManager.currentJourney) {
                // A journey was active, but something went wrong (e.g., action failed).
                const currentStep = voiceSystemRef.current.dialogManager.getCurrentStep();
                if (currentStep && currentStep.action) {
                  const actionResult = await voiceSystemRef.current.dialogManager.performAction(currentStep.action);
                  if (actionResult.success) {
                    voiceSystemRef.current.speakAndHighlight("Great! Your request has been processed.");
                  } else if (actionResult.queued) {
                    voiceSystemRef.current.speakAndHighlight("It seems you're offline or there was a temporary issue. Your request has been saved and will be processed when you're back online.", null, 'info');
                  } else {
                    console.error('Action failed:', actionResult.error);
                    voiceSystemRef.current.speakAndHighlight("I'm sorry, there was an error completing your request. Please try again.");
                  }
                } else {
                  // Unexpected state: journey active but no valid step/action
                  console.warn('DialogManager is in an unexpected state: currentJourney active but no valid currentStep/action.');
                  voiceSystemRef.current.speakAndHighlight("I'm sorry, I've encountered an unexpected issue with our conversation flow. Could you please try again?");
                }
                voiceSystemRef.current.dialogManager.reset(); // Reset after failure/completion
              } else {
                // No active journey and no intent recognized
                voiceSystemRef.current.speakAndHighlight("I'm not sure how to help with that. Can you please rephrase?");
              }
            }
          } else {
            // Transcription was empty, indicate to user
            voiceSystemRef.current.speakAndHighlight("Sorry, I couldn't understand that. Can you please try again?");
          }
        } else {
          setInterimTranscript(text);
        }
      });
    } else if (!hasMicPermission) {
      alert("Please start the Voice System first to grant microphone permission.");
    }
  }, [hasMicPermission]);

  const stopListening = () => {
    if (voiceSystemRef.current && voiceSystemRef.current.voiceInput) {
      voiceSystemRef.current.voiceInput.stopRecording();
      // Capture the current interim transcript as final when stopping manually
      setTranscript(`Stoped Listening ${interimTranscript}`);
      setInterimTranscript('');
    }
  };

  const speakHelloWorld = () => {
    if (voiceSystemRef.current) {
      voiceSystemRef.current.speakAndHighlight("Learn how to organize and solve problems efficiently using data structures and algorithms—vital for coding and technical interviews.");
    }
  };

  const speakLongText = () => {
    if (voiceSystemRef.current) {
      voiceSystemRef.current.speakAndHighlight(
        "Gain skills to analyze data, find patterns, and use programming for insights—preparing you for analytics and machine learning roles."
      );
    }
  };

  const stopSpeaking = () => {
    if (voiceSystemRef.current && voiceSystemRef.current.voiceOutput) {
      voiceSystemRef.current.voiceOutput.stop();
    }
  };

  const highlightDemoElement = () => {
    if (voiceSystemRef.current) {
      voiceSystemRef.current.uiHighlight.highlight('#demoElement', 'default');
      setSubmissionStatus('submitted'); // Simulate submitted
      setSelectedSubject('DSA');
    }
  };

  const focusDemoElement = () => {
    if (voiceSystemRef.current) {
      voiceSystemRef.current.uiHighlight.focusElement('#demoElement');
      setSubmissionStatus('failed'); // Simulate not submitted/failed
      setSelectedSubject('Data Science');
    }
  };

  const clearHighlights = () => {
    if (voiceSystemRef.current) {
      voiceSystemRef.current.clearHighlights();
      setSubmissionStatus('idle'); // Reset status
      setSelectedSubject(null);
    }
  };

  const startBargeInTest = () => {
    if (voiceSystemRef.current) {
      voiceSystemRef.current.speakAndHighlight(
        "I'm speaking now. Try saying stop, pause, wait, or interrupt to test barge-in functionality. " +
        "This speech will continue for a while to give you time to test the interruption."
      );
    }
  };

  const askForConfirmation = () => {
    if (voiceSystemRef.current) {
      voiceSystemRef.current.askForConfirmation(
        "If you have submitted the first task? Please say yes otherwise say no.",
        (response: string) => {
          setConfirmationResult(`Confirmation received: ${response}`);
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-light mb-6 text-white">Voice System</h1>
        <p className="text-gray-300 mb-8">All voice system features: Speech Recognition, Text-to-Speech, UI Highlighting, Barge-in, and Confirmation Handling.</p>

        <div className={`p-4 mb-8 rounded-lg font-light text-center ${isVoiceSystemActive ? 'bg-gray-800 text-green-400' : 'bg-gray-800 text-red-400'}`}>
          Voice System Status: {status}
        </div>

        <div className="bg-[#111111] border border-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h3 className="text-2xl font-light mb-4 text-white">System Controls</h3>
          <div className="flex flex-wrap gap-4">
            <button className="flex-1 min-w-[150px] px-6 py-3 bg-white text-black rounded-full font-medium hover:opacity-90 transition-opacity cursor-pointer" onClick={startVoiceSystem} disabled={isVoiceSystemActive}>Start Voice System</button>
            <button className="flex-1 min-w-[150px] px-6 py-3 bg-gray-800 text-white rounded-full font-medium hover:bg-gray-700 transition-colors cursor-pointer" onClick={stopVoiceSystem} disabled={!isVoiceSystemActive}>Stop Voice System</button>
          </div>
        </div>

        <div className="bg-[#111111] border border-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h3 className="text-2xl font-light mb-4 text-white">Create Account</h3>
          <div className="flex flex-wrap gap-4 mb-4">
            <button className="flex-1 min-w-[150px] px-6 py-3 bg-white text-black rounded-full font-medium hover:opacity-90 transition-opacity cursor-pointer" onClick={startListening} disabled={!isVoiceSystemActive || !hasMicPermission}>Start Listening</button>
            <button className="flex-1 min-w-[150px] px-6 py-3 bg-gray-800 text-white rounded-full font-medium hover:bg-gray-700 transition-colors cursor-pointer" onClick={stopListening} disabled={!isVoiceSystemActive || !hasMicPermission}>Stop Listening</button>
          </div>
          <div className="mt-4 p-4 border border-gray-700 rounded-md min-h-[80px] bg-gray-900 text-white flex flex-col justify-center items-center text-center">
            <div className="text-lg font-light"><strong>{transcript}</strong></div>
            <div className="text-gray-400 italic mt-1">{interimTranscript}</div>
          </div>
        </div>

        <div className="bg-[#111111] border border-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h3 className="text-2xl font-light mb-4 text-white">Join Course</h3>
          <div className="flex flex-wrap gap-4">
            <button className="flex-1 min-w-[150px] px-6 py-3 bg-white text-black rounded-full font-medium hover:opacity-90 transition-opacity cursor-pointer" onClick={speakHelloWorld} disabled={!isVoiceSystemActive}>"DSA Course"</button>
            <button className="flex-1 min-w-[150px] px-6 py-3 bg-white text-black rounded-full font-medium hover:opacity-90 transition-opacity cursor-pointer" onClick={speakLongText} disabled={!isVoiceSystemActive}>"Data Science Course"</button>
            <button className="flex-1 min-w-[150px] px-6 py-3 bg-gray-800 text-white rounded-full font-medium hover:bg-gray-700 transition-colors cursor-pointer" onClick={stopSpeaking} disabled={!isVoiceSystemActive}>Stop Speaking</button>
          </div>
        </div>

        <div className="bg-[#111111] border border-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h3 className="text-2xl font-light mb-4 text-white">Choose Subject</h3>
          <div className="flex flex-wrap gap-4 mb-4">
            <button className="flex-1 min-w-[150px] px-6 py-3 bg-white text-black rounded-full font-medium hover:opacity-90 transition-opacity cursor-pointer" onClick={highlightDemoElement} disabled={!isVoiceSystemActive}>DSA</button>
            <button className="flex-1 min-w-[150px] px-6 py-3 bg-white text-black rounded-full font-medium hover:opacity-90 transition-opacity cursor-pointer" onClick={focusDemoElement} disabled={!isVoiceSystemActive}>Data Science</button>
            <button className="flex-1 min-w-[150px] px-6 py-3 bg-gray-800 text-white rounded-full font-medium hover:bg-gray-700 transition-colors cursor-pointer" onClick={clearHighlights} disabled={!isVoiceSystemActive}>Clear Highlights</button>
          </div>
          <div id="demoElement" className={`p-4 mt-4 border-2 rounded-md cursor-pointer text-gray-300 bg-gray-900 flex items-center justify-center min-h-[60px] ${submissionStatus === 'submitted' ? 'border-green-500 bg-green-900/20 text-green-400' : submissionStatus === 'failed' ? 'border-red-500 bg-red-900/20 text-red-400' : 'border-gray-700 bg-gray-900'}`}>
            {selectedSubject ? `${selectedSubject} Chosen` : 'Subject'}
          </div>
        </div>

        <div className="bg-[#111111] border border-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h3 className="text-2xl font-light mb-4 text-white">Submit First Task</h3>
          <button className="flex-1 min-w-[150px] px-6 py-3 bg-white text-black rounded-full font-medium hover:opacity-90 transition-opacity cursor-pointer" onClick={askForConfirmation} disabled={!isVoiceSystemActive}>Task Confirmation</button>
          <div className="mt-4 p-4 border border-gray-700 rounded-md min-h-[50px] bg-gray-900 text-white flex items-center justify-center text-center">
            {confirmationResult}
          </div>
        </div>
      </div>
    </div>
  );
}
