
import type { DbPatient } from '@/types/database';
import type { Patient, PatientContext } from '@/types/patient';
import { parsePatientJson } from '@/types/patient';

export const toFrontendPatient = (dbPatient: DbPatient): Patient => ({
  id: dbPatient.id,
  name: dbPatient.name,
  dob: dbPatient.dob,
  medicalHistory: dbPatient.medical_history,
  contactInfo: dbPatient.contact_info,
  address: dbPatient.address,
  currentMedications: dbPatient.current_medications,
  recentTests: dbPatient.recent_tests,
  createdAt: dbPatient.created_at,
  updatedAt: dbPatient.updated_at,
  userId: dbPatient.user_id
});

export const toDatabasePatient = (patient: Partial<Patient>): Partial<DbPatient> => ({
  name: patient.name,
  dob: patient.dob,
  medical_history: patient.medicalHistory,
  contact_info: patient.contactInfo,
  address: patient.address,
  current_medications: patient.currentMedications,
  recent_tests: patient.recentTests,
  user_id: patient.userId
});
