import type { Json } from "@/integrations/supabase/types";

export interface BusinessHours {
  [key: string]: { open: string; close: string } | null;
}

export interface DoctorProfileFormData {
  full_name: string;
  email: string;
  title: string;
  specialty: string;
  clinic_name: string;
  address: string;
  phone: string;
  license_number: string;
  profile_photo_url?: string;
  business_hours: BusinessHours;
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  title: string;
  specialty: string;
  clinic_name: string;
  address: string;
  phone: string;
  license_number: string;
  profile_photo_url: string | null;
  business_hours: Json;
  created_at: string;
  updated_at: string;
}