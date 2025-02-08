
import type { DbPatient } from '@/types/database';
import type { Patient, PatientContext } from '@/types/patient';
import { parsePatientJson } from '@/types/patient';
import { Json } from '@/integrations/supabase/types';

export const toFrontendPatient = (dbPatient: DbPatient): Patient => ({
  id: dbPatient.id,
  name: dbPatient.name,
  dob: dbPatient.dob,
  medicalHistory: dbPatient.medical_history,
  contactInfo: parsePatientJson<Patient['contactInfo']>(dbPatient.contact_info),
  address: dbPatient.address,
  currentMedications: parsePatientJson<Patient['currentMedications']>(dbPatient.current_medications) || [],
  recentTests: parsePatientJson<Patient['recentTests']>(dbPatient.recent_tests) || [],
  createdAt: dbPatient.created_at,
  updatedAt: dbPatient.updated_at,
  lastAccessed: dbPatient.last_accessed || undefined,
  userId: dbPatient.user_id
});

export const toDatabasePatient = (patient: Partial<Patient>): Partial<DbPatient> => ({
  name: patient.name,
  dob: patient.dob,
  medical_history: patient.medicalHistory,
  contact_info: patient.contactInfo as Json,
  address: patient.address,
  current_medications: patient.currentMedications as Json,
  recent_tests: patient.recentTests as Json,
  user_id: patient.userId,
  last_accessed: patient.lastAccessed
});
