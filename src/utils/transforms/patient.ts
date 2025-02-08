
import type { DbPatient } from '@/types/database';
import type { Patient, PatientContext } from '@/types/patient';
import { parsePatientJson } from '@/types/patient';
import { Json } from '@/integrations/supabase/types';

export const toFrontendPatient = (dbPatient: DbPatient): Patient => ({
  id: dbPatient.id,
  name: dbPatient.name,
  dob: dbPatient.dob,
  medicalHistory: dbPatient.medical_history,
  contactInfo: parsePatientJson(dbPatient.contact_info),
  address: dbPatient.address,
  currentMedications: parsePatientJson(dbPatient.current_medications) || [],
  recentTests: parsePatientJson(dbPatient.recent_tests) || [],
  createdAt: dbPatient.created_at,
  updatedAt: dbPatient.updated_at,
  lastAccessed: dbPatient.last_accessed || undefined,
  userId: dbPatient.user_id
});

export const toDatabasePatient = (patient: Partial<Patient>): Partial<DbPatient> => {
  // Convert medications from string[] to proper format if needed
  let currentMedications = patient.currentMedications;
  if (Array.isArray(currentMedications) && typeof currentMedications[0] === 'string') {
    currentMedications = (currentMedications as string[]).map(name => ({
      name,
      dosage: 'Not specified',
      frequency: 'Not specified'
    }));
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
