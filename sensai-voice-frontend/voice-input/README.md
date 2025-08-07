# Voice Input Module - Setup Instructions

## How to Run the Demo

### Step 1: Start the Backend
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd sensai-voice-backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the `sensai-voice-backend` directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-PzDBBVYywbJJJPldSafsMQ
   ```

4. Start the backend server:
   ```bash
   python main.py
   ```
   
   You should see: `INFO:     Uvicorn running on http://0.0.0.0:8002`

### Step 2: Open the Frontend Demo
1. Open a web browser
2. Navigate to: `file:///path/to/sensai-voice-frontend/voice-input/demo.html`
   
   **Important:** You must open the HTML file using a web server, not directly as a file. You can:
   
   - Use Python's built-in server:
     ```bash
     cd sensai-voice-frontend/voice-input
     python -m http.server 8080
     ```
     Then open: `http://localhost:8080/demo.html`
   
   - Or use any other local web server

### Step 3: Test the Demo
1. Click "Start Recording" - you'll be prompted for microphone permission
2. Speak into your microphone
3. Click "Stop Recording"
4. Wait for the transcription to appear

## Troubleshooting

- **"Module not found" errors**: Make sure you're serving the HTML file through a web server, not opening it directly as a file
- **"Backend error"**: Make sure the backend is running on port 8002
- **"Microphone access denied"**: Check your browser's microphone permissions
- **No transcription**: Check that your OpenAI API key is correct in the `.env` file
