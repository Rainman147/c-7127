import type { Template } from './Template';

export const soapFallbackTemplate: Template = {
  id: "soap-fallback",
  name: "Basic SOAP Note",
  description: "Simple SOAP note template for fallback scenarios",
  systemInstructions: "Format notes using standard SOAP methodology: Subjective, Objective, Assessment, Plan.",
};

export const liveSessionFallbackTemplate: Template = {
  id: "live-session-fallback",
  name: "Basic Live Session",
  description: "Simple live session template for fallback scenarios",
  systemInstructions: "Capture and organize patient interaction notes in real-time.",
};

export const getFallbackTemplate = (templateType?: string): Template => {
  console.log('[getFallbackTemplate] Getting fallback for type:', templateType);
  
  switch (templateType) {
    case 'soap-standard':
    case 'soap-expanded':
      return soapFallbackTemplate;
    case 'live-session':
      return liveSessionFallbackTemplate;
    default:
      console.log('[getFallbackTemplate] Using default live session fallback');
      return liveSessionFallbackTemplate;
  }
};