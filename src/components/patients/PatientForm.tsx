import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePatientManagement } from '@/hooks/usePatientManagement';
import { PatientBasicInfo } from './form/PatientBasicInfo';
import { PatientContactInfo } from './form/PatientContactInfo';
import { PatientMedicalInfo } from './form/PatientMedicalInfo';
import type { Patient } from '@/types/database/patients';

interface PatientFormProps {
  patient?: Patient;
  onClose?: () => void;
  onSubmit?: () => void;
}

export const PatientForm = ({ patient, onClose, onSubmit }: PatientFormProps) => {
  const { toast } = useToast();
  const { addPatient } = usePatientManagement();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState(patient?.name || '');
  const [dob, setDob] = useState(patient?.dob || '');
  const [address, setAddress] = useState(patient?.address || '');
  const [medicalHistory, setMedicalHistory] = useState(patient?.medical_history || '');
  const [contactInfo, setContactInfo] = useState({
    email: (patient?.contact_info as { email: string })?.email || '',
    phone: (patient?.contact_info as { phone: string })?.phone || '',
  });
  const [currentMedications, setCurrentMedications] = useState(patient?.current_medications || []);
  const [recentTests, setRecentTests] = useState(patient?.recent_tests || []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await addPatient(
        name,
        dob,
        contactInfo,
        medicalHistory,
        currentMedications,
        recentTests,
        address
      );

      if (result) {
        toast({
          title: "Success",
          description: "Patient added successfully",
          variant: "default"
        });
        onSubmit?.();
      }
    } catch (error) {
      console.error('Error adding patient:', error);
      toast({
        title: "Error",
        description: "Failed to add patient",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="menu-dialog-content flex-grow dialog-scrollbar">
        <PatientBasicInfo
          name={name}
          dob={dob}
          address={address}
          onNameChange={setName}
          onDobChange={setDob}
          onAddressChange={setAddress}
        />

        <PatientContactInfo
          email={contactInfo.email}
          phone={contactInfo.phone}
          onEmailChange={(email) => setContactInfo(prev => ({ ...prev, email }))}
          onPhoneChange={(phone) => setContactInfo(prev => ({ ...prev, phone }))}
        />

        <PatientMedicalInfo
          medicalHistory={medicalHistory}
          onMedicalHistoryChange={setMedicalHistory}
        />
      </div>

      <div className="menu-dialog-footer">
        <button 
          type="button" 
          onClick={onClose} 
          className="btn-secondary"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="btn-primary"
        >
          {isSubmitting ? 'Adding Patient...' : 'Save'}
        </button>
      </div>
    </form>
  );
};