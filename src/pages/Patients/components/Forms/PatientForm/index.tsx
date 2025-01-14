import { FormSection } from "../components/FormSection";
import { PersonalInfoFields } from "../../NewPatient/FormSections/PersonalInfoFields";
import { ContactFields } from "../../NewPatient/FormSections/ContactFields";
import { MedicalHistoryField } from "../../NewPatient/FormSections/MedicalHistoryField";
import type { PatientFormProps } from "./types";

export const PatientForm = ({ 
  formData, 
  isLoading, 
  onSubmit, 
  handleInputChange,
}: PatientFormProps) => {
  console.log('[PatientForm] Rendering with formData:', formData);
  
  return (
    <form id="new-patient-form" onSubmit={onSubmit} className="space-y-6">
      <div className="max-h-[60vh] overflow-y-auto modal-content-scrollbar space-y-6 py-4">
        <FormSection>
          <PersonalInfoFields
            name={formData.name}
            dob={formData.dob}
            onChange={handleInputChange}
          />
        </FormSection>

        <FormSection>
          <ContactFields
            email={formData.email}
            phone={formData.phone}
            address={formData.address}
            medications={formData.medications}
            onChange={handleInputChange}
          />
        </FormSection>

        <FormSection>
          <MedicalHistoryField
            medicalHistory={formData.medicalHistory}
            onChange={handleInputChange}
          />
        </FormSection>
      </div>
    </form>
  );
};