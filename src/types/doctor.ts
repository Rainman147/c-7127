
import type { BusinessHours } from './database';

export interface Doctor {
  id: string;
  userId: string;
  fullName?: string | null;
  email?: string | null;
  phone: string;
  address: string;
  clinicName: string;
  title: string;
  specialty: string;
  licenseNumber: string;
  businessHours: BusinessHours;
  profilePhotoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorProfile extends Omit<Doctor, 'userId' | 'createdAt' | 'updatedAt'> {
  availability?: {
    nextAvailable: string;
    slots: string[];
  };
}
