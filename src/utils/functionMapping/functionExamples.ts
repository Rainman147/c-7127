import type { FunctionMapping } from './types';

export const functionExamples: FunctionMapping = {
  createTemplate: {
    naturalLanguage: [
      "Create a new template for patient visits",
      "Make a custom SOAP note template",
      "Set up a new documentation template"
    ],
    requiredParameters: ["templateName", "sections"],
    optionalParameters: ["systemInstructions"],
    clarificationPrompts: {
      templateName: "What would you like to name this template?",
      sections: "Which sections should be included in the template? (e.g., Subjective, Objective, Assessment, Plan)",
      systemInstructions: "Are there any specific instructions for the AI when using this template?"
    }
  },
  
  addPatient: {
    naturalLanguage: [
      "Add a new patient to the system",
      "Register a patient",
      "Create patient record"
    ],
    requiredParameters: ["firstName", "lastName", "dateOfBirth", "medicalRecordNumber"],
    clarificationPrompts: {
      firstName: "What is the patient's first name?",
      lastName: "What is the patient's last name?",
      dateOfBirth: "What is the patient's date of birth? (YYYY-MM-DD)",
      medicalRecordNumber: "What is the patient's medical record number?"
    }
  },

  startLiveSession: {
    naturalLanguage: [
      "Start a session with patient",
      "Begin live consultation",
      "Start new visit with patient"
    ],
    requiredParameters: ["patientId", "templateId"],
    clarificationPrompts: {
      patientId: "Which patient would you like to start a session with?",
      templateId: "Which template should be used for this session?"
    }
  },

  searchHistory: {
    naturalLanguage: [
      "Search for patient records",
      "Find previous visits",
      "Look up chat history"
    ],
    requiredParameters: ["query"],
    optionalParameters: ["dateRange", "filters"],
    clarificationPrompts: {
      query: "What would you like to search for?",
      dateRange: "Would you like to specify a date range for the search?",
      filters: "Would you like to add any filters to your search?"
    }
  },

  fetchLastVisit: {
    naturalLanguage: [
      "When was the patient's last visit",
      "Get last appointment date",
      "Show previous visit date"
    ],
    requiredParameters: ["patientId"],
    optionalParameters: ["visitType"],
    clarificationPrompts: {
      patientId: "For which patient would you like to check the last visit?",
      visitType: "Would you like to specify a type of visit? (in-person/telehealth)"
    }
  }
};