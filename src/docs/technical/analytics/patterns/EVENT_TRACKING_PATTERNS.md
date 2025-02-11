
# Event Tracking Patterns

## Clinical Event Capture
```typescript
interface ClinicalEvent {
  patientId: string;
  eventType: 'visit' | 'prescription' | 'procedure' | 'note';
  metadata: {
    timestamp: string;
    provider: string;
    location: string;
    details: Record<string, unknown>;
  };
  context: {
    sessionId: string;
    sourceSystem: string;
  };
}

// Example Implementation
const trackClinicalEvent = async (event: ClinicalEvent) => {
  // Validate HIPAA compliance
  if (!validateHIPAACompliance(event)) {
    throw new Error('Event does not meet HIPAA requirements');
  }
  
  // Sanitize and anonymize data
  const sanitizedEvent = sanitizeEventData(event);
  
  // Record event
  await recordAnalyticsEvent(sanitizedEvent);
};
```

## User Interaction Tracking
```typescript
interface UserInteractionEvent {
  userId: string;
  action: 'view' | 'edit' | 'create' | 'delete';
  resource: {
    type: string;
    id: string;
  };
  timestamp: string;
  metadata: Record<string, unknown>;
}
```
