
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
   - patient_id (foreign key to patients)
   - change_type (enum: 'update', 'medication', 'visit', 'test')
   - previous_state (jsonb)
   - new_state (jsonb)
   - timestamp
   - modified_by (user_id)
   - notes

2. **vital_signs**
   - patient_id (foreign key to patients)
   - type (blood_pressure, heart_rate, temperature, etc.)
   - value
   - unit
   - timestamp
   - taken_by (user_id)
   - notes
   - normal_range_min
   - normal_range_max

3. **medication_timeline**
   - patient_id (foreign key to patients)
   - medication_name
   - dosage
   - frequency
   - start_date
   - end_date
   - prescribing_doctor (foreign key to doctors)
   - effectiveness_rating
   - side_effects
   - notes

### Documentation System
#### Enhancements to Existing Tables
1. **templates**
   - Add version_number (integer)
   - Add parent_template_id (self-referencing foreign key)
   - Add template_category (enum)
   - Add validation_rules (jsonb)
   - Add ai_prompt_context (text)

2. **messages**
   - Add message_category (enum)
   - Add parent_message_id (self-referencing foreign key)
   - Add extracted_data (jsonb)
   - Add completion_tokens (integer)
   - Add prompt_tokens (integer)

## Phase 2: Intelligence Layer

### Clinical Context Engine
#### New Tables Required
1. **clinical_patterns**
   - pattern_name
   - pattern_type (diagnosis, treatment, follow-up)
   - recognition_rules (jsonb)
   - validation_criteria (jsonb)
   - severity_level
   - automated_actions (jsonb)
   - created_by (user_id)
   - last_modified
   - is_active

2. **trend_analysis**
   - patient_id (foreign key to patients)
   - analysis_type
   - time_period_start
   - time_period_end
   - data_points (jsonb)
   - computed_trends (jsonb)
   - confidence_score
   - last_updated
   - next_analysis_due

### Patient Monitoring
#### New Tables Required
1. **monitoring_rules**
   - rule_name
   - patient_id (foreign key to patients)
   - condition_type
   - alert_threshold
   - notification_settings (jsonb)
   - created_by (user_id)
   - is_active

2. **alert_history**
   - rule_id (foreign key to monitoring_rules)
   - triggered_at
   - alert_type
   - severity_level
   - data_snapshot (jsonb)
   - handled_by (user_id)
   - resolution_notes

## Phase 3: Integration Enhancement

### EMR Integration
#### New Tables Required
1. **ehr_mappings**
   - source_system
   - target_system
   - field_mappings (jsonb)
   - transformation_rules (jsonb)
   - validation_criteria (jsonb)
   - is_active

2. **integration_logs**
   - integration_type
   - source_system
   - target_system
   - status
   - error_details
   - request_payload
   - response_payload
   - processing_time

## Implementation Guidelines
- All tables must implement row-level security
- Use appropriate indexing strategies
- Implement proper foreign key relationships
- Maintain audit trails
- Follow naming conventions

## Migration Strategy
1. Create new tables without breaking existing functionality
2. Add new columns with appropriate defaults
3. Backfill data where necessary
4. Update application code to use new schema
5. Remove deprecated columns/tables after transition period

## Performance Considerations
- Implement partitioning for large tables
- Use materialized views for complex queries
- Set up appropriate caching strategies
- Monitor query performance
- Implement cleanup jobs for old data

