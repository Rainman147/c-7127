import React from 'react';
import { PersonalInfoFields } from './FormSections/PersonalInfoFields';
import { ContactFields } from './FormSections/ContactFields';
import { MedicalHistoryField } from './FormSections/MedicalHistoryField';

interface PatientFormFieldsProps {
  formData: {
    name: string;
    dob: string;
    email: string;
    phone: string;
    address: string;
    medicalHistory: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const PatientFormFields = ({ formData, handleInputChange }: PatientFormFieldsProps) => {
  return (
    <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto modal-content-scrollbar">
      <PersonalInfoFields
        name={formData.name}
        dob={formData.dob}
        onChange={handleInputChange}
      />
      
      <ContactFields
        email={formData.email}
        phone={formData.phone}
        address={formData.address}
        onChange={handleInputChange}
      />
      
      <MedicalHistoryField
        medicalHistory={formData.medicalHistory}
        onChange={handleInputChange}
      />
    </div>
  );
};