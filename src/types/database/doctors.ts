import { Json } from './common';

export interface Doctor {
  id: string;
  user_id: string;
  title: string;
  specialty: string;
  clinic_name: string;
  address: string;
  phone: string;
  license_number: string;
  created_at: string;
  updated_at: string;
  profile_photo_url?: string;
  business_hours: Json;
  full_name?: string;
  email?: string;
}

export interface DoctorInsert extends Omit<Doctor, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DoctorUpdate extends Partial<DoctorInsert> {}