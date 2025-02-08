
import { Patient } from '@/types';

interface PatientInfoProps {
  patient: Patient | null;
  isNew?: boolean;
}

interface ContactInfo {
  phone?: string;
  email?: string;
}

export const PatientInfo = ({ patient, isNew = false }: PatientInfoProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isNew || !patient) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Personal Information</h2>
        <div className="p-4 border rounded-lg bg-white/5">
          <p className="text-gray-500 italic">Please fill in patient information</p>
        </div>
      </div>
    );
  }

  const contactInfo = patient.contactInfo || {};

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Personal Information</h2>
      <div className="p-4 border rounded-lg bg-white/5">
        <p><strong>Date of Birth:</strong> {formatDate(patient.dob)}</p>
        {contactInfo.phone && (
          <p><strong>Phone:</strong> {contactInfo.phone}</p>
        )}
        {contactInfo.email && (
          <p><strong>Email:</strong> {contactInfo.email}</p>
        )}
        {patient.address && (
          <p><strong>Address:</strong> {patient.address}</p>
        )}
      </div>
    </div>
  );
};
