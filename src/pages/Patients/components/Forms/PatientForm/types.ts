export interface PatientFormData {
  name: string;
  dob: string;
  email: string;
  phone: string;
  address: string;
  medicalHistory: string;
  medications: string;
}

export interface PatientFormProps {
  formData: PatientFormData;
  isLoading?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}