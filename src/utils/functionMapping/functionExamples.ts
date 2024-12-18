import type { AIFunction } from '@/types/functionCalls';

export const functionExamples: Record<string, AIFunction> = {
  createTemplate: {
    name: "createTemplate",
    description: "Create a new template",
    parameters: {
      templateName: "What would you like to name this template?",
      content: "What content should be in the template?"
    },
    examples: [
      "Create a template called Daily Notes with content Patient visited for routine checkup",
      "Make a new template named Progress Notes containing SOAP format notes"
    ]
  },
  startLiveSession: {
    name: "startLiveSession",
    description: "Start a new live session",
    parameters: {
      patientName: "What is the patient's name? (optional)",
      visitType: "Would you like to specify a type of visit? (in-person/telehealth)"
    }
  }
};