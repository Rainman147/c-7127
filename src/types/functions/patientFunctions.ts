import type { AIFunction } from './types';

export const patientFunctions: AIFunction[] = [
  {
    name: "addPatient",
    description: "Adds a new patient to the system with basic demographic information",
    parameters: [
      {
        name: "name",
        type: "string",
        description: "Patient's full name",
        required: true
      },
      {
        name: "dob",
        type: "string",
        description: "Patient's date of birth in YYYY-MM-DD format",
        required: true
      },
      {
        name: "contactInfo",
        type: "object",
        description: "Optional contact information for the patient",
        required: false
      }
    ],
    expectedOutput: {
      type: "object",
      description: "Created patient object with ID and confirmation",
      example: {
        success: true,
        patient: {
          id: "uuid",
          name: "John Doe",
          dob: "1980-01-01"
        }
      }
    }
  },
  {
    name: "searchPatients",
    description: "Search for patients by name",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Search query to match against patient names",
        required: true
      }
    ],
    expectedOutput: {
      type: "object",
      description: "List of matching patients",
      example: {
        patients: [
          {
            id: "uuid",
            name: "John Doe",
            dob: "1980-01-01"
          }
        ]
      }
    }
  }
];