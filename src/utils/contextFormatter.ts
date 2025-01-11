import { differenceInYears, parseISO } from 'date-fns';
import type { PatientContext, Template } from '@/types';

interface FormattedContext {
  systemInstructions: string;
  patientSummary?: string;
}

export const calculateAge = (dob: string): number => {
  const birthDate = parseISO(dob);
  return differenceInYears(new Date(), birthDate);
};

export const formatSystemContext = (
  template: Template | null,
  patientContext: PatientContext | null
): FormattedContext => {
  console.log('[contextFormatter] Formatting context with:', { template, patientContext });
  
  let systemInstructions = template?.systemInstructions || 'Process conversation using standard medical documentation format.';
  
  if (patientContext) {
    const patientSummary = `
Patient Information:
- Name: ${patientContext.name}
- Age: ${patientContext.age} years old
${patientContext.medicalHistory ? `- Medical History: ${patientContext.medicalHistory}` : ''}
${patientContext.currentMedications?.length ? `- Current Medications: ${patientContext.currentMedications.join(', ')}` : ''}
`;

    return {
      systemInstructions: `${systemInstructions}\n\n${patientSummary}`,
      patientSummary
    };
  }

  return { systemInstructions };
};