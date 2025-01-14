export interface PatientFormData {
  name: string;           // Required
  dob: string;           // Required
  phone: string;         // Required
  email?: string;        // Optional
  address?: string;      // Optional
  medicalHistory?: string; // Optional
  medications?: string;    // Optional
}

export interface PatientFormProps {
  formData: PatientFormData;
  isLoading?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}