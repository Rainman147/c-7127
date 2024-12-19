import { Json } from './common';

interface ContactInfo {
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface Patient {
  id: string;
  user_id: string;
  name: string;
  dob: string;
  contact_info?: ContactInfo;
  medical_history?: string;
  current_medications?: Json[];
  recent_tests?: Json[];
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface PatientInsert extends Omit<Patient, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PatientUpdate extends Partial<PatientInsert> {}