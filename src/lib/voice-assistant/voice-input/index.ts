// Basic Voice Input Capture using Web Audio API

export class VoiceInput {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private onDataCallback: ((audioBlob: Blob) => void) | null = null;
  private onStateChange: ((state: 'idle' | 'listening') => void) | null = null;

  async requestMicPermission(): Promise<boolean> {
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

  onData(callback: (audioBlob: Blob) => void) {
    this.onDataCallback = callback;
  }

  onState(callback: (state: 'idle' | 'listening') => void) {
    this.onStateChange = callback;
  }
}

export async function transcribeWithWhisper(audioBlob: Blob): Promise<string | null> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');

  try {
    const response = await fetch('http://localhost:8002/transcribe', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.text || null;
  } catch (err) {
    console.error('Transcription error:', err);
    return null;
  }
}
