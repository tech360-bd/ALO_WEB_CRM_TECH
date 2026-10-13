'use client';

import { useState, useCallback } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  DollarSign,
  FileText,
  AlertTriangle,
  Briefcase,
  Lightbulb,
  X,
  ChevronDown,
  Globe,
  Calendar,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────

interface VisaStep {
  title: string;
  description: string;
  timeline: string;
  documents?: string[];
}

interface VisaData {
  country: string;
  flag: string;
  visaType: string;
  steps: VisaStep[];
  requiredDocuments: { name: string; required: boolean; notes?: string }[];
  fees: { item: string; amount: string; amountBDT: string }[];
  processingTime: { type: string; duration: string; cost: string }[];
  rejectionReasons: string[];
  postStudyWork: { visaName: string; duration: string; requirements: string }[];
  tips: string[];
}

interface VisaGuidePageProps {
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

// ─── Visa Data ────────────────────────────────────────────────────────────

const VISA_DATA: Record<string, VisaData> = {
  uk: {
    country: 'United Kingdom', flag: '🇬🇧', visaType: 'Student Visa (formerly Tier 4 General)',
    steps: [
      { title: 'Receive CAS', description: 'University issues Confirmation of Acceptance for Studies', timeline: 'After accepting offer', documents: ['Unconditional offer letter', 'CAS number'] },
      { title: 'Pay IHS Surcharge', description: 'Pay Immigration Health Surcharge for NHS access', timeline: 'Before visa application', documents: ['IHS reference number'] },
      { title: 'Complete Online Application', description: 'Fill visa application on GOV.UK website', timeline: '1-2 hours', documents: ['CAS', 'Passport', 'Financial evidence', 'TB certificate'] },
      { title: 'Book Biometrics', description: 'Schedule appointment at VFS Global Dhaka/Chattogram', timeline: 'Within 15 days of application', documents: ['Appointment confirmation'] },
      { title: 'Attend Biometrics', description: 'Provide fingerprints and photograph at VFS center', timeline: '15 minutes', documents: ['Passport', 'Appointment letter', 'All supporting documents'] },
      { title: 'Wait for Decision', description: 'UKVI processes your application', timeline: 'Standard: 3 weeks / Priority: 5 working days / Super Priority: next working day' },
      { title: 'Collect Visa & Travel', description: 'Collect passport from VFS, book flight', timeline: '1-2 days after decision' },
    ],
    requiredDocuments: [
      { name: 'Current passport', required: true, notes: 'Valid for duration of stay + 6 months' },
      { name: 'CAS letter', required: true, notes: 'Must be from licensed sponsor, issued within 6 months' },
      { name: 'Financial evidence', required: true, notes: '28-day maintenance: London £1,334/mo, outside London £1,023/mo' },
      { name: 'TB test certificate', required: true, notes: 'From approved clinic in Dhaka' },
      { name: 'Academic qualifications', required: true, notes: 'Certificates and transcripts as listed in CAS' },
      { name: 'English language test', required: true, notes: 'IELTS/PTE/TOEFL as specified by university' },
      { name: 'ATAS certificate', required: false, notes: 'Only for certain postgraduate research courses' },
      { name: 'Police certificate', required: false, notes: 'May be requested for certain nationalities' },
      { name: 'Parental consent letter', required: false, notes: 'If under 18 years old' },
    ],
    fees: [
      { item: 'Visa application fee', amount: '£348', amountBDT: '৳52,896' },
      { item: 'IHS (per year)', amount: '£470', amountBDT: '৳71,440' },
      { item: 'VFS service fee', amount: '~৳5,000', amountBDT: '৳5,000' },
      { item: 'TB test', amount: '~৳3,500', amountBDT: '৳3,500' },
      { item: 'Priority service (optional)', amount: '£250', amountBDT: '৳38,000' },
      { item: 'Super priority (optional)', amount: '£956', amountBDT: '৳1,45,312' },
    ],
    processingTime: [
      { type: 'Standard', duration: '3 weeks', cost: 'Included' },
      { type: 'Priority', duration: '5 working days', cost: '+£250 (৳38,000)' },
      { type: 'Super Priority', duration: 'Next working day', cost: '+£956 (৳1,45,312)' },
    ],
    rejectionReasons: [
      'Insufficient maintenance funds (must show 28-day history)',
      'CAS issues (expired, incorrect details, unlicensed sponsor)',
      'Credibility interview failure',
      'False or misleading documents',
      'Previous immigration violations or overstaying',
      'Academic progression not demonstrated',
      'English language requirement not met',
    ],
    postStudyWork: [
      { visaName: 'Graduate Route', duration: '2 years (3 years for PhD)', requirements: 'Successfully complete course at UK institution. No sponsor needed.' },
    ],
    tips: [
      'Apply 3 months before course start date',
      'Show maintenance funds for 28 consecutive days before application',
      'Prepare for credibility interview — practice common questions',
      'Use ALO Education\'s visa filing service for expert guidance',
      'Keep all documents organized — missing docs = automatic refusal',
      'IHS gives you full NHS access — a major benefit',
      'Financial evidence from approved banks only (avoid small cooperatives)',
    ],
  },
  usa: {
    country: 'United States', flag: '🇺🇸', visaType: 'F-1 Student Visa',
    steps: [
      { title: 'Receive I-20', description: 'University issues Form I-20 after accepting offer and proving finances', timeline: 'After accepting offer', documents: ['I-20 form', 'Financial support documents'] },
      { title: 'Pay SEVIS Fee', description: 'Pay I-901 SEVIS fee ($185) online at FMJfee.com', timeline: 'Before visa appointment', documents: ['SEVIS fee receipt (I-901)'] },
      { title: 'Complete DS-160', description: 'Fill online nonimmigrant visa application', timeline: '1-2 hours', documents: ['DS-160 confirmation page', 'Photo upload'] },
      { title: 'Schedule Interview', description: 'Book appointment at US Embassy Dhaka', timeline: 'Wait times vary (2-60+ days)' },
      { title: 'Attend Visa Interview', description: 'In-person interview with consular officer', timeline: '2-5 minutes typical' },
      { title: 'Wait for Processing', description: 'Administrative processing if needed', timeline: '1-2 weeks (may vary)' },
      { title: 'Receive Visa & Travel', description: 'Passport returned with visa stamp', timeline: '2-3 business days' },
    ],
    requiredDocuments: [
      { name: 'Valid passport', required: true, notes: 'Valid for 6 months beyond stay' },
      { name: 'Form I-20', required: true, notes: 'From SEVP-certified school' },
      { name: 'DS-160 confirmation', required: true },
      { name: 'SEVIS fee receipt (I-901)', required: true },
      { name: 'Financial evidence', required: true, notes: 'Must match I-20 financials — bank statements, sponsorship' },
      { name: 'Academic transcripts', required: true },
      { name: 'English test scores', required: true, notes: 'TOEFL/IELTS/Duolingo as per admission' },
      { name: 'Passport photo', required: true, notes: '2x2 inches, within 6 months' },
      { name: 'Admission letter', required: false },
      { name: 'Resume/CV', required: false, notes: 'Helpful for interview' },
    ],
    fees: [
      { item: 'SEVIS I-901 fee', amount: '$185', amountBDT: '৳22,200' },
      { item: 'DS-160 application fee', amount: '$185', amountBDT: '৳22,200' },
      { item: 'VFS service fee', amount: '~৳3,000', amountBDT: '৳3,000' },
      { item: 'Medical examination', amount: '~৳5,000', amountBDT: '৳5,000' },
    ],
    processingTime: [
      { type: 'Standard', duration: 'Interview + 1-2 weeks', cost: 'Included' },
      { type: 'Administrative Processing', duration: '2-8 weeks (case-by-case)', cost: 'No extra cost' },
    ],
    rejectionReasons: [
      'Inability to prove intent to return to Bangladesh (Section 214(b))',
      'Insufficient financial support evidence',
      'Low test scores or academic credentials',
      'Inconsistencies in application or interview answers',
      'Previous visa violations',
      'Suspicious financial documents',
    ],
    postStudyWork: [
      { visaName: 'OPT (Optional Practical Training)', duration: '12 months (extendable to 36 for STEM)', requirements: 'Must be directly related to field of study. Apply before program end.' },
      { visaName: 'CPT (Curricular Practical Training)', duration: 'During studies', requirements: 'Must be integral part of curriculum. Requires employer offer.' },
    ],
    tips: [
      'F-1 interview is the most critical step — practice with ALO counselors',
      'Demonstrate strong ties to Bangladesh (family, property, job offer)',
      'Never say you plan to stay in the US permanently',
      'Know your course details and university thoroughly',
      'Bring original documents + photocopies to interview',
      'SEVIS fee must be paid at least 3 days before interview',
      'ALO Education provides mock visa interview practice sessions',
    ],
  },
  canada: {
    country: 'Canada', flag: '🇨🇦', visaType: 'Study Permit',
    steps: [
      { title: 'Receive LOA', description: 'University issues Letter of Acceptance (Designated Learning Institution)', timeline: 'After accepting offer' },
      { title: 'Apply Online', description: 'Submit application via IRCC portal', timeline: '1-2 hours to complete' },
      { title: 'Pay Application Fee', description: 'CAD $150 for study permit + CAD $85 biometrics', timeline: 'With application' },
      { title: 'Provide Biometrics', description: 'Visit VFS Global Dhaka for fingerprints and photo', timeline: 'Within 30 days of request' },
      { title: 'Medical Exam', description: 'Panel physician examination if requested', timeline: '1-2 hours' },
      { title: 'Wait for Decision', description: 'IRCC processes application', timeline: '4-8 weeks (varies)' },
      { title: 'Receive Port of Entry Letter', description: 'Study permit issued at Canadian border', timeline: 'Upon arrival in Canada' },
    ],
    requiredDocuments: [
      { name: 'Valid passport', required: true },
      { name: 'Letter of Acceptance (LOA)', required: true, notes: 'From DLI (Designated Learning Institution)' },
      { name: 'Proof of funds', required: true, notes: 'CAD $10,000/yr living + first year tuition' },
      { name: 'Study plan / SOP', required: true, notes: 'Explains why this program and institution' },
      { name: 'Academic transcripts', required: true },
      { name: 'English/French test results', required: true },
      { name: 'Medical exam results', required: false, notes: 'If requested by IRCC' },
      { name: 'Police certificate', required: false, notes: 'May be requested' },
    ],
    fees: [
      { item: 'Study permit application', amount: 'CAD $150', amountBDT: '৳13,200' },
      { item: 'Biometrics fee', amount: 'CAD $85', amountBDT: '৳7,480' },
      { item: 'Medical examination', amount: '~৳8,000', amountBDT: '৳8,000' },
      { item: 'VFS service fee', amount: '~৳4,000', amountBDT: '৳4,000' },
      { item: 'Police certificate', amount: '~৳500', amountBDT: '৳500' },
    ],
    processingTime: [
      { type: 'Standard (from Bangladesh)', duration: '4-8 weeks', cost: 'Included' },
      { type: 'SDS (Student Direct Stream)', duration: '20 calendar days', cost: 'Same + upfront tuition payment' },
    ],
    rejectionReasons: [
      'Insufficient proof of funds',
      'Weak study plan / SOP not convincing',
      'Academic credentials don\'t match program level',
      'Intent to return not established',
      'Incomplete documentation',
      'Prior immigration or criminal history',
      'Medical admissibility concerns',
    ],
    postStudyWork: [
      { visaName: 'PGWP (Post-Graduation Work Permit)', duration: 'Up to 3 years (matches program length)', requirements: 'Completed program at DLI, min 8 months. No employer offer needed.' },
    ],
    tips: [
      'SDS stream is faster — requires IELTS 6.0+ in each band + upfront 1st year tuition',
      'Study plan/SOP is critical — must show genuine study intent',
      'Show strong ties to Bangladesh (family, assets, career prospects)',
      'Apply through ALO for expert document preparation',
      'GIC of CAD $10,000 through designated bank helps SDS application',
      'Biometrics valid for 10 years — reusable for future applications',
    ],
  },
  australia: {
    country: 'Australia', flag: '🇦🇺', visaType: 'Student Visa (Subclass 500)',
    steps: [
      { title: 'Receive CoE', description: 'University issues Confirmation of Enrolment', timeline: 'After accepting offer and paying deposit' },
      { title: 'Apply Online via ImmiAccount', description: 'Create account and submit application', timeline: '2-3 hours' },
      { title: 'Pay Visa Fee', description: 'AUD $650 base application charge', timeline: 'With application' },
      { title: 'Provide Biometrics', description: 'Visit VFS Global for fingerprints and photo', timeline: 'Within 14 days of request' },
      { title: 'Health Examination', description: 'Panel doctor examination and chest X-ray', timeline: '1-2 hours' },
      { title: 'Wait for Decision', description: 'DHA processes application', timeline: '2-4 weeks standard' },
      { title: 'Receive Visa Grant Letter', description: 'Electronic visa linked to passport', timeline: 'Email notification' },
    ],
    requiredDocuments: [
      { name: 'Valid passport', required: true },
      { name: 'CoE (Confirmation of Enrolment)', required: true },
      { name: 'GTE statement', required: true, notes: 'Genuine Temporary Entrant — must show intent to return' },
      { name: 'Financial evidence', required: true, notes: 'AUD $21,041/yr living costs + tuition + travel' },
      { name: 'Overseas Student Health Cover (OSHC)', required: true, notes: 'Must be arranged for visa duration' },
      { name: 'Academic documents', required: true },
      { name: 'English test results', required: true, notes: 'IELTS/PTE/TOEFL as per university' },
      { name: 'Health examination', required: false, notes: 'If requested' },
    ],
    fees: [
      { item: 'Visa application fee', amount: 'AUD $650', amountBDT: '৳50,700' },
      { item: 'OSHC (per year)', amount: 'AUD $500-600', amountBDT: '৳39,000-46,800' },
      { item: 'Medical examination', amount: '~৳6,000', amountBDT: '৳6,000' },
      { item: 'Biometrics', amount: '~৳4,000', amountBDT: '৳4,000' },
      { item: 'VFS service fee', amount: '~৳4,000', amountBDT: '৳4,000' },
    ],
    processingTime: [
      { type: 'Standard', duration: '2-4 weeks', cost: 'Included' },
      { type: 'Priority (some nationals)', duration: '48 hours', cost: 'AUD $1,005 additional' },
    ],
    rejectionReasons: [
      'GTE requirement not met (cannot demonstrate temporary intent)',
      'Insufficient financial capacity',
      'Fraudulent documents (high scrutiny for Bangladesh)',
      'Health or character concerns',
      'English proficiency below requirement',
      'Previous visa cancellations or breaches',
    ],
    postStudyWork: [
      { visaName: 'Post-Study Workstream (Subclass 485)', duration: '2-4 years (based on qualification level)', requirements: 'Complete 2+ academic years in Australia. Must apply within 6 months.' },
    ],
    tips: [
      'GTE statement is crucial — must explain why Australia, why this course, why return',
      'PTE Academic is accepted and often easier than IELTS for Australian visas',
      'Show funds from legitimate sources — Australian DHA scrutinizes Bangladeshi financial docs',
      'OSHC must cover entire visa period — university usually arranges this',
      'Part-time work: 48 hours per fortnight during study, unlimited during breaks',
      'ALO Education\'s GTE writing service has 98% approval rate',
    ],
  },
  germany: {
    country: 'Germany', flag: '🇩🇪', visaType: 'Student Visa (National Visa Type D)',
    steps: [
      { title: 'Get Admission Letter', description: 'Receive admission or conditional admission from university', timeline: 'Varies (uni-assist process: 4-6 weeks)' },
      { title: 'Open Blocked Account', description: 'Open sperrkonto with €11,208/year (2024)', timeline: '2-3 weeks' },
      { title: 'Schedule Embassy Appointment', description: 'Book appointment at German Embassy Dhaka', timeline: 'Wait times: 2-8 weeks' },
      { title: 'Prepare Documents', description: 'Compile all required documents with notarization', timeline: '1-2 weeks' },
      { title: 'Attend Visa Interview', description: 'Submit application and brief interview', timeline: '15-30 minutes' },
      { title: 'Wait for Processing', description: 'Embassy processes and sends to foreigners authority', timeline: '4-8 weeks' },
      { title: 'Collect Visa & Travel', description: 'Collect passport and travel to Germany', timeline: '1-2 days after approval' },
    ],
    requiredDocuments: [
      { name: 'Valid passport', required: true },
      { name: 'Admission letter', required: true, notes: 'Or conditional admission + Studienkolleg' },
      { name: 'Blocked account proof', required: true, notes: '€11,208/year (Expatrio or Fintiba)' },
      { name: 'Health insurance', required: true, notes: 'Travel insurance for visa, then German public insurance' },
      { name: 'Academic certificates (attested)', required: true, notes: 'Notarized copies with German translation' },
      { name: 'Motivation letter', required: true },
      { name: 'Language proficiency', required: true, notes: 'TestDaF/DSH for German, or IELTS for English programs' },
      { name: 'CV/Resume', required: true },
      { name: 'Financial guarantee', required: false, notes: 'If sponsored by someone in Germany' },
    ],
    fees: [
      { item: 'Visa application fee', amount: '€75', amountBDT: '৳9,750' },
      { item: 'Blocked account deposit', amount: '€11,208', amountBDT: '৳14,57,040' },
      { item: 'Document attestation (MOFA)', amount: '~৳5,000', amountBDT: '৳5,000' },
      { item: 'German translation', amount: '~৳15,000-25,000', amountBDT: '৳15,000-25,000' },
      { item: 'Health insurance (travel)', amount: '~৳5,000', amountBDT: '৳5,000' },
    ],
    processingTime: [
      { type: 'Standard', duration: '4-8 weeks', cost: 'Included' },
      { type: 'Fast-track (rare)', duration: '2-4 weeks', cost: 'Not available' },
    ],
    rejectionReasons: [
      'Insufficient financial proof (blocked account issues)',
      'Intent to return not established',
      'Incomplete or fraudulent documents',
      'Language proficiency not sufficient',
      'Academic qualifications not recognized',
      'Inconsistencies in motivation letter',
    ],
    postStudyWork: [
      { visaName: '18-month Job Seeker Visa', duration: '18 months after graduation', requirements: 'Complete degree in Germany. Can work any job during this period.' },
      { visaName: 'EU Blue Card', duration: '4 years (renewable)', requirements: 'Job offer with minimum €45,600 salary (2024). Leads to permanent residency in 21-33 months.' },
    ],
    tips: [
      'Public universities are tuition-free — biggest advantage!',
      'Blocked account (Sperrkonto) can be opened online via Expatrio or Fintiba',
      'APS certificate may be required — check with embassy',
      'Learn basic German — helps with daily life and visa interview',
      'uni-assist processes most applications — factor in 4-6 weeks',
      'DAAD scholarship applications open early — apply 8+ months ahead',
      'ALO Education is a DAAD-recognized consultancy in Bangladesh',
    ],
  },
  newzealand: {
    country: 'New Zealand', flag: '🇳🇿', visaType: 'Student Visa',
    steps: [
      { title: 'Receive Offer of Place', description: 'University issues unconditional offer', timeline: 'After accepting offer' },
      { title: 'Apply Online', description: 'Submit via Immigration New Zealand portal', timeline: '2-3 hours' },
      { title: 'Pay Application Fee', description: 'NZD $270 + NZD $270 levy', timeline: 'With application' },
      { title: 'Provide Biometrics', description: 'If requested by INZ', timeline: 'Within timeframe specified' },
      { title: 'Medical & Police Checks', description: 'General medical and chest X-ray if staying 6+ months', timeline: '1-2 weeks' },
      { title: 'Wait for Decision', description: 'INZ processes application', timeline: '3-6 weeks' },
    ],
    requiredDocuments: [
      { name: 'Valid passport', required: true },
      { name: 'Offer of Place', required: true },
      { name: 'Financial evidence', required: true, notes: 'NZD $20,000/yr living + tuition + travel' },
      { name: 'Health & travel insurance', required: true },
      { name: 'Academic documents', required: true },
      { name: 'English test results', required: true },
    ],
    fees: [
      { item: 'Visa application fee', amount: 'NZD $270', amountBDT: '৳18,900' },
      { item: 'Immigration levy', amount: 'NZD $270', amountBDT: '৳18,900' },
      { item: 'Medical examination', amount: '~৳6,000', amountBDT: '৳6,000' },
    ],
    processingTime: [
      { type: 'Standard', duration: '3-6 weeks', cost: 'Included' },
    ],
    rejectionReasons: ['Insufficient funds', 'Genuine intent not established', 'Health or character concerns', 'Incomplete documentation'],
    postStudyWork: [
      { visaName: 'Post-Study Work Visa', duration: '1-3 years (based on qualification)', requirements: 'Complete qualification in NZ. Level 7+ for 3 years.' },
    ],
    tips: ['Smaller quota — apply early', 'Very safe and welcoming country', 'Can work 20 hrs/week during study', 'Pathway to residency through skilled work'],
  },
  ireland: {
    country: 'Ireland', flag: '🇮🇪', visaType: 'Study Visa (Type D)',
    steps: [
      { title: 'Receive Offer Letter', description: 'College/university issues acceptance letter', timeline: 'After accepting offer' },
      { title: 'Pay Tuition Deposit', description: 'Pay first year or deposit as required', timeline: 'Before visa application' },
      { title: 'Apply Online (INIS)', description: 'Submit via INIS online portal', timeline: '2-3 hours' },
      { title: 'Book VFS Appointment', description: 'Schedule biometrics at VFS Dhaka', timeline: 'Within 30 days' },
      { title: 'Attend Appointment', description: 'Submit documents and provide biometrics', timeline: '30 minutes' },
      { title: 'Wait for Decision', description: 'Embassy processes application', timeline: '4-8 weeks' },
    ],
    requiredDocuments: [
      { name: 'Valid passport', required: true },
      { name: 'Offer letter + fee receipt', required: true },
      { name: 'Financial evidence', required: true, notes: '€7,000/yr living + tuition' },
      { name: 'Private medical insurance', required: true },
      { name: 'Academic documents', required: true },
      { name: 'English test results', required: true },
    ],
    fees: [
      { item: 'Visa application fee', amount: '€60', amountBDT: '৳7,800' },
      { item: 'VFS service fee', amount: '~৳4,000', amountBDT: '৳4,000' },
      { item: 'Medical insurance (per year)', amount: '€150-300', amountBDT: '৳19,500-39,000' },
    ],
    processingTime: [{ type: 'Standard', duration: '4-8 weeks', cost: 'Included' }],
    rejectionReasons: ['Insufficient financial evidence', 'Genuine study intent not proven', 'Incomplete documentation', 'Health or character concerns'],
    postStudyWork: [
      { visaName: 'Third Level Graduate Scheme', duration: '2 years (level 8+) / 1 year (level 7)', requirements: 'Complete NFQ level 7+ qualification in Ireland' },
    ],
    tips: ['Very friendly immigration policy for students', 'Ireland is EU HQ for Google, Meta, Apple — great tech jobs', 'English-speaking, no language barrier', 'Stamp 1G allows full-time work during post-study period'],
  },
  netherlands: {
    country: 'Netherlands', flag: '🇳🇱', visaType: 'Residence Permit (Provisional) - MVV',
    steps: [
      { title: 'Receive Admission', description: 'University issues admission letter', timeline: 'After accepting offer' },
      { title: 'University Applies for MVV', description: 'Dutch university applies on your behalf to IND', timeline: '2-4 weeks' },
      { title: 'Collect MVV at Embassy', description: 'Collect provisional residence permit at Dutch Embassy Delhi/Dhaka', timeline: 'After IND approval' },
      { title: 'Travel to Netherlands', description: 'Arrive and collect residence permit from municipality', timeline: 'Within 90 days' },
    ],
    requiredDocuments: [
      { name: 'Valid passport', required: true },
      { name: 'Admission letter', required: true },
      { name: 'Financial evidence', required: true, notes: '€12,540/yr (2024)' },
      { name: 'Academic documents', required: true },
      { name: 'English test results (IELTS 6.0+)', required: true },
    ],
    fees: [
      { item: 'MVV visa fee', amount: '€57', amountBDT: '৳7,410' },
      { item: 'Residence permit fee', amount: '€51', amountBDT: '৳6,630' },
    ],
    processingTime: [{ type: 'Standard', duration: '2-4 weeks (university-initiated)', cost: 'Included' }],
    rejectionReasons: ['Insufficient funds', 'University not recognized sponsor', 'False documents'],
    postStudyWork: [
      { visaName: 'Orientation Year (Zoekjaar)', duration: '1 year', requirements: 'Complete degree in Netherlands. Can work any job. Path to residence permit.' },
    ],
    tips: ['University-initiated visa process is simpler', 'Many English-taught programs available', 'Great work-life balance and international culture', 'Orientation year is excellent bridge to employment'],
  },
  sweden: {
    country: 'Sweden', flag: '🇸🇪', visaType: 'Residence Permit for Higher Education',
    steps: [
      { title: 'Receive Admission', description: 'University issues notification of selection results', timeline: 'April for autumn intake' },
      { title: 'Apply Online (Migrationsverket)', description: 'Submit residence permit application online', timeline: '2-3 hours' },
      { title: 'Visit Embassy', description: 'Present passport and provide biometrics at Swedish Embassy Delhi', timeline: 'After online submission' },
      { title: 'Wait for Decision', description: 'Swedish Migration Agency processes', timeline: '2-4 months' },
    ],
    requiredDocuments: [
      { name: 'Valid passport', required: true },
      { name: 'Admission letter', required: true },
      { name: 'Financial evidence', required: true, notes: 'SEK 8,514/month (2024)' },
      { name: 'Academic documents', required: true },
      { name: 'English test results', required: true },
    ],
    fees: [
      { item: 'Application fee', amount: 'SEK 1,000', amountBDT: '৳9,500' },
    ],
    processingTime: [{ type: 'Standard', duration: '2-4 months', cost: 'Included' }],
    rejectionReasons: ['Insufficient maintenance funds', 'Not admitted to full-time program', 'Invalid passport'],
    postStudyWork: [
      { visaName: 'Residence permit for job seekers', duration: '6 months after graduation', requirements: 'Complete degree in Sweden. Must support yourself financially.' },
    ],
    tips: ['Apply very early — Swedish processing can be slow', 'No tuition for EU/EEA, but non-EU pays fees', 'Karolinska Institute and KTH are world-class', 'Great quality of life and work culture'],
  },
  denmark: {
    country: 'Denmark', flag: '🇩🇰', visaType: 'Residence Permit for Studies',
    steps: [
      { title: 'Receive Admission', description: 'University issues admission letter', timeline: 'Varies' },
      { title: 'Apply Online (SIRI)', description: 'Submit to Danish Agency for International Recruitment', timeline: '2-3 hours' },
      { title: 'Provide Biometrics', description: 'Visit Danish Embassy/VFS for biometrics', timeline: 'After SIRI request' },
      { title: 'Wait for Decision', description: 'SIRI processes application', timeline: '2-3 months' },
    ],
    requiredDocuments: [
      { name: 'Valid passport', required: true },
      { name: 'Admission letter', required: true },
      { name: 'Financial evidence', required: true, notes: 'DKK 6,397/month (2024)' },
      { name: 'Academic documents', required: true },
      { name: 'English test results', required: true },
    ],
    fees: [
      { item: 'Application fee', amount: 'DKK 1,850', amountBDT: '৳28,000' },
    ],
    processingTime: [{ type: 'Standard', duration: '2-3 months', cost: 'Included' }],
    rejectionReasons: ['Insufficient funds', 'Not admitted to approved program', 'Health or character concerns'],
    postStudyWork: [
      { visaName: 'Establishment permit', duration: '2 years', requirements: 'Complete degree in Denmark. Looking for work or starting business.' },
    ],
    tips: ['Many English-taught programs at Master\'s level', 'Tuition-free for EU/EEA/Swiss; non-EU pays fees', 'Great work-life balance', 'Copenhagen is one of Europe\'s best student cities'],
  },
  japan: {
    country: 'Japan', flag: '🇯🇵', visaType: 'Student Visa (College Student)',
    steps: [
      { title: 'Receive Admission', description: 'Language school or university issues acceptance', timeline: 'Varies' },
      { title: 'University Applies to Immigration', description: 'School applies for Certificate of Eligibility (COE)', timeline: '1-3 months' },
      { title: 'Receive COE', description: 'School sends COE to you', timeline: 'After immigration approval' },
      { title: 'Apply at Embassy', description: 'Submit visa application with COE at Japanese Embassy Dhaka', timeline: '5-7 working days' },
      { title: 'Collect Visa & Travel', description: 'Collect passport and travel to Japan', timeline: '1-2 days' },
    ],
    requiredDocuments: [
      { name: 'Valid passport', required: true },
      { name: 'COE (Certificate of Eligibility)', required: true },
      { name: 'Admission letter', required: true },
      { name: 'Financial evidence', required: true, notes: '¥2,000,000+ for first year' },
      { name: 'Academic documents', required: true },
      { name: 'Japanese language certificate (if applicable)', required: false },
    ],
    fees: [
      { item: 'Visa fee (single entry)', amount: '¥3,000', amountBDT: '৳2,100' },
      { item: 'COE processing', amount: 'No fee', amountBDT: '৳0' },
    ],
    processingTime: [{ type: 'Standard', duration: '5-7 days (after COE)', cost: 'Included' }],
    rejectionReasons: ['Insufficient financial support', 'Academic credentials not sufficient', 'Language proficiency issues', 'Intent unclear'],
    postStudyWork: [
      { visaName: 'Designated Activities Visa', duration: 'Up to 5 years (renewable)', requirements: 'Change status to work visa after finding employment. Requires employer sponsorship.' },
    ],
    tips: ['MEXT scholarship covers full costs — apply through embassy', 'JLPT N2 or higher greatly improves job prospects', 'Language school first, then university is common path', 'Can work 28 hours/week during study with permission'],
  },
  malaysia: {
    country: 'Malaysia', flag: '🇲🇾', visaType: 'Student Pass',
    steps: [
      { title: 'Receive Offer Letter', description: 'University issues offer letter', timeline: 'After application' },
      { title: 'University Applies for VAL', description: 'University applies for Visa Approval Letter (VAL) from EMGS', timeline: '2-4 weeks' },
      { title: 'Receive VAL & Travel', description: 'Receive VAL, travel to Malaysia', timeline: 'After VAL approval' },
      { title: 'Student Pass Issued', description: 'Student pass sticker issued at university upon arrival', timeline: '1-2 weeks after arrival' },
    ],
    requiredDocuments: [
      { name: 'Valid passport', required: true, notes: '12+ months validity' },
      { name: 'Offer letter', required: true },
      { name: 'Academic documents', required: true },
      { name: 'Medical examination', required: true, notes: 'In Bangladesh at approved clinic' },
      { name: 'Financial evidence', required: true },
      { name: 'Passport photos', required: true },
    ],
    fees: [
      { item: 'Student pass fee', amount: 'MYR 60', amountBDT: '৳1,500' },
      { item: 'Visa processing (EMGS)', amount: 'MYR 300-500', amountBDT: '৳7,500-12,500' },
      { item: 'Medical examination', amount: '~৳3,000', amountBDT: '৳3,000' },
    ],
    processingTime: [{ type: 'Standard', duration: '2-4 weeks (VAL)', cost: 'Included' }],
    rejectionReasons: ['Incomplete documents', 'Medical issues', 'Financial insufficiency', 'Previous immigration issues'],
    postStudyWork: [
      { visaName: 'Employment Pass', duration: 'Up to 5 years', requirements: 'Must find employer willing to sponsor. Minimum salary requirements apply.' },
    ],
    tips: ['Very affordable — tuition from MYR 15,000-30,000/yr', 'No IELTS required for many programs', 'Islamic country — halal food readily available', '2+2 twinning programs with UK/Australian degrees', 'ALO Education has strong Malaysian university partnerships'],
  },
  uae: {
    country: 'UAE', flag: '🇦🇪', visaType: 'Student Residence Visa',
    steps: [
      { title: 'Receive Admission', description: 'University issues admission letter', timeline: 'After accepting offer' },
      { title: 'Pay Tuition Deposit', description: 'Pay deposit to confirm enrollment', timeline: 'Before visa processing' },
      { title: 'University Sponsors Visa', description: 'University applies for student residence visa', timeline: '2-4 weeks' },
      { title: 'Medical Test in UAE', description: 'Medical examination after arrival in UAE', timeline: 'Within 1 week of arrival' },
      { title: 'Emirates ID', description: 'Apply for Emirates ID card', timeline: '1-2 weeks' },
    ],
    requiredDocuments: [
      { name: 'Valid passport', required: true, notes: '6+ months validity' },
      { name: 'Admission letter', required: true },
      { name: 'Passport photos', required: true, notes: 'White background, 6 copies' },
      { name: 'Academic documents (attested)', required: true, notes: 'MOFA attestation required' },
      { name: 'Birth certificate (attested)', required: false },
      { name: 'Parent NOC (if under 21)', required: false },
    ],
    fees: [
      { item: 'Visa sponsorship (university)', amount: 'AED 2,000-3,500', amountBDT: '৳66,000-1,15,500' },
      { item: 'Medical test', amount: 'AED 700', amountBDT: '৳23,100' },
      { item: 'Emirates ID', amount: 'AED 270', amountBDT: '৳8,910' },
      { item: 'Document attestation', amount: '~৳10,000', amountBDT: '৳10,000' },
    ],
    processingTime: [{ type: 'Standard', duration: '2-4 weeks', cost: 'Included' }],
    rejectionReasons: ['Document attestation issues', 'Health concerns', 'Security clearance failure', 'Incomplete documentation'],
    postStudyWork: [
      { visaName: 'Employment Visa', duration: '2-3 years (renewable)', requirements: 'Find employer to sponsor employment visa. Golden Visa available for high achievers.' },
    ],
    tips: ['Dubai and Abu Dhabi have world-class universities', 'No income tax — keep more of your salary', 'Very safe and modern country', 'Document attestation (MOFA) is critical — ALO handles this', 'Golden Visa (10-year) available for graduates with GPAs 3.8+'],
  },
};

const COUNTRY_LIST = Object.keys(VISA_DATA).map(key => ({
  key,
  name: VISA_DATA[key].country,
  flag: VISA_DATA[key].flag,
}));

// ─── Component ────────────────────────────────────────────────────────────

export function VisaGuidePage({ onBack, onNavigate, onLeadOpen }: VisaGuidePageProps) {
  const [selectedCountry, setSelectedCountry] = useState('uk');
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [checkedDocs, setCheckedDocs] = useState<Set<number>>(new Set());
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const visa = VISA_DATA[selectedCountry];
  const progress = visa.steps.length > 0 ? Math.round((completedSteps.size / visa.steps.length) * 100) : 0;

  const toggleStep = useCallback((idx: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }, []);

  const toggleDoc = useCallback((idx: number) => {
    setCheckedDocs(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }, []);

  const selectCountry = useCallback((key: string) => {
    setSelectedCountry(key);
    setCompletedSteps(new Set());
    setCheckedDocs(new Set());
    setExpandedStep(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <header className="bg-white border-b border-[#2d3142]/10 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 rounded-md hover:bg-[#f5f5f5] text-[#2d3142]/60">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-[#2d3142]">Country Visa Guide</h1>
              <p className="text-xs text-[#2d3142]/50">Step-by-step visa process for every destination</p>
            </div>
          </div>
          <Button onClick={onLeadOpen} className="bg-[#bf4520] hover:bg-[#a33d1c] text-white text-xs h-8">
            Book Visa Consultation
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Country Selector */}
        <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
          <p className="text-sm font-medium text-[#2d3142]/60 mb-3">Select Destination Country</p>
          <div className="flex flex-wrap gap-2">
            {COUNTRY_LIST.map(c => (
              <button
                key={c.key}
                onClick={() => selectCountry(c.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all border',
                  selectedCountry === c.key
                    ? 'bg-[#bf4520] text-white border-[#bf4520]'
                    : 'bg-[#f5f5f5] text-[#2d3142] border-[#2d3142]/5 hover:border-[#bf4520]/30'
                )}
              >
                <span className="text-base">{c.flag}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Visa Title + Progress */}
        <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{visa.flag}</span>
              <div>
                <h2 className="text-xl font-semibold text-[#2d3142]">{visa.country}</h2>
                <p className="text-sm text-[#2d3142]/50">{visa.visaType}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#bf4520]">{progress}%</p>
              <p className="text-xs text-[#2d3142]/50">Complete</p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step-by-Step Process */}
        <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-[#bf4520]" />
            <h3 className="text-base font-semibold text-[#2d3142]">Step-by-Step Process</h3>
          </div>
          <div className="space-y-2">
            {visa.steps.map((step, idx) => (
              <div key={idx} className="border border-[#2d3142]/5 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#f5f5f5] transition-colors"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleStep(idx); }}
                    className="shrink-0"
                  >
                    {completedSteps.has(idx) ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#2d3142]/30" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#bf4520]">Step {idx + 1}</span>
                      <span className={cn('text-sm font-medium', completedSteps.has(idx) ? 'text-[#2d3142]/40 line-through' : 'text-[#2d3142]')}>
                        {step.title}
                      </span>
                    </div>
                    <p className="text-xs text-[#2d3142]/50 mt-0.5">{step.timeline}</p>
                  </div>
                  <ChevronDown className={cn('w-4 h-4 text-[#2d3142]/30 transition-transform', expandedStep === idx && 'rotate-180')} />
                </button>
                {expandedStep === idx && (
                  <div className="px-3 pb-3 border-t border-[#2d3142]/5 pt-3 ml-8">
                    <p className="text-sm text-[#2d3142]/70 mb-2">{step.description}</p>
                    {step.documents && step.documents.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-[#2d3142]/50 mb-1">Documents for this step:</p>
                        {step.documents.map((doc, di) => (
                          <p key={di} className="text-xs text-[#2d3142]/60 ml-2">• {doc}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Required Documents Checklist */}
        <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-[#bf4520]" />
            <h3 className="text-base font-semibold text-[#2d3142]">Required Documents</h3>
            <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600 border-0">
              {checkedDocs.size}/{visa.requiredDocuments.length} ready
            </Badge>
          </div>
          <div className="space-y-2">
            {visa.requiredDocuments.map((doc, idx) => (
              <div
                key={idx}
                onClick={() => toggleDoc(idx)}
                className="flex items-start gap-3 p-2 rounded-md hover:bg-[#f5f5f5] cursor-pointer transition-colors"
              >
                {checkedDocs.has(idx) ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-[#2d3142]/30 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={cn('text-sm', checkedDocs.has(idx) ? 'text-[#2d3142]/40 line-through' : 'text-[#2d3142]')}>
                    {doc.name}
                    {doc.required && <span className="text-[#bf4520] ml-1">*</span>}
                  </p>
                  {doc.notes && <p className="text-xs text-[#2d3142]/50 mt-0.5">{doc.notes}</p>}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#2d3142]/40 mt-2">* Required document</p>
        </div>

        {/* Fees Breakdown */}
        <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-[#bf4520]" />
            <h3 className="text-base font-semibold text-[#2d3142]">Visa & Application Fees</h3>
          </div>
          <div className="space-y-2">
            {visa.fees.map((fee, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-[#2d3142]/5 last:border-0">
                <span className="text-sm text-[#2d3142]">{fee.item}</span>
                <div className="text-right">
                  <span className="text-sm font-medium text-[#2d3142]">{fee.amount}</span>
                  <span className="text-xs text-[#bf4520] ml-2">{fee.amountBDT}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Processing Time */}
        <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-[#bf4520]" />
            <h3 className="text-base font-semibold text-[#2d3142]">Processing Time</h3>
          </div>
          <div className="space-y-2">
            {visa.processingTime.map((pt, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-md bg-[#f5f5f5]">
                <div>
                  <p className="text-sm font-medium text-[#2d3142]">{pt.type}</p>
                  <p className="text-xs text-[#2d3142]/50">{pt.cost}</p>
                </div>
                <Badge variant="outline" className="text-xs border-[#bf4520]/30 text-[#bf4520]">{pt.duration}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Rejection Reasons */}
        <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-semibold text-[#2d3142]">Common Rejection Reasons</h3>
          </div>
          <div className="space-y-2">
            {visa.rejectionReasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-xs text-amber-500 mt-0.5">⚠</span>
                <p className="text-sm text-[#2d3142]/70">{reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Post-Study Work */}
        <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-[#bf4520]" />
            <h3 className="text-base font-semibold text-[#2d3142]">Post-Study Work Options</h3>
          </div>
          <div className="space-y-3">
            {visa.postStudyWork.map((psw, idx) => (
              <div key={idx} className="p-3 rounded-md bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-emerald-800">{psw.visaName}</p>
                  <Badge className="bg-emerald-600 text-white border-0 text-[10px]">{psw.duration}</Badge>
                </div>
                <p className="text-xs text-emerald-700">{psw.requirements}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-[#bf4520]" />
            <h3 className="text-base font-semibold text-[#2d3142]">Tips & Warnings</h3>
          </div>
          <div className="space-y-2">
            {visa.tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-[#bf4520] mt-0.5">💡</span>
                <p className="text-sm text-[#2d3142]/70">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#bf4520] rounded-lg p-6 text-center text-white">
          <h3 className="text-lg font-semibold mb-2">Need Expert Visa Guidance?</h3>
          <p className="text-sm opacity-90 mb-4">ALO Education&apos;s visa team has a 95%+ success rate. Let us handle your visa application.</p>
          <Button onClick={onLeadOpen} className="bg-white text-[#bf4520] hover:bg-white/90">
            Book Visa Consultation
          </Button>
        </div>
      </div>
    </div>
  );
}
