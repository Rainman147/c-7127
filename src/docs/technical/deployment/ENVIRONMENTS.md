
# Deployment Environments

## Development
```typescript
const devConfig = {
  database: 'development_db',
  apiEndpoint: 'dev-api.cardiology-assistant.com',
  featureFlags: {
    enableNewFeatures: true,
    debugMode: true
  }
};
```

## Staging
```typescript
const stagingConfig = {
  database: 'staging_db',
  apiEndpoint: 'staging-api.cardiology-assistant.com',
  featureFlags: {
    enableNewFeatures: true,
    debugMode: false
  }
};
```

## Production
```typescript
const productionConfig = {
  database: 'production_db',
  apiEndpoint: 'api.cardiology-assistant.com',
  featureFlags: {
    enableNewFeatures: false,
    debugMode: false
  }
};
```
