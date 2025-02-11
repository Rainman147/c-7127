
# Documentation Review System

## 1. Review Process
```typescript
interface DocumentReview {
  id: string;
  documentId: string;
  reviewerId: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  comments: ReviewComment[];
  metadata: {
    version: string;
    timeSpent: number;
    completeness: number;
  };
}

interface ReviewComment {
  id: string;
  section: string;
  content: string;
  type: 'correction' | 'suggestion' | 'question';
  resolved: boolean;
}
```
