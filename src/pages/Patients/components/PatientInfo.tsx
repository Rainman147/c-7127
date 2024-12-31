import { Patient } from '@/types';

interface PatientInfoProps {
  patient: Patient;
}

export const PatientInfo = ({ patient }: PatientInfoProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Personal Information</h2>
      <div className="p-4 border rounded-lg bg-white/5">
        <p><strong>Date of Birth:</strong> {formatDate(patient.dob)}</p>
        {patient.contact_info?.phone && (
          <p><strong>Phone:</strong> {patient.contact_info.phone}</p>
        )}
        {patient.contact_info?.email && (
          <p><strong>Email:</strong> {patient.contact_info.email}</p>
        )}
        {patient.address && (
          <p><strong>Address:</strong> {patient.address}</p>
        )}
      </div>
    </div>
  );
};