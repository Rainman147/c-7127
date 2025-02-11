
# Compliance Monitoring Integration Examples

## Audit Trail Implementation
```typescript
interface AuditEntry {
  timestamp: string;
  actor: {
    id: string;
    role: string;
  };
  action: {
    type: string;
    target: string;
    details: Record<string, unknown>;
  };
  context: {
    location: string;
    system: string;
    session: string;
  };
  compliance: {
    hipaaRelevant: boolean;
    dataAccessed: string[];
    purposeOfUse: string;
  };
}

// Example Implementation
const recordAuditEntry = async (entry: AuditEntry) => {
  // Validate compliance requirements
  if (!validateCompliance(entry)) {
    throw new Error('Compliance validation failed');
  }
  
  // Record audit entry
  await storeAuditEntry(entry);
  
  // Check for suspicious patterns
  await detectAnomalies(entry);
};
```
