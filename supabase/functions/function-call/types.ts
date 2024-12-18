// API Input Types
export interface CreateTemplateInput {
  templateName: string;
  sections: string[];
  systemInstructions?: string;
}

export interface AddPatientInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // Format: YYYY-MM-DD
  medicalRecordNumber: string;
}

export interface StartLiveSessionInput {
  patientId: string;
  templateId: string;
  providerId?: string;
}

export interface SearchHistoryInput {
  query: string;
  filters?: {
    dateRange?: {
      start: string;
      end: string;
    };
    visitType?: string;
    provider?: string;
  };
  page?: number;
  limit?: number;
}

export interface FetchLastVisitInput {
  patientId: string;
  visitType?: 'all' | 'in-person' | 'telehealth';
}

export interface ExportToEHRInput {
  sessionId: string;
  format: 'HL7' | 'FHIR' | 'PDF' | 'CDA';
  destination: string;
}

// API Response Types
export interface CreateTemplateResponse {
  templateId: string;
  name: string;
  success: boolean;
}

export interface AddPatientResponse {
  patientId: string;
  mrn: string;
  success: boolean;
}

export interface StartLiveSessionResponse {
  sessionId: string;
  startTime: string;
  status: 'active' | 'ended' | 'error';
}

export interface SearchHistoryResponse {
  results: Array<unknown>;
  total: number;
  page: number;
}

export interface FetchLastVisitResponse {
  lastVisitDate: string;
  visitType: string;
  providerId: string;
}

export interface ExportToEHRResponse {
  exportId: string;
  status: 'pending' | 'completed' | 'failed';
  location?: string;
}

export interface ErrorResponse {
  error: string;
  details?: unknown;
}