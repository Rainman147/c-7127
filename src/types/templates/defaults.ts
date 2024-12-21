import type { Template } from './base';

export const defaultTemplates: Template[] = [
  {
    id: "live-session",
    name: "Live Patient Session",
    description: "Real-time session with focus on symptoms and immediate observations.",
    systemInstructions: "Live Patient Session Template - Revised System Instructions...",
    content: "Live Patient Session Template - Revised System Instructions...",
    instructions: {
      dataFormatting: "Standard medical formatting",
      priorityRules: "Prioritize critical symptoms",
      specialConditions: "Note any urgent conditions"
    },
    schema: {
      sections: ["Chief Complaint", "History", "Examination", "Assessment", "Plan"],
      requiredFields: ["symptoms", "vitals"]
    }
  },
  {
    id: "soap-standard",
    name: "SOAP Note (Standard)",
    description: "Structured format for patient encounters following the classic SOAP methodology: Subjective, Objective, Assessment, Plan.",
    systemInstructions: "Format output in SOAP format: Subjective, Objective, Assessment, Plan. Focus on clinical findings and treatment plans.",
    content: "Format output in SOAP format: Subjective, Objective, Assessment, Plan. Focus on clinical findings and treatment plans.",
    instructions: {
      dataFormatting: "SOAP format",
      priorityRules: "Follow SOAP order",
      specialConditions: "Note critical findings"
    },
    schema: {
      sections: ["Subjective", "Objective", "Assessment", "Plan"],
      requiredFields: ["chiefComplaint", "vitalSigns"]
    }
  },
  {
    id: "soap-expanded",
    name: "SOAP Note (Expanded)",
    description: "Comprehensive SOAP format including detailed vital signs, lab results, and extensive treatment planning sections.",
    systemInstructions: "Use expanded SOAP format including vital signs, lab results, and detailed treatment plans.",
    content: "Use expanded SOAP format including vital signs, lab results, and detailed treatment plans.",
    instructions: {
      dataFormatting: "Expanded SOAP format",
      priorityRules: "Include all lab results",
      specialConditions: "Detail treatment plans"
    },
    schema: {
      sections: ["Subjective", "Objective", "Labs", "Assessment", "Plan"],
      requiredFields: ["labResults", "treatmentPlan"]
    }
  },
  {
    id: "discharge",
    name: "Discharge Summary",
    description: "Complete discharge documentation including admission details, hospital course, and detailed follow-up instructions.",
    systemInstructions: "Focus on admission details, hospital course, and discharge instructions.",
    content: "Focus on admission details, hospital course, and discharge instructions.",
    instructions: {
      dataFormatting: "Discharge format",
      priorityRules: "Highlight follow-up care",
      specialConditions: "Note warning signs"
    },
    schema: {
      sections: ["Admission", "Course", "Discharge", "Follow-up"],
      requiredFields: ["followUpPlan", "medications"]
    }
  },
  {
    id: "referral",
    name: "Referral Letter",
    description: "Professional specialist referral documentation with emphasis on reason for referral and relevant clinical history.",
    systemInstructions: "Emphasize reason for referral, relevant history, and specific consultation requests.",
    content: "Emphasize reason for referral, relevant history, and specific consultation requests.",
    instructions: {
      dataFormatting: "Referral format",
      priorityRules: "Emphasize referral reason",
      specialConditions: "Note urgency level"
    },
    schema: {
      sections: ["Referral Reason", "History", "Current Status", "Request"],
      requiredFields: ["referralReason", "urgencyLevel"]
    }
  }
];