
# Data Collection Patterns

## Batch Processing Pattern
```typescript
interface AnalyticsBatch {
  batchId: string;
  events: Array<ClinicalEvent | UserInteractionEvent>;
  metadata: {
    timestamp: string;
    source: string;
    size: number;
  };
}

// Example Implementation
const processBatch = async (batch: AnalyticsBatch) => {
  // Validate batch
  if (!validateBatch(batch)) {
    throw new Error('Invalid batch format');
  }
  
  // Process events
  const processedEvents = await Promise.all(
    batch.events.map(async (event) => {
      // Process individual event
      return processEvent(event);
    })
  );
  
  // Store results
  await storeBatchResults(processedEvents);
};
```
