import type { AIFunction } from './types';

export const exportFunctions: AIFunction[] = [
  {
    name: "exportToEHR",
    description: "Exports clinical summaries to an Electronic Health Record system",
    parameters: [
      {
        name: "sessionId",
        type: "string",
        description: "ID of the clinical session to export",
        required: true
      },
      {
        name: "format",
        type: "string",
        description: "Export format type",
        required: true,
        enum: ["HL7", "FHIR", "PDF", "CDA"]
      },
      {
        name: "destination",
        type: "string",
        description: "EHR system identifier",
        required: true
      }
    ],
    expectedOutput: {
      type: "object",
      description: "Export confirmation with status and location",
      example: {
        exportId: "uuid",
        status: "completed",
        location: "ehr://documents/123"
      }
    }
  }
];