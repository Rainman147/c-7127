
# Performance Optimization Patterns

## Caching Strategy
```typescript
interface CacheConfig {
  ttl: number;
  maxSize: number;
  updateFrequency: number;
  invalidationRules: {
    onUpdate: boolean;
    dependencies: string[];
  };
}

// Example Implementation
const cacheAnalyticsData = async (
  key: string,
  data: unknown,
  config: CacheConfig
) => {
  // Set cache with TTL
  await cache.set(key, data, {
    ttl: config.ttl,
    maxSize: config.maxSize
  });
  
  // Set up invalidation
  if (config.invalidationRules.onUpdate) {
    await setupInvalidationTriggers(key, config.invalidationRules);
  }
};
```
