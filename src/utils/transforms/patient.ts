
import type { DbPatient } from '@/types/database';
import type { Patient, PatientContext } from '@/types/patient';
import { parsePatientJson } from '@/types/patient';
import { Json } from '@/integrations/supabase/types';
import { CurrentMedications } from '@/types/database';

export const toFrontendPatient = (dbPatient: DbPatient): Patient => ({
  id: dbPatient.id,
  name: dbPatient.name,
  dob: dbPatient.dob,
  medicalHistory: dbPatient.medical_history,
  contactInfo: parsePatientJson(dbPatient.contact_info),
  address: dbPatient.address,
  currentMedications: parsePatientJson<CurrentMedications>(dbPatient.current_medications) || [],
  recentTests: parsePatientJson(dbPatient.recent_tests) || [],
  createdAt: dbPatient.created_at,
  updatedAt: dbPatient.updated_at,
  lastAccessed: dbPatient.last_accessed || undefined,
  userId: dbPatient.user_id
});

export const toDatabasePatient = (
  patient: Pick<Patient, 'name' | 'dob' | 'userId'> & Partial<Patient>
): Pick<DbPatient, 'name' | 'dob' | 'user_id'> & Partial<DbPatient> => {
  // Ensure medications follow the correct structure
  let currentMedications = patient.currentMedications;
  if (Array.isArray(currentMedications)) {
    currentMedications = currentMedications.map(med => {
      if (typeof med === 'string') {
        return {
          name: med,
          dosage: 'Not specified',
          frequency: 'Not specified'
        };
      }
      return med;
    });
  }

  return {
    name: patient.name,
    dob: patient.dob,
    medical_history: patient.medicalHistory,
    contact_info: patient.contactInfo as Json,
    address: patient.address,
    current_medications: currentMedications as Json,
    recent_tests: patient.recentTests as Json,
    user_id: patient.userId,
    last_accessed: patient.lastAccessed
  };
};

// Type guard for medication format
export const isValidMedication = (med: unknown): med is CurrentMedications[0] => {
  if (!med || typeof med !== 'object') return false;
  const medication = med as Record<string, unknown>;
  return (
    typeof medication.name === 'string' &&
    typeof medication.dosage === 'string' &&
    typeof medication.frequency === 'string'
  );
};
