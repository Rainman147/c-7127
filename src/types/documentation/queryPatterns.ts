/**
 * Query Patterns Documentation
 * Version: 1.0.0
 * 
 * This document outlines the standard query patterns used throughout the application
 * using TanStack Query (React Query) v5.
 */

/**
 * 1. Query Key Structure
 * 
 * Hierarchical key structure for proper cache management:
 * 
 * messages
 * ├─ all: ['messages']
 * ├─ list: ['messages', 'list']
 * ├─ chat: ['messages', chatId]
 * └─ detail: ['messages', chatId, messageId]
 * 
 * templates
 * ├─ all: ['templates']
 * ├─ active: ['templates', 'active']
 * └─ detail: ['templates', templateId]
 * 
 * patients
 * ├─ all: ['patients']
 * ├─ search: ['patients', 'search', searchTerm]
 * └─ detail: ['patients', patientId]
 */

/**
 * 2. Cache Configuration
 * 
 * Standard cache settings:
 * 
 * ├─ Messages
 * │  ├─ staleTime: 1000 * 60 * 5 (5 minutes)
 * │  ├─ gcTime: 1000 * 60 * 30 (30 minutes)
 * │  └─ retry: 3
 * │
 * ├─ Templates
 * │  ├─ staleTime: 1000 * 60 * 15 (15 minutes)
 * │  ├─ gcTime: 1000 * 60 * 60 (1 hour)
 * │  └─ retry: 2
 * │
 * └─ Patients
 *    ├─ staleTime: 1000 * 60 * 10 (10 minutes)
 *    ├─ gcTime: 1000 * 60 * 45 (45 minutes)
 *    └─ retry: 2
 */

/**
 * 3. Optimistic Updates
 * 
 * Standard patterns for optimistic updates:
 * 
 * ├─ Message Sending
 * │  ├─ Optimistically add message to chat
 * │  ├─ Update chat timestamp
 * │  └─ Revert on error
 * │
 * ├─ Template Editing
 * │  ├─ Optimistically update template
 * │  ├─ Update version number
 * │  └─ Revert on error
 * │
 * └─ Patient Updates
 *    ├─ Optimistically update patient data
 *    ├─ Update lastAccessed timestamp
 *    └─ Revert on error
 */

/**
 * 4. Error Handling
 * 
 * Standard error handling patterns:
 * 
 * ├─ Query Errors
 * │  ├─ Toast notifications
 * │  ├─ Error boundaries
 * │  └─ Retry logic
 * │
 * ├─ Mutation Errors
 * │  ├─ Optimistic update rollback
 * │  ├─ Error state management
 * │  └─ User feedback
 * │
 * └─ Network Errors
 *    ├─ Offline detection
 *    ├─ Retry strategies
 *    └─ Queue management
 */

/**
 * 5. Prefetching Strategy
 * 
 * Data prefetching patterns:
 * 
 * ├─ Route-based Prefetching
 * │  ├─ Chat history on sidebar hover
 * │  ├─ Patient details on selection
 * │  └─ Template data on modal open
 * │
 * ├─ Parallel Queries
 * │  ├─ Chat with template context
 * │  ├─ Messages with patient data
 * │  └─ Templates with metadata
 * │
 * └─ Sequential Queries
 *    ├─ Auth before data
 *    ├─ Patient before chat
 *    └─ Template before message
 */

/**
 * 6. Subscription Integration
 * 
 * Real-time update patterns:
 * 
 * ├─ Message Updates
 * │  ├─ WebSocket connection
 * │  ├─ Cache invalidation
 * │  └─ Optimistic merge
 * │
 * ├─ Template Changes
 * │  ├─ Version tracking
 * │  ├─ Cache updates
 * │  └─ Conflict resolution
 * │
 * └─ Patient Data
 *    ├─ Real-time status
 *    ├─ Cache synchronization
 *    └─ Presence handling
 */

// Type definitions for documentation metadata
export interface QueryPatternsDocumentation {
  version: string;
  lastUpdated: string;
  maintainer: string;
  sections: {
    queryKeys: boolean;
    cacheConfig: boolean;
    optimisticUpdates: boolean;
    errorHandling: boolean;
    prefetching: boolean;
    subscriptions: boolean;
  };
}

// Documentation metadata
export const queryPatternsDoc: QueryPatternsDocumentation = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  maintainer: 'Development Team',
  sections: {
    queryKeys: true,
    cacheConfig: true,
    optimisticUpdates: true,
    errorHandling: true,
    prefetching: true,
    subscriptions: true,
  },
};