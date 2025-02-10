
# Database Evolution Specification

## Current Schema
Our application uses Supabase as the primary database, with the following core tables:

### Core Tables
1. patients
2. chats
3. messages
4. templates
5. doctors
6. ehr_exports

## Phase 1: Foundation Enhancement

### Patient Context System
#### New Tables Required
1. **patient_history**
   - Temporal tracking of patient data changes
   - Versioning of medical records
   - Visit history

2. **vital_signs**
   - Tracking of key vital measurements
   - Timestamp-based recording
   - Normal range specifications

3. **medication_timeline**
   - Medication tracking
   - Effectiveness monitoring
   - Side effect reporting

### Documentation System
#### Enhancements to Existing Tables
1. **templates**
   - Add support for context-aware prompting
   - Enhanced metadata storage
   - Template versioning

2. **messages**
   - Improved categorization
   - Enhanced context linking
   - Structured data extraction

## Phase 2: Intelligence Layer

### Clinical Context Engine
#### New Tables Required
1. **clinical_patterns**
   - Pattern definition storage
   - Recognition rules
   - Validation criteria

2. **trend_analysis**
   - Data point storage
   - Analysis parameters
   - Result caching

## Implementation Guidelines
- All tables must implement row-level security
- Use appropriate indexing strategies
- Implement proper foreign key relationships
- Maintain audit trails
- Follow naming conventions as specified in [CONVENTIONS.md](../CONVENTIONS.md)
