import type { AIFunction } from './types';

export const sessionFunctions: AIFunction[] = [
  {
    name: "initiateLiveSession",
    description: "Starts a new live clinical session with a selected patient",
    parameters: [
      {
        name: "patientId",
        type: "string",
        description: "ID of the selected patient",
        required: true
      },
      {
        name: "templateId",
        type: "string",
        description: "ID of the template to use for the session",
        required: true
      },
      {
        name: "providerId",
        type: "string",
        description: "ID of the healthcare provider",
        required: true
      }
    ],
    expectedOutput: {
      type: "object",
      description: "Created session object with connection details",
      example: {
        sessionId: "uuid",
        startTime: "2024-01-20T10:00:00Z",
        status: "active"
      }
    }
  }
];