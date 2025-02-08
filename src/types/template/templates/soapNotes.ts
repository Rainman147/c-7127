
import type { Template } from '../Template';

const soapSchema = {
  type: "object",
  properties: {
    soap: {
      type: "object",
      properties: {
        subjective: {
          type: "object",
          properties: {
            chiefComplaint: { type: "string" },
            historyOfPresentIllness: { type: "string" },
            reviewOfSystems: { type: "object" }
          },
          required: ["chiefComplaint", "historyOfPresentIllness"]
        },
        objective: {
          type: "object",
          properties: {
            vitalSigns: {
              type: "object",
              properties: {
                temperature: { type: "string" },
                bloodPressure: { type: "string" },
                heartRate: { type: "string" },
                respiratoryRate: { type: "string" }
              }
            },
            physicalExam: { type: "string" },
            labResults: { type: "array", items: { type: "string" } }
          },
          required: ["physicalExam"]
        },
        assessment: {
          type: "object",
          properties: {
            diagnoses: { type: "array", items: { type: "string" } },
            clinicalReasoning: { type: "string" }
          },
          required: ["diagnoses", "clinicalReasoning"]
        },
        plan: {
          type: "object",
          properties: {
            treatment: { type: "array", items: { type: "string" } },
            medications: { type: "array", items: { type: "string" } },
            followUp: { type: "string" },
            referrals: { type: "array", items: { type: "string" } }
          },
          required: ["treatment", "followUp"]
        }
      },
      required: ["subjective", "objective", "assessment", "plan"]
    }
  },
  required: ["soap"]
};

export const soapStandardTemplate: Template = {
  id: "soap-standard",
  name: "SOAP Note (Standard)",
  description: "Structured format for patient encounters following the classic SOAP methodology: Subjective, Objective, Assessment, Plan.",
  content: "Standard SOAP note template content",
  systemInstructions: "Format output in SOAP format: Subjective, Objective, Assessment, Plan. Focus on clinical findings and treatment plans.",
  schema: soapSchema
};

const expandedSoapSchema = {
  ...soapSchema,
  properties: {
    soap: {
      ...soapSchema.properties.soap,
      properties: {
        ...soapSchema.properties.soap.properties,
        subjective: {
          ...soapSchema.properties.soap.properties.subjective,
          properties: {
            ...soapSchema.properties.soap.properties.subjective.properties,
            pastMedicalHistory: { type: "string" },
            familyHistory: { type: "string" },
            socialHistory: { type: "string" },
            allergies: { type: "array", items: { type: "string" } }
          }
        },
        objective: {
          ...soapSchema.properties.soap.properties.objective,
          properties: {
            ...soapSchema.properties.soap.properties.objective.properties,
            imaging: { type: "array", items: { type: "string" } },
            specialtyExams: { type: "array", items: { type: "string" } }
          }
        }
      }
    }
  }
};

export const soapExpandedTemplate: Template = {
  id: "soap-expanded",
  name: "SOAP Note (Expanded)",
  description: "Comprehensive SOAP format including detailed vital signs, lab results, and extensive treatment planning sections.",
  content: "Expanded SOAP note template content",
  systemInstructions: "Use expanded SOAP format including vital signs, lab results, and detailed treatment plans.",
  schema: expandedSoapSchema
};

