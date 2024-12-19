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
  business_hours: {
    [key: string]: { open: string; close: string } | null;
  };
}