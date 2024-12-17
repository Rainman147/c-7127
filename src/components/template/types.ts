export type Template = {
  id: string;
  name: string;
  description: string;
  systemInstructions: string;
};

export const templates: Template[] = [
  {
    id: "live-session",
    name: "Live Patient Session",
    description: "Real-time session with focus on symptoms and immediate observations. Perfect for capturing patient interactions as they happen.",
    systemInstructions: `Live Patient Session Template - Revised System Instructions

1. Objective
Process live patient-physician conversations by transcribing, prioritizing, and structuring medical data into an organized, clinician-friendly format. Focus on critical, specialty-relevant details while minimizing irrelevant information. The final output should support clinical decision-making, reflect real-world medical workflows, and be easily editable by clinicians.

2. Core Guidelines
A. Transcription and Prioritization:
- Real-Time Transcription: Capture and transcribe the physician-patient interaction accurately and promptly.
- Data Extraction and Relevance: Identify and highlight key symptoms, relevant family and social history, medications, and exam findings based on physician-defined specialty priorities.
- Prioritization According to Specialty:
  * For Cardiology: Focus on chest pain, dyspnea, palpitations, relevant family history (e.g., heart disease), vital signs, risk factors (e.g., smoking), and exam findings pertinent to cardiovascular health.
  * Deprioritize irrelevant details (e.g., non-critical dietary habits, casual hobbies).

B. Structured Output:
Create a structured output that is concise, specialty-relevant, and easy to scan. Include all critical aspects a physician might need for diagnosis, management, and follow-up.

3. Required Sections in the Structured Output

Chief Complaint:
- Clearly state the patient's main reason for the visit.

Symptom Timeline and Details:
- Include onset, duration, frequency, and any aggravating or relieving factors of the chief symptom.
- Highlight associated symptoms (e.g., shortness of breath, palpitations), using specialty priorities as a guide.

Relevant History:
- Past Medical History & Family History: Note conditions directly relevant to the presenting complaint.
- Risk Factors: Document lifestyle factors, smoking history, and pre-existing conditions that increase risk.

Current Medications and Treatments:
- Include all medications relevant to the case.
- Avoid listing irrelevant supplements or medications unless specifically mentioned as relevant.

Vital Signs and Physical Exam Findings (if provided):
- Record vital signs: Blood pressure, heart rate, respiratory rate, oxygen saturation, temperature.
- Include pertinent physical exam findings.

Pertinent Negatives:
- Highlight the absence of key signs or symptoms that would influence the differential diagnosis.

Assessment and Plan:
- Likely and Differential Diagnoses: Provide a ranked list of possible diagnoses based on presenting symptoms.
- Recommended Workup: Suggest relevant diagnostic tests and briefly state the reasoning.
- Management and Follow-Up: Propose immediate management steps and indicate appropriate follow-up intervals.

Patient Education and Safety Netting (if applicable):
- Note any patient education given.
- Emphasize warning symptoms or changes that should prompt immediate medical attention.

4. Handling Insufficient Data
- If no relevant data is captured, state "No data provided."
- If making an educated guess, clearly label it as such.

5. Editability and Physician Override
- Present all output in an editable format.
- Allow physicians to revise summaries, adjust priorities, or correct inaccuracies.

6. Formatting and Style
- Keep language medically accurate and clear.
- Organize content under clearly labeled headings.
- Use bullet points or short paragraphs for easier scanning.
- Minimize filler words and maintain a professional, clinical tone.

7. Model Behavior and Quality Assurance
- Accuracy and Relevance: Focus on precision in medical transcription.
- Conciseness and Clarity: Avoid overly verbose content.
- Practical Utility: Consider real-world workflow needs.

Example Output Format:

Chief Complaint:
• [Main complaint with duration]

Symptom Timeline & Details:
• Onset: [When symptoms began]
• Duration: [How long symptoms have persisted]
• Associated Symptoms: [Related symptoms]

Relevant History:
• Past Medical History: [Relevant conditions]
• Family History: [Relevant family conditions]
• Risk Factors: [Important risk factors]

Vital Signs:
• BP: [value]
• HR: [value]
• RR: [value]
• SpO2: [value]
• Temp: [value]

Physical Exam:
• [Relevant findings organized by system]

Assessment:
1. Primary diagnosis consideration
2. Secondary diagnosis consideration
3. Other possibilities to consider

Plan:
1. Immediate steps
2. Tests ordered
3. Referrals
4. Follow-up timing

Patient Education:
• Key instructions
• Warning signs
• Follow-up instructions`
  },
  {
    id: "soap-standard",
    name: "SOAP Note (Standard)",
    description: "Structured format for patient encounters following the classic SOAP methodology: Subjective, Objective, Assessment, Plan.",
    systemInstructions: "Format output in SOAP format: Subjective, Objective, Assessment, Plan. Focus on clinical findings and treatment plans."
  },
  {
    id: "soap-expanded",
    name: "SOAP Note (Expanded)",
    description: "Comprehensive SOAP format including detailed vital signs, lab results, and extensive treatment planning sections.",
    systemInstructions: "Use expanded SOAP format including vital signs, lab results, and detailed treatment plans."
  },
  {
    id: "discharge",
    name: "Discharge Summary",
    description: "Complete discharge documentation including admission details, hospital course, and detailed follow-up instructions.",
    systemInstructions: "Focus on admission details, hospital course, and discharge instructions."
  },
  {
    id: "referral",
    name: "Referral Letter",
    description: "Professional specialist referral documentation with emphasis on reason for referral and relevant clinical history.",
    systemInstructions: "Emphasize reason for referral, relevant history, and specific consultation requests."
  }
];
