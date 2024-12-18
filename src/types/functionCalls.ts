export type FunctionParameter = {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  enum?: string[];
};

export type AIFunction = {
  name: string;
  description: string;
  parameters: FunctionParameter[];
  expectedOutput: {
    type: string;
    description: string;
    example: unknown;
  };
};

export const aiFunctions: AIFunction[] = [
  {
    name: "createCustomTemplate",
    description: "Creates a new custom template for clinical documentation",
    parameters: [
      {
        name: "templateName",
        type: "string",
        description: "Name of the new template",
        required: true
      },
      {
        name: "sections",
        type: "array",
        description: "Array of section names to include in the template",
        required: true
      },
      {
        name: "systemInstructions",
        type: "string",
        description: "Special instructions for the AI when using this template",
        required: true
      }
    ],
    expectedOutput: {
      type: "object",
      description: "Created template object with ID and confirmation",
      example: {
        templateId: "uuid",
        name: "Custom SOAP Note",
        success: true
      }
    }
  },
  {
    name: "addNewPatient",
    description: "Adds a new patient to the system with basic demographic information",
    parameters: [
      {
        name: "firstName",
        type: "string",
        description: "Patient's first name",
        required: true
      },
      {
        name: "lastName",
        type: "string",
        description: "Patient's last name",
        required: true
      },
      {
        name: "dateOfBirth",
        type: "string",
        description: "Patient's date of birth in YYYY-MM-DD format",
        required: true
      },
      {
        name: "medicalRecordNumber",
        type: "string",
        description: "Unique medical record number",
        required: true
      }
    ],
    expectedOutput: {
      type: "object",
      description: "Created patient object with ID and confirmation",
      example: {
        patientId: "uuid",
        mrn: "MRN123456",
        success: true
      }
    }
  },
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
  },
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
  },
  {
    name: "searchRecords",
    description: "Searches through chat history and patient records",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Search query string",
        required: true
      },
      {
        name: "filters",
        type: "object",
        description: "Search filters",
        required: false
      },
      {
        name: "dateRange",
        type: "object",
        description: "Date range for the search",
        required: false
      }
    ],
    expectedOutput: {
      type: "object",
      description: "Search results with pagination",
      example: {
        results: ["array of matching records"],
        total: 10,
        page: 1
      }
    }
  },
  {
    name: "getLastVisitDate",
    description: "Retrieves the date of the patient's last visit",
    parameters: [
      {
        name: "patientId",
        type: "string",
        description: "ID of the patient",
        required: true
      },
      {
        name: "visitType",
        type: "string",
        description: "Type of visit to filter by",
        required: false,
        enum: ["all", "in-person", "telehealth"]
      }
    ],
    expectedOutput: {
      type: "object",
      description: "Last visit information",
      example: {
        lastVisitDate: "2024-01-15T09:30:00Z",
        visitType: "in-person",
        providerId: "uuid"
      }
    }
  }
];