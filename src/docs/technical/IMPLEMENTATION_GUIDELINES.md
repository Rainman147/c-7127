
# Implementation Guidelines

## Performance Optimization

### Large File Processing
```typescript
// Implement chunked processing for files > 10MB
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const processLargeFile = async (file: File) => {
  const chunks = Math.ceil(file.size / CHUNK_SIZE);
  for (let i = 0; i < chunks; i++) {
    const chunk = file.slice(
      i * CHUNK_SIZE,
      Math.min((i + 1) * CHUNK_SIZE, file.size)
    );
    await processChunk(chunk);
  }
};
```

### Real-time Feature Implementation
```typescript
// Implement fallback strategy for real-time features
const setupRealtimeConnection = (fallbackInterval = 5000) => {
  try {
    // Primary real-time connection
    const subscription = supabase
      .channel('table_changes')
      .subscribe();
    
    return subscription;
  } catch (error) {
    // Fallback to polling
    return setInterval(fetchUpdates, fallbackInterval);
  }
};
```

### Cache Management
```typescript
// Implement cache with size and time limits
const cache = new Map();
const MAX_CACHE_SIZE = 100;
const MAX_CACHE_AGE = 5 * 60 * 1000; // 5 minutes

const getCachedValue = (key: string) => {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() - item.timestamp > MAX_CACHE_AGE) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
};
```

## Error Handling Strategies

### API Rate Limiting
```typescript
// Implement rate limit handling
const makeApiRequest = async (endpoint: string, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(endpoint);
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        await new Promise(resolve => 
          setTimeout(resolve, (parseInt(retryAfter) || 60) * 1000)
        );
        continue;
      }
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
};
```

### Connection Management
```typescript
// Implement connection pooling
const connectionPool = {
  maxSize: 20,
  connections: new Set(),
  async acquire() {
    while (this.connections.size >= this.maxSize) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const connection = await createConnection();
    this.connections.add(connection);
    return connection;
  },
  release(connection) {
    this.connections.delete(connection);
    connection.close();
  }
};
```

## Security Implementation

### Data Encryption
```typescript
// Implement client-side encryption
const encryptData = async (data: string, key: CryptoKey) => {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);
  
  return await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
    key,
    encoded
  );
};
```

### Audit Logging
```typescript
// Implement HIPAA-compliant audit logging
const auditLog = async (
  action: string,
  resourceType: string,
  resourceId: string,
  userId: string
) => {
  await supabase.from('audit_logs').insert({
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    user_id: userId,
    timestamp: new Date().toISOString(),
    ip_address: await getCurrentIp(),
    user_agent: navigator.userAgent
  });
};
```

## Integration Patterns

### EMR Integration
```typescript
// Implement EMR data synchronization
const syncWithEMR = async (data: PatientData) => {
  const batchSize = 100;
  const batches = chunk(data, batchSize);
  
  for (const batch of batches) {
    await Promise.all(
      batch.map(async record => {
        try {
          await emrClient.upsert(record);
        } catch (error) {
          await logSyncError(error, record);
          throw error;
        }
      })
    );
  }
};
```

### Device Data Integration
```typescript
// Implement medical device data handling
const processDeviceData = async (deviceData: DeviceReading[]) => {
  const validReadings = deviceData.filter(reading => 
    isValidReading(reading) && 
    isWithinThreshold(reading)
  );
  
  if (validReadings.length > 1000) {
    return processBatch(validReadings);
  }
  
  return processIndividual(validReadings);
};
```

## Performance Monitoring

### Metrics Collection
```typescript
// Implement performance metrics collection
const trackPerformance = (metric: string, value: number) => {
  if (performance.memory.usedJSHeapSize > 512 * 1024 * 1024) {
    console.warn('Memory usage exceeding limits');
  }
  
  performance.mark(metric);
  // Store metric for analysis
};
```

### Error Tracking
```typescript
// Implement error boundary with rate limiting
class ErrorBoundary extends React.Component {
  private errorCount = 0;
  private lastError = 0;
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const now = Date.now();
    if (now - this.lastError < 60000) {
      this.errorCount++;
    } else {
      this.errorCount = 1;
    }
    
    if (this.errorCount <= 100) {
      logError(error, errorInfo);
    }
    
    this.lastError = now;
  }
}
```
