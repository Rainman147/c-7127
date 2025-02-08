
import { Patient } from '@/types';

interface PatientInfoProps {
  patient: Patient | null;
  isNew?: boolean;
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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Personal Information</h2>
      <div className="p-4 border rounded-lg bg-white/5">
        <p><strong>Date of Birth:</strong> {formatDate(patient.dob)}</p>
        {patient.contactInfo?.phone && (
          <p><strong>Phone:</strong> {patient.contactInfo.phone}</p>
        )}
        {patient.contactInfo?.email && (
          <p><strong>Email:</strong> {patient.contactInfo.email}</p>
        )}
        {patient.address && (
          <p><strong>Address:</strong> {patient.address}</p>
        )}
        {patient.contactInfo?.emergency_contact && (
          <div className="mt-2">
            <p><strong>Emergency Contact:</strong></p>
            <p className="ml-4">
              {patient.contactInfo.emergency_contact.name} ({patient.contactInfo.emergency_contact.relationship})
              <br />
              {patient.contactInfo.emergency_contact.phone}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
