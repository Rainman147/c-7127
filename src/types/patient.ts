
import type { Json } from '@/integrations/supabase/types';
import type { ContactInfo, CurrentMedications, RecentTests } from './database';

export interface Patient {
  id: string;
  name: string;
  dob: string;
  medicalHistory?: string | null;
  contactInfo?: ContactInfo;
  address?: string | null;
  currentMedications?: CurrentMedications;
  recentTests?: RecentTests;
  createdAt: string;
  updatedAt: string;
  lastAccessed?: string;
  userId: string;
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
  const medications = Array.isArray(patient.currentMedications) 
    ? patient.currentMedications.map(med => med.name)
    : [];
  
  return {
    id: patient.id,
    name: patient.name,
    age: calculateAge(patient.dob),
    medicalHistory: patient.medicalHistory || undefined,
    currentMedications: medications,
  };
};
