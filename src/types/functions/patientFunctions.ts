import type { AIFunction } from './types';

export const patientFunctions: AIFunction[] = [
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