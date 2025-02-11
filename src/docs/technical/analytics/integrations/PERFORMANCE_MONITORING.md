
# Performance Monitoring Integration Examples

## System Health Tracking
```typescript
interface SystemHealthMetrics {
  timestamp: string;
  components: Record<string, {
    status: 'healthy' | 'degraded' | 'down';
    metrics: {
      responseTime: number;
      errorRate: number;
      resourceUsage: Record<string, number>;
    };
  }>;
  alerts: Array<{
    severity: 'low' | 'medium' | 'high';
    message: string;
    context: Record<string, unknown>;
  }>;
}

// Example Implementation
const trackSystemHealth = async (): Promise<SystemHealthMetrics> => {
  // Collect component metrics
  const components = await getComponentMetrics();
  
  // Check for alerts
  const alerts = await checkAlertConditions(components);
  
  return {
    timestamp: new Date().toISOString(),
    components,
    alerts
  };
};
```
