
# Chat Session Management

## Session Lifecycle

### Creation
- Temporary session created in memory
- UUID assigned
- Default title "New Chat"
- Optimistic UI update

### Persistence
- Session stored in database upon first message
- Temporary flag removed
- Real-time update broadcasted

### Updates
- Title updates
- Last message tracking
- Modified timestamp maintenance

## Real-time Session Management
- Supabase channel subscription
- Event types: INSERT, DELETE, UPDATE
- Optimistic state updates
- Clean disconnection handling

## Session Operations
1. Create Session
   - Temporary UUID assignment
   - User authentication check
   - Error handling with toast notifications

2. Persist Session
   - Database insertion
   - Temporary to permanent transition
   - Error recovery

3. Delete Session
   - Temporary session cleanup
   - Database record removal
   - Real-time notification

4. Rename Session
   - Title update handling
   - Temporary vs permanent logic
   - Optimistic UI update
