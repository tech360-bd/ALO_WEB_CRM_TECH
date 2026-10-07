// ============================================================================
// ALO "7-Step Journey" — Course Finder branded visual (spec: COURSE FINDER
// MAPPING). The visual must show the ACTUAL configured ALO journey — these
// stages are the single source of truth; change them here when the ALO
// workflow changes, never hard-code inside components.
// ============================================================================

export interface JourneyStep {
  step: number;
  key: string;
  title: string;
  description: string;
}

export const ALO_JOURNEY_STEPS: JourneyStep[] = [
  { step: 1, key: "counseling", title: "Counseling", description: "Free expert counseling to understand the student's goals, budget, and timeline." },
  { step: 2, key: "course_university_selection", title: "Course & University Selection", description: "Shortlisting accredited universities and courses matching the student's profile." },
  { step: 3, key: "document_preparation", title: "Document Preparation", description: "Academic, financial, and identity documents gathered and verified against a checklist." },
  { step: 4, key: "application", title: "Application", description: "Applications prepared and submitted to the selected universities." },
  { step: 5, key: "offer_conditions", title: "Offer / Conditions", description: "Offer letters received; conditions tracked and met one by one." },
  { step: 6, key: "payment_visa_preparation", title: "Payment / Visa Preparation", description: "Verified payment instructions, financial evidence, and interview preparation." },
  { step: 7, key: "visa_enrollment", title: "Visa / Enrollment", description: "Visa application, decision, and enrollment support through to departure." },
];

export const JOURNEY_BRANDING = {
  documentType: "ALO_JOURNEY_VISUAL" as const,
  brandName: "ALO Education",
  logoPath: "/logo.svg",
  confidentialNotice:
    "CONFIDENTIAL — Prepared by ALO Education for guidance purposes. This visual reflects the configured ALO student journey and is not a contractual document.",
};

/** Build the branded visual-document model (renders in UI / download / share). */
export function buildJourneyVisualDocument(date: Date = new Date()): {
  title: string;
  branding: typeof JOURNEY_BRANDING;
  steps: JourneyStep[];
  stepCount: number;
  generatedAt: string;
  version: number;
} {
  return {
    title: "ALO 7-Step Journey",
    branding: JOURNEY_BRANDING,
    steps: [...ALO_JOURNEY_STEPS].sort((a, b) => a.step - b.step),
    stepCount: ALO_JOURNEY_STEPS.length,
    generatedAt: date.toISOString(),
    version: 1,
  };
}
