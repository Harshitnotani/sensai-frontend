# Barge-in Controller

## Purpose
Enable users to interrupt ongoing agent speech or actions by detecting specific keywords or phrases (e.g., "stop", "repeat", "help") and triggering appropriate handlers.

## Features
- Continuous or semi-continuous listening for interruption keywords
- Immediate interruption of ongoing TTS or agent actions
- Configurable list of barge-in commands
- Integration with Voice Input and Output modules

## Planned Implementation
- Use the Voice Input Module to capture audio while TTS is active
- Implement keyword spotting (locally or via API)
- Provide hooks/events for other modules to respond to barge-in
- Handle edge cases: false positives, overlapping speech, rapid interruptions

## Future Enhancements
- Customizable barge-in phrases per user/session
- Sensitivity tuning for keyword detection
- Visual feedback for detected interruptions
