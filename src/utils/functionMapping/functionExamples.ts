import type { AIFunction } from '@/types/functionCalls';

export const functionExamples: Record<string, AIFunction> = {
  createTemplate: {
    name: "createTemplate",
    description: "Create a new template",
    parameters: [
      {
        name: "templateName",
        type: "string",
        description: "What would you like to name this template?",
        required: true
      },
      {
        name: "content",
        type: "string",
        description: "What content should be in the template?",
        required: true
      }
    ],
    expectedOutput: {
      type: "object",
      description: "Created template details",
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Daily Notes",
        content: "Patient visited for routine checkup"
      }
    }
  },
  startLiveSession: {
    name: "startLiveSession",
    description: "Start a new live session",
    parameters: [
      {
        name: "patientName",
        type: "string",
        description: "What is the patient's name?",
        required: false
      },
      {
        name: "visitType",
        type: "string",
        description: "Would you like to specify a type of visit?",
        required: false,
        enum: ["in-person", "telehealth"]
      }
    ],
    expectedOutput: {
      type: "object",
      description: "Session details",
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        patientName: "John Doe",
        visitType: "in-person"
      }
    }
  }
};