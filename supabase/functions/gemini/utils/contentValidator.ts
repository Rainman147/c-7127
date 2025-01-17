type ValidationResult = {
  content: string;
  corrections: {
    original: string;
    corrected: string;
    reason: string;
  }[];
};

// Medical terminology mappings
const medicalTerminology = {
  "heart attack": "myocardial infarction",
  "high blood pressure": "hypertension",
  "sugar": "glucose",
  // Add more common terms
};

// Required sections based on template type
const templateRequirements = {
  "soap": ["Subjective", "Objective", "Assessment", "Plan"],
  "progress": ["Interval History", "Current Status", "Plan"],
  "discharge": ["Admission Details", "Hospital Course", "Discharge Plan"]
};

export const validateAndEnhanceContent = (
  content: string,
  templateType: string = 'soap'
): ValidationResult => {
  const corrections: { original: string; corrected: string; reason: string }[] = [];
  let enhancedContent = content;

  // 1. Medical Terminology Standardization
  Object.entries(medicalTerminology).forEach(([casual, formal]) => {
    const regex = new RegExp(`\\b${casual}\\b`, 'gi');
    if (regex.test(enhancedContent)) {
      corrections.push({
        original: casual,
        corrected: formal,
        reason: "Medical terminology standardization"
      });
      enhancedContent = enhancedContent.replace(regex, formal);
    }
  });

  // 2. Format Standardization
  // Blood pressure format: XXX/YY mmHg
  const bpRegex = /\b(\d{2,3})\s*\/\s*(\d{2,3})(?!\s*mmHg)\b/g;
  enhancedContent = enhancedContent.replace(bpRegex, '$1/$2 mmHg');

  // Temperature format: XX.X°C
  const tempRegex = /\b(\d{2})\.?(\d)?\s*(?:degrees?|deg\.?|°)\s*(?:C|c)?\b/g;
  enhancedContent = enhancedContent.replace(tempRegex, '$1.$2°C');

  // 3. Section Validation
  const requiredSections = templateRequirements[templateType] || [];
  requiredSections.forEach(section => {
    if (!enhancedContent.includes(section + ":")) {
      enhancedContent += `\n\n${section}:\nNo ${section.toLowerCase()} information provided.`;
      corrections.push({
        original: "",
        corrected: section,
        reason: "Added missing required section"
      });
    }
  });

  return {
    content: enhancedContent,
    corrections
  };
};