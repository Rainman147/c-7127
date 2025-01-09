import type { Template } from '../Template';

export const soapStandardTemplate: Template = {
  id: "soap-standard",
  name: "SOAP Note (Standard)",
  description: "Structured format for patient encounters following the classic SOAP methodology: Subjective, Objective, Assessment, Plan.",
  systemInstructions: "Format output in SOAP format: Subjective, Objective, Assessment, Plan. Focus on clinical findings and treatment plans."
};

export const soapExpandedTemplate: Template = {
  id: "soap-expanded",
  name: "SOAP Note (Expanded)",
  description: "Comprehensive SOAP format including detailed vital signs, lab results, and extensive treatment planning sections.",
  systemInstructions: "Use expanded SOAP format including vital signs, lab results, and detailed treatment plans."
};