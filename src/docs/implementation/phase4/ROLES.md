
# Role-Based Access System

## 1. Role Definitions
```typescript
interface UserRole {
  id: string;
  name: 'doctor' | 'nurse' | 'pa';
  permissions: Permission[];
  customViews: ViewConfiguration[];
}

interface Permission {
  resource: string;
  actions: ('read' | 'write' | 'delete')[];
  constraints?: {
    timeRestriction?: string;
    departmentLimit?: string[];
  };
}
```

## 2. View Customization
```typescript
interface ViewConfiguration {
  layout: 'summary' | 'detailed' | 'compact';
  priorityItems: string[];
  defaultFilters: Record<string, unknown>;
  quickActions: QuickAction[];
}

interface QuickAction {
  id: string;
  label: string;
  type: 'button' | 'link';
  action: string;
  requiredPermissions: string[];
}
```
