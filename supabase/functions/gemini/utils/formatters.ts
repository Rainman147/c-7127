interface Patient {
  name: string;
  dob: string;
  medical_history?: string | null;
  current_medications?: string[] | null;
}

export function formatPatientContext(patient: Patient): string {
  const age = calculateAge(patient.dob);
  const medications = Array.isArray(patient.current_medications) 
    ? patient.current_medications.join(', ') 
    : 'None';

  return `Patient Information:
Name: ${patient.name}
Age: ${age} years old
Medical History: ${patient.medical_history || 'None'}
Current Medications: ${medications}`;
}

function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}