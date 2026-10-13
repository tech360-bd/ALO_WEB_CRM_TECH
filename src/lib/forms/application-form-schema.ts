/**
 * THE FORM STITCHER — one field definition used everywhere
 * ========================================================
 * The brief asks for a single fixed form structure ("Type of Form with stitcher
 * fixed for every whare") that serves:
 *
 *   • Form A  — public Apply Now           (student fills the short gate)
 *   • Form B  — student portal application (student fills everything)
 *   • Form C  — counselling / manual lead  (counselor fills the same sections)
 *
 * The portal's own UI (src/components/student/StudentProfilePage.tsx) and the CRM
 * manual-lead screen (src/app/crm/leads/new) both render from these definitions,
 * so a field can never exist in one form and be missing in the other.
 *
 * Each field carries a `crm` note: the student-profile / CRM destination the
 * value feeds. That is the "Data for Student Profile_CRM - …" mapping from the
 * brief, kept next to the field instead of in a separate spreadsheet that drifts.
 */

export type FormFieldType = 'text' | 'email' | 'phone' | 'date' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio';

export interface FormFieldDefinition {
  /** Stable key stored in the section payload JSON. */
  name: string;
  label: string;
  type: FormFieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  /** Student-profile / CRM destination for this value ("Data for Student Profile_CRM - …"). */
  crm: string;
  /** Only rendered when another field in the same section has one of these values. */
  showWhen?: { field: string; equals: string[] };
}

export interface FormSectionDefinition {
  /** Section key — identical to StudentProfileSection.section in the database. */
  key: FormSectionKey;
  label: string;
  description: string;
  /** Sections the Apply Now gate requires before an application may be created. */
  requiredForApplication: boolean;
  repeatable?: boolean;
  fields: FormFieldDefinition[];
}

export type FormSectionKey =
  | 'lead'
  | 'personal'
  | 'contact'
  | 'education'
  | 'passport'
  | 'english'
  | 'work'
  | 'reference'
  | 'background'
  | 'admission'
  | 'funding'
  | 'notes';

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const MARITAL = ['Single', 'Married', 'Divorced', 'Widowed'];
const YES_NO = ['Yes', 'No'];
const LEVELS = ['SSC/O Level', 'HSC/A Level', 'Diploma', 'Bachelor', 'Master', 'PhD'];
const TEST_TYPES = ['IELTS', 'IELTS-UKVI', 'PTE', 'TOEFL', 'Duolingo (DET)', 'Kaplan', 'OIETC', 'GRE', 'GMAT', 'SAT'];
const FUNDING_STATUS = ['Self funded', 'Education loan', 'Scholarship', 'Sponsor', 'Other'];
const SPONSORS = ['Applicant', 'Parents', 'Sibling', 'Dependent', 'Others'];
const DESTINATIONS = ['United Kingdom', 'Australia', 'Canada', 'Ireland', 'New Zealand', 'USA', 'Dubai', 'Other'];
const PATHWAYS = ['Provider', 'B2B partner', 'Direct to university', 'ALO application team'];

export const APPLICATION_FORM_SECTIONS: FormSectionDefinition[] = [
  {
    key: 'lead',
    label: 'Lead Information',
    description: 'Lead routing and ownership recorded when the counseling case is created.',
    requiredForApplication: false,
    fields: [
      { name: 'givenName', label: 'Given name', type: 'text', required: true, crm: 'Student Profile · first name' },
      { name: 'familyName', label: 'Family name', type: 'text', required: true, crm: 'Student Profile · last name' },
      { name: 'leadEmail', label: 'Email', type: 'email', required: true, crm: 'Student Profile · email (unique)' },
      { name: 'countryCode', label: 'Country code', type: 'text', placeholder: '+880', crm: 'Student Profile · phone country code' },
      { name: 'mobile', label: 'Mobile / WhatsApp', type: 'phone', required: true, crm: 'Student Profile · phone (unique)' },
      { name: 'counselorSelection', label: 'Counselor', type: 'text', crm: 'Lead · assigned counselor' },
      { name: 'leadReference', label: 'Lead reference', type: 'text', crm: 'Lead · source reference' },
      { name: 'preferredDestination', label: 'Preferred destination', type: 'select', options: DESTINATIONS, crm: 'Student Profile · destination preference' },
      { name: 'remarks', label: 'Remarks', type: 'textarea', crm: 'Lead · notes' },
    ],
  },
  {
    key: 'personal',
    label: 'Personal Information',
    description: 'Identity details exactly as they appear on the passport.',
    requiredForApplication: true,
    fields: [
      { name: 'fullName', label: 'Full name', type: 'text', required: true, crm: 'Student Profile · full name' },
      { name: 'dateOfBirth', label: 'Date of birth', type: 'date', required: true, crm: 'Student Profile · DOB' },
      { name: 'gender', label: 'Gender', type: 'select', options: GENDERS, crm: 'Student Profile · gender' },
      { name: 'nationality', label: 'Nationality', type: 'text', required: true, crm: 'Student Profile · nationality' },
      { name: 'maritalStatus', label: 'Marital status', type: 'select', options: MARITAL, crm: 'Student Profile · marital status' },
      { name: 'passportNumber', label: 'Passport number', type: 'text', crm: 'Student Profile · passport number' },
      { name: 'passportExpiry', label: 'Passport expiry', type: 'date', crm: 'Student Profile · passport expiry' },
      { name: 'currentAddress', label: 'Current address (country / city / zip + details)', type: 'textarea', crm: 'Student Profile · present address' },
      { name: 'permanentAddress', label: 'Permanent address', type: 'textarea', crm: 'Student Profile · permanent address' },
      { name: 'sameAsCurrent', label: 'Permanent address is the same as current', type: 'checkbox', crm: 'Student Profile · address convenience flag' },
      { name: 'emergencyName', label: 'Emergency contact name', type: 'text', crm: 'Student Profile · emergency contact' },
      { name: 'emergencyRelation', label: 'Emergency contact relation', type: 'text', crm: 'Student Profile · emergency relation' },
      { name: 'emergencyPhone', label: 'Emergency contact phone', type: 'phone', crm: 'Student Profile · emergency phone' },
      { name: 'visaRefusal', label: 'Visa refusal history?', type: 'radio', options: YES_NO, crm: 'Student Profile · visa refusal flag' },
      { name: 'visaRefusalCountry', label: 'Refusal country', type: 'text', showWhen: { field: 'visaRefusal', equals: ['Yes'] }, crm: 'Student Profile · refusal country' },
      { name: 'visaRefusalDate', label: 'Refusal date', type: 'date', showWhen: { field: 'visaRefusal', equals: ['Yes'] }, crm: 'Student Profile · refusal date' },
      { name: 'visaRefusalReason', label: 'Refusal reason', type: 'textarea', showWhen: { field: 'visaRefusal', equals: ['Yes'] }, crm: 'Student Profile · refusal reason (evidence uploads to Documents)' },
      { name: 'immigrationHistory', label: 'Immigration history (optional)', type: 'textarea', crm: 'Student Profile · immigration notes' },
    ],
  },
  {
    key: 'contact',
    label: 'Contact Information',
    description: 'How ALO and the universities reach the applicant.',
    requiredForApplication: true,
    fields: [
      { name: 'primaryEmail', label: 'Primary email', type: 'email', required: true, crm: 'Student Profile · email' },
      { name: 'altEmail', label: 'Alternative email', type: 'email', crm: 'Student Profile · alternate email' },
      { name: 'contactPhone', label: 'Mobile number', type: 'phone', required: true, crm: 'Student Profile · phone' },
      { name: 'altPhone', label: 'Alternative number', type: 'phone', crm: 'Student Profile · alternate phone' },
      { name: 'cityOfBirth', label: 'City of birth', type: 'text', crm: 'Student Profile · city of birth' },
      { name: 'countryOfBirth', label: 'Country of birth', type: 'text', crm: 'Student Profile · country of birth' },
      { name: 'officeAddress', label: 'Office address (if any)', type: 'textarea', crm: 'Student Profile · office address' },
    ],
  },
  {
    key: 'passport',
    label: 'Passport Details',
    description: 'Passport data and the document itself.',
    requiredForApplication: true,
    fields: [
      { name: 'hasPassport', label: 'Do you have a passport?', type: 'radio', options: YES_NO, required: true, crm: 'Student Profile · passport flag' },
      { name: 'passportNumber', label: 'Passport number', type: 'text', required: true, showWhen: { field: 'hasPassport', equals: ['Yes'] }, crm: 'Student Profile · passport number' },
      { name: 'placeOfIssue', label: 'Place of issue', type: 'text', showWhen: { field: 'hasPassport', equals: ['Yes'] }, crm: 'Student Profile · place of issue' },
      { name: 'issueDate', label: 'Issue date', type: 'date', showWhen: { field: 'hasPassport', equals: ['Yes'] }, crm: 'Student Profile · passport issue date' },
      { name: 'expiryDate', label: 'Expiry date', type: 'date', showWhen: { field: 'hasPassport', equals: ['Yes'] }, crm: 'Student Profile · passport expiry' },
      { name: 'passportNationality', label: 'Nationality', type: 'text', showWhen: { field: 'hasPassport', equals: ['Yes'] }, crm: 'Student Profile · passport nationality' },
    ],
  },
  {
    key: 'education',
    label: 'Education History',
    description: 'Every qualification, most recent first.',
    requiredForApplication: true,
    repeatable: true,
    fields: [
      { name: 'highestQualification', label: 'Highest qualification', type: 'select', options: LEVELS, crm: 'Student Profile · highest qualification (opens the ladder below)' },
      { name: 'academicLevel', label: 'Level', type: 'select', options: LEVELS, required: true, crm: 'Student Profile · education level' },
      { name: 'institution', label: 'Institution name', type: 'text', required: true, crm: 'Student Profile · institution' },
      { name: 'cityOfStudy', label: 'City / country of study', type: 'text', crm: 'Student Profile · study location' },
      { name: 'boardName', label: 'Board / university', type: 'text', crm: 'Student Profile · board or university' },
      { name: 'groupSubject', label: 'Subject / major', type: 'text', crm: 'Student Profile · subject' },
      { name: 'resultScore', label: 'Result (GPA / % and scale)', type: 'text', crm: 'Student Profile · result' },
      { name: 'endYear', label: 'Passing year', type: 'text', crm: 'Student Profile · passing year' },
      { name: 'duration', label: 'Study duration (from – to)', type: 'text', crm: 'Student Profile · duration' },
      { name: 'primaryLanguage', label: 'Primary language of instruction (MOI)', type: 'text', crm: 'Student Profile · MOI (used for MOI waivers)' },
      { name: 'studyGap', label: 'Study gap?', type: 'radio', options: YES_NO, crm: 'Student Profile · study gap flag' },
      { name: 'studyGapFrom', label: 'Gap from', type: 'date', showWhen: { field: 'studyGap', equals: ['Yes'] }, crm: 'Student Profile · gap start' },
      { name: 'studyGapTo', label: 'Gap to', type: 'date', showWhen: { field: 'studyGap', equals: ['Yes'] }, crm: 'Student Profile · gap end' },
    ],
  },
  {
    key: 'english',
    label: 'English Proficiency',
    description: 'Test scores and the certificate.',
    requiredForApplication: true,
    repeatable: true,
    fields: [
      { name: 'testStatus', label: 'Do you have an English proficiency test?', type: 'radio', options: ['Yes', 'Yet to receive', 'Planning'], required: true, crm: 'Student Profile · test status' },
      { name: 'testType', label: 'Test name', type: 'select', options: TEST_TYPES, showWhen: { field: 'testStatus', equals: ['Yes'] }, crm: 'Student Profile · test type' },
      { name: 'testDate', label: 'Test date', type: 'date', showWhen: { field: 'testStatus', equals: ['Yes'] }, crm: 'Student Profile · test date' },
      { name: 'expiryDate', label: 'Expiration date', type: 'date', showWhen: { field: 'testStatus', equals: ['Yes'] }, crm: 'Student Profile · test expiry' },
      { name: 'certificateId', label: 'TRT / certificate ID', type: 'text', showWhen: { field: 'testStatus', equals: ['Yes'] }, crm: 'Student Profile · certificate id' },
      { name: 'overallScore', label: 'Overall score', type: 'text', showWhen: { field: 'testStatus', equals: ['Yes'] }, crm: 'Student Profile · overall score' },
      { name: 'listening', label: 'Listening', type: 'text', showWhen: { field: 'testType', equals: ['IELTS', 'IELTS-UKVI', 'PTE', 'OIETC'] }, crm: 'Student Profile · component score' },
      { name: 'reading', label: 'Reading', type: 'text', showWhen: { field: 'testType', equals: ['IELTS', 'IELTS-UKVI', 'PTE', 'OIETC'] }, crm: 'Student Profile · component score' },
      { name: 'writing', label: 'Writing', type: 'text', showWhen: { field: 'testType', equals: ['IELTS', 'IELTS-UKVI', 'PTE', 'OIETC'] }, crm: 'Student Profile · component score' },
      { name: 'speaking', label: 'Speaking', type: 'text', showWhen: { field: 'testType', equals: ['IELTS', 'IELTS-UKVI', 'PTE', 'OIETC'] }, crm: 'Student Profile · component score' },
      { name: 'subScores', label: 'Other sub-scores (GRE / GMAT / SAT / DET)', type: 'textarea', showWhen: { field: 'testType', equals: ['GRE', 'GMAT', 'SAT', 'Duolingo (DET)'] }, crm: 'Student Profile · test sub-scores' },
    ],
  },
  {
    key: 'work',
    label: 'Work Experience',
    description: 'Jobs, internships and volunteering.',
    requiredForApplication: false,
    repeatable: true,
    fields: [
      { name: 'hasWorkExp', label: 'Do you have work experience?', type: 'radio', options: YES_NO, required: true, crm: 'Student Profile · work experience flag' },
      { name: 'company', label: 'Company / organisation', type: 'text', showWhen: { field: 'hasWorkExp', equals: ['Yes'] }, crm: 'Student Profile · employer' },
      { name: 'designation', label: 'Designation / job title', type: 'text', showWhen: { field: 'hasWorkExp', equals: ['Yes'] }, crm: 'Student Profile · job title' },
      { name: 'department', label: 'Department', type: 'text', showWhen: { field: 'hasWorkExp', equals: ['Yes'] }, crm: 'Student Profile · department' },
      { name: 'jobRole', label: 'Job role / responsibilities', type: 'textarea', showWhen: { field: 'hasWorkExp', equals: ['Yes'] }, crm: 'Student Profile · responsibilities' },
      { name: 'startDate', label: 'Start date', type: 'date', showWhen: { field: 'hasWorkExp', equals: ['Yes'] }, crm: 'Student Profile · employment start' },
      { name: 'endDate', label: 'End date', type: 'date', showWhen: { field: 'hasWorkExp', equals: ['Yes'] }, crm: 'Student Profile · employment end' },
      { name: 'currentlyWorking', label: 'Currently working here', type: 'checkbox', showWhen: { field: 'hasWorkExp', equals: ['Yes'] }, crm: 'Student Profile · current employment flag' },
    ],
  },
  {
    key: 'reference',
    label: 'Reference / LOR',
    description: 'Academic or professional referees.',
    requiredForApplication: false,
    repeatable: true,
    fields: [
      { name: 'hasReferral', label: 'Do you have a reference?', type: 'radio', options: YES_NO, required: true, crm: 'Student Profile · reference flag' },
      { name: 'refName', label: 'Referee name', type: 'text', showWhen: { field: 'hasReferral', equals: ['Yes'] }, crm: 'Student Profile · referee' },
      { name: 'refInstitution', label: 'Institution', type: 'text', showWhen: { field: 'hasReferral', equals: ['Yes'] }, crm: 'Student Profile · referee institution' },
      { name: 'refEmail', label: 'Email', type: 'email', showWhen: { field: 'hasReferral', equals: ['Yes'] }, crm: 'Student Profile · referee email' },
      { name: 'refPhone', label: 'Phone', type: 'phone', showWhen: { field: 'hasReferral', equals: ['Yes'] }, crm: 'Student Profile · referee phone' },
      { name: 'referenceNotes', label: 'Notes', type: 'textarea', crm: 'Student Profile · reference notes' },
    ],
  },
  {
    key: 'background',
    label: 'Background & Visa History',
    description: 'Visa history and the sensitive checks required before a UKVI application.',
    requiredForApplication: true,
    fields: [
      { name: 'hasVisa', label: 'Do you have any visa?', type: 'radio', options: YES_NO, required: true, crm: 'Student Profile · visa flag' },
      { name: 'visaCountry', label: 'Applied country', type: 'text', showWhen: { field: 'hasVisa', equals: ['Yes'] }, crm: 'Student Profile · visa country' },
      { name: 'visaType', label: 'Visa type', type: 'select', options: ['Student', 'Tourist', 'Dependent', 'Short term', 'Work', 'Other'], showWhen: { field: 'hasVisa', equals: ['Yes'] }, crm: 'Student Profile · visa type' },
      { name: 'applicantStatus', label: 'Applicant status', type: 'select', options: ['Main applicant', 'Dependent'], showWhen: { field: 'hasVisa', equals: ['Yes'] }, crm: 'Student Profile · applicant status' },
      { name: 'hasVisaRefusal', label: 'Any visa refusal?', type: 'radio', options: YES_NO, required: true, crm: 'Student Profile · refusal flag' },
      { name: 'refusalCountry', label: 'Refusal country', type: 'text', showWhen: { field: 'hasVisaRefusal', equals: ['Yes'] }, crm: 'Student Profile · refusal country' },
      { name: 'refusalDate', label: 'Refusal date', type: 'date', showWhen: { field: 'hasVisaRefusal', equals: ['Yes'] }, crm: 'Student Profile · refusal date' },
      { name: 'refusalReason', label: 'Refusal reason', type: 'textarea', showWhen: { field: 'hasVisaRefusal', equals: ['Yes'] }, crm: 'Student Profile · refusal reason' },
      { name: 'hasImmigration', label: 'Applied for any program / immigration before?', type: 'radio', options: YES_NO, crm: 'Student Profile · prior applications' },
      { name: 'immigrationCountry', label: 'Country', type: 'text', showWhen: { field: 'hasImmigration', equals: ['Yes'] }, crm: 'Student Profile · prior application country' },
      { name: 'medicalCondition', label: 'Serious medical condition', type: 'textarea', crm: 'Student Profile · medical declaration' },
      { name: 'criminalOffense', label: 'Criminal offence', type: 'textarea', crm: 'Student Profile · criminal declaration' },
    ],
  },
  {
    key: 'admission',
    label: 'Admission Preference',
    description: 'Institutions and intakes the student wants to apply to.',
    requiredForApplication: true,
    repeatable: true,
    fields: [
      { name: 'studyDestination', label: 'Study destination', type: 'select', options: DESTINATIONS, required: true, crm: 'Student Profile · destination preference' },
      { name: 'studyLevel', label: 'Study level', type: 'select', options: ['Foundation', 'Undergraduate', 'Postgraduate', 'MRes', 'PhD'], required: true, crm: 'Student Profile · level of interest' },
      { name: 'programTitle', label: 'Program / course title', type: 'text', required: true, crm: 'Student Profile · course preference' },
      { name: 'instituteName', label: 'Institute name', type: 'text', required: true, crm: 'Student Profile · institution preference' },
      { name: 'intake', label: 'Intake / commencement', type: 'text', crm: 'Student Profile · intake' },
      { name: 'enrollmentPriority', label: 'Choice priority', type: 'select', options: ['1st choice', '2nd choice', '3rd choice'], crm: 'Student Profile · preference order' },
      { name: 'applicationPathway', label: 'Application pathway', type: 'select', options: PATHWAYS, crm: 'Student Profile · application pathway' },
      { name: 'pathwayProvider', label: 'Pathway provider (if B2B)', type: 'text', showWhen: { field: 'applicationPathway', equals: ['B2B partner', 'Provider'] }, crm: 'Student Profile · pathway provider' },
    ],
  },
  {
    key: 'funding',
    label: 'Dependent & Funding',
    description: 'Who pays, and how the funds are evidenced.',
    requiredForApplication: true,
    fields: [
      { name: 'fundingStatus', label: 'Funding status', type: 'select', options: FUNDING_STATUS, required: true, crm: 'Student Profile · funding status' },
      { name: 'sponsor', label: 'Sponsor', type: 'select', options: SPONSORS, crm: 'Student Profile · sponsor' },
      { name: 'sourceOfFund', label: 'Source of fund', type: 'textarea', crm: 'Student Profile · source of fund' },
      { name: 'hasDependent', label: 'Travelling with dependents?', type: 'radio', options: YES_NO, crm: 'Student Profile · dependents flag' },
      { name: 'dependentDetails', label: 'Dependent details', type: 'textarea', showWhen: { field: 'hasDependent', equals: ['Yes'] }, crm: 'Student Profile · dependent information' },
    ],
  },
  {
    key: 'notes',
    label: 'Notes & Summary',
    description: 'Counselor notes and the notification switches.',
    requiredForApplication: false,
    fields: [
      { name: 'caseNotes', label: 'Notes / summary / remarks', type: 'textarea', crm: 'Student case timeline (case_notes)' },
      { name: 'notifyStudent', label: 'Notify student via email?', type: 'checkbox', crm: 'Automation · n8n email trigger' },
      { name: 'sendWelcomeEmail', label: 'Send welcome email to student?', type: 'checkbox', crm: 'Automation · welcome email' },
    ],
  },
];

/** Sections the Apply Now gate requires — mirrors src/lib/application-readiness.ts. */
export const REQUIRED_APPLICATION_SECTIONS = APPLICATION_FORM_SECTIONS
  .filter((section) => section.requiredForApplication)
  .map((section) => section.key);

export function getFormSection(key: FormSectionKey): FormSectionDefinition | undefined {
  return APPLICATION_FORM_SECTIONS.find((section) => section.key === key);
}

/** Fields that should be rendered given the current section values. */
export function visibleFields(section: FormSectionDefinition, values: Record<string, unknown>): FormFieldDefinition[] {
  return section.fields.filter((field) => {
    if (!field.showWhen) return true;
    const current = values[field.showWhen.field];
    return typeof current === 'string' && field.showWhen.equals.includes(current);
  });
}
