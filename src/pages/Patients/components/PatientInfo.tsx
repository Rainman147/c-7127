import { Patient } from '@/types';
import { parseSupabaseJson } from '@/types';

interface PatientInfoProps {
  patient: Patient;
}

export const PatientInfo = ({ patient }: PatientInfoProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const contactInfo = parseSupabaseJson<{
    phone?: string;
    email?: string;
  }>(patient.contact_info);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Personal Information</h2>
      <div className="p-4 border rounded-lg bg-white/5">
        <p><strong>Date of Birth:</strong> {formatDate(patient.dob)}</p>
        {contactInfo?.phone && (
          <p><strong>Phone:</strong> {contactInfo.phone}</p>
        )}
        {contactInfo?.email && (
          <p><strong>Email:</strong> {contactInfo.email}</p>
        )}
        {patient.address && (
          <p><strong>Address:</strong> {patient.address}</p>
        )}
      </div>
    </div>
  );
};