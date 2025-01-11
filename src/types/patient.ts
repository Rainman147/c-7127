import { Json } from '@/integrations/supabase/types';

export interface Patient {
  id: string;
  name: string;
  dob: string;
  medical_history?: string | null;
  contact_info?: Json;
  address?: string | null;
  current_medications?: Json;
  recent_tests?: Json;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface PatientContext {
  id: string;
  name: string;
  age: number;
  medicalHistory?: string;
  currentMedications: string[];
}

export const parsePatientJson = <T>(json: Json | null): T | null => {
  if (!json) return null;
  try {
    return typeof json === 'string' ? JSON.parse(json) : json as T;
  } catch {
    return null;
  }
};

export const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const formatPatientContext = (patient: Patient): PatientContext => {
  const medications = parsePatientJson<string[]>(patient.current_medications) || [];
  
  return {
    id: patient.id,
    name: patient.name,
    age: calculateAge(patient.dob),
    medicalHistory: patient.medical_history || undefined,
    currentMedications: medications,
  };
};