
# Communication System

## 1. Team Messaging
```typescript
interface Message {
  id: string;
  sender: string;
  recipients: string[];
  priority: 'normal' | 'urgent' | 'critical';
  content: string;
  attachments: Attachment[];
  metadata: {
    patientContext?: string;
    caseReference?: string;
    requiredAction?: boolean;
  };
}
```

## 2. Task Management
```typescript
interface ClinicalTask {
  id: string;
  title: string;
  description: string;
  assignedBy: string;
  assignedTo: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  status: 'new' | 'in_progress' | 'completed' | 'blocked';
  patientId?: string;
  category: 'documentation' | 'followup' | 'procedure' | 'consultation';
}
```
