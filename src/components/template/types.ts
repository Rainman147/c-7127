export type Template = {
  id: string;
  name: string;
  description: string;
  systemInstructions: string;
};

export const templates: Template[] = [
  {
    id: "live-session",
    name: "Live Patient Session",
    description: "Real-time session with focus on symptoms and immediate observations. Perfect for capturing patient interactions as they happen.",
    systemInstructions: "Prioritize extracting symptoms, diagnoses, treatments, and test recommendations. Ignore non-relevant data unless a pattern emerges."
  },
  {
    id: "soap-standard",
    name: "SOAP Note (Standard)",
    description: "Structured format for patient encounters following the classic SOAP methodology: Subjective, Objective, Assessment, Plan.",
    systemInstructions: "Format output in SOAP format: Subjective, Objective, Assessment, Plan. Focus on clinical findings and treatment plans."
  },
  {
    id: "soap-expanded",
    name: "SOAP Note (Expanded)",
    description: "Comprehensive SOAP format including detailed vital signs, lab results, and extensive treatment planning sections.",
    systemInstructions: "Use expanded SOAP format including vital signs, lab results, and detailed treatment plans."
  },
  {
    id: "discharge",
    name: "Discharge Summary",
    description: "Complete discharge documentation including admission details, hospital course, and detailed follow-up instructions.",
    systemInstructions: "Focus on admission details, hospital course, and discharge instructions."
  },
  {
    id: "referral",
    name: "Referral Letter",
    description: "Professional specialist referral documentation with emphasis on reason for referral and relevant clinical history.",
    systemInstructions: "Emphasize reason for referral, relevant history, and specific consultation requests."
  }
];