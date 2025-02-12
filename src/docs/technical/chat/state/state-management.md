
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

## Session State
1. Active Session
   - Current messages
   - Template context
   - Patient context
   - Real-time status

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
