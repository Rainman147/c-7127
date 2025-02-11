
# Clinical Workflows

## 1. Morning Rounds
```typescript
interface RoundSession {
  id: string;
  date: string;
  doctor: string;
  patients: PatientRound[];
  status: 'planned' | 'in_progress' | 'completed';
  notes: RoundNote[];
}

interface PatientRound {
  patientId: string;
  order: number;
  status: 'pending' | 'seen' | 'skipped';
  plannedDuration: number;
  actualDuration?: number;
  vitals: VitalSigns;
  tasks: RoundTask[];
}
```

## 2. Follow-up Management
```typescript
interface FollowUp {
  id: string;
  patientId: string;
  type: 'routine' | 'urgent' | 'post_procedure';
  scheduledDate: string;
  assignedTo: string;
  status: 'scheduled' | 'completed' | 'missed';
  prerequisites: Prerequisite[];
}

interface Prerequisite {
  type: 'test' | 'consultation' | 'medication';
  description: string;
  status: 'pending' | 'completed';
  dueDate: string;
}
```
