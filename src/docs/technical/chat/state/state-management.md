
# State Management Documentation

## Message State
1. Initial State
   ```typescript
   {
     messages: [],
     isLoading: true,
     loadAttempts: 0,
     isReady: false
   }
   ```

2. Message Updates
   - Optimistic updates
   - Real-time sync
   - Error recovery
   - State persistence

3. Loading States
   - Initial load
   - Message send
   - Audio processing
   - Error states
   - Enhanced thinking indicator with gradient animation

## Session State
1. Active Session
   - Current messages
   - Template context
   - Patient context
   - Real-time status
   - Direct mode enabled by default

2. Session List
   - Recent sessions
   - Search functionality
   - Sort options
   - Filter criteria

3. Temporary Sessions
   - Creation process
   - Persistence rules
   - Cleanup handling
   - Error recovery

## Chat Mode Management
1. Default Configuration
   - Direct mode enabled by default
   - Skip context processing for faster responses
   - Toggle available for context-aware mode when needed

2. Mode Persistence
   - State maintained within session
   - Visual feedback through UI
   - Toast notifications on mode change

3. Context Processing
   - Optional context inclusion based on mode
   - Template awareness when context mode active
   - Patient data integration in context mode
