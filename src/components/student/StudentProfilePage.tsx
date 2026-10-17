'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Users,
  DollarSign,
  Phone,
  GraduationCap,
  BookOpen,
  Languages,
  Briefcase,
  UserCheck,
  ShieldAlert,
  Target,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  Bell,
  FileText,
  Loader2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import FormBDocumentsSection from '@/components/student/FormBDocumentsSection';

// ============================================================
// TYPES
// ============================================================

interface EducationEntry {
  id: string;
  academicLevel: string;
  institution: string;
  groupSubject: string;
  resultType: string;
  resultScore: string;
  duration: string;
  startYear: string;
  startMonth: string;
  endYear: string;
  endMonth: string;
  countryOfStudy: string;
  cityOfStudy: string;
  boardName: string;
  primaryLanguage: string;
  studyGap: string;
}

interface WorkExpEntry {
  id: string;
  companyName: string;
  designation: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  salaryMode: string;
  jobRole: string;
}

interface VisaRefusalEntry {
  id: string;
  country: string;
  visaType: string;
  rejectionDate: string;
  reason: string;
  /** Document id returned by the upload API once evidence is attached. */
  evidenceDocumentId?: string;
  evidenceFileName?: string;
}

interface ReferralEntry {
  id: string;
  name: string;
  designation: string;
  department: string;
  organization: string;
  email: string;
  contactNumber: string;
  officeAddress: string;
}

interface VisaEntry {
  country: string;
  visaType: string;
}

interface ImmigrationEntry {
  country: string;
  visaType: string;
  programTitle: string;
  institute: string;
  intake: string;
}

type SectionKey =
  | 'lead'
  | 'personal'
  | 'funding'
  | 'contact'
  | 'education'
  | 'passport'
  | 'english'
  | 'work'
  | 'reference'
  | 'background'
  | 'admission'
  | 'documents';

const SECTION_KEYS: SectionKey[] = [
  'lead',
  'personal',
  'funding',
  'contact',
  'education',
  'passport',
  'english',
  'work',
  'reference',
  'background',
  'admission',
  'documents',
];

const SECTION_LABELS: Record<SectionKey, string> = {
  lead: 'Lead Information',
  personal: 'Personal Information',
  funding: 'Funding Information',
  contact: 'Contact Information',
  education: 'Education History',
  passport: 'Passport Details',
  english: 'English Test Score',
  work: 'Work Experience',
  reference: 'Reference',
  background: 'Background & Visa',
  admission: 'Admission Preference',
  documents: 'Documents & Verification',
};

const SECTION_ICONS: Record<SectionKey, React.ReactNode> = {
  lead: <User className="size-4" />,
  personal: <Users className="size-4" />,
  funding: <DollarSign className="size-4" />,
  contact: <Phone className="size-4" />,
  education: <GraduationCap className="size-4" />,
  passport: <BookOpen className="size-4" />,
  english: <Languages className="size-4" />,
  work: <Briefcase className="size-4" />,
  reference: <UserCheck className="size-4" />,
  background: <ShieldAlert className="size-4" />,
  admission: <Target className="size-4" />,
  documents: <FileText className="size-4" />,
};

const DESTINATIONS = [
  'UK',
  'USA',
  'Canada',
  'Australia',
  'Germany',
  'Netherlands',
  'Sweden',
  'Denmark',
  'New Zealand',
  'Ireland',
  'Malaysia',
  'Japan',
  'Other',
];

const ACADEMIC_LEVELS = [
  'SSC/Grade 10',
  'HSC/Grade 12',
  'Bachelor 3yr',
  'Bachelor 4yr',
  'Masters',
  'PGD',
  'PhD',
];

const RESULT_TYPES = ['GPA', 'Percentage', 'Division'];

const TEST_NAMES = [
  'IELTS',
  'IELTS UKVI',
  'OIETC ELLT',
  'PTE',
  'TOEFL',
  'GRE',
  'GMAT',
  'CAE',
  'ESOL',
  'ELSA',
  'OET',
  'SAT',
  'ACT',
  'CELPIP',
  'DET Duolingo',
  'Other',
];

const VISA_TYPES = [
  'Business Visitor',
  'Refugee',
  'Dependent',
  'Student',
  'Tourist',
  'Migration',
  'Visa Extension',
  'Short Term Student',
  'Tier 5',
  'Child Visitor',
  'ILR',
  'Citizen',
  'Settled',
  'Pre Settled',
];

const STUDY_LEVELS = [
  'Foundation',
  'Undergraduate',
  'Pre-Master',
  'Masters',
  'PhD',
  'PGD',
  'Certificate',
  'Diploma',
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ============================================================
// MOCK DATA
// ============================================================

const MOCK_EDUCATIONS: EducationEntry[] = [
  {
    id: 'edu-1',
    academicLevel: 'SSC/Grade 10',
    institution: 'Dhaka Residential Model College',
    groupSubject: 'Science',
    resultType: 'GPA',
    resultScore: '5.00',
    duration: '2 Years',
    startYear: '2017',
    startMonth: 'January',
    endYear: '2018',
    endMonth: 'December',
    countryOfStudy: 'Bangladesh',
    cityOfStudy: 'Dhaka',
    boardName: 'Dhaka Board',
    primaryLanguage: 'English',
    studyGap: 'no',
  },
  {
    id: 'edu-2',
    academicLevel: 'HSC/Grade 12',
    institution: 'Notre Dame College, Dhaka',
    groupSubject: 'Science',
    resultType: 'GPA',
    resultScore: '4.80',
    duration: '2 Years',
    startYear: '2019',
    startMonth: 'January',
    endYear: '2020',
    endMonth: 'December',
    countryOfStudy: 'Bangladesh',
    cityOfStudy: 'Dhaka',
    boardName: 'Dhaka Board',
    primaryLanguage: 'English',
    studyGap: 'no',
  },
];

const uid = () => Math.random().toString(36).slice(2, 10);

// ============================================================
// FORM FIELD HELPERS
// ============================================================

function FormField({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-semibold text-slate-900 mb-1">{children}</h3>
  );
}

function SectionDesc({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-slate-500 mb-6">{children}</p>
  );
}

// ============================================================
// SECTION A: LEAD INFORMATION
// ============================================================

function LeadSection({ form, setForm }: { form: Record<string, unknown>; setForm: (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void }) {
  const set = (key: string, val: unknown) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>Lead Information</SectionTitle>
        <SectionDesc>Basic lead details for this student record.</SectionDesc>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Given Name">
          <Input
            value={(form.givenName as string) || ''}
            onChange={(e) => set('givenName', e.target.value)}
            placeholder="Rahim"
            className="border-slate-200"
          />
        </FormField>
        <FormField label="Family Name">
          <Input
            value={(form.familyName as string) || ''}
            onChange={(e) => set('familyName', e.target.value)}
            placeholder="Hossain"
            className="border-slate-200"
          />
        </FormField>
      </div>

      <FormField label="Email">
        <Input
          type="email"
          value={(form.leadEmail as string) || ''}
          onChange={(e) => set('leadEmail', e.target.value)}
          placeholder="rahim.hossain@email.com"
          className="border-slate-200"
        />
      </FormField>

      <FormField label="Mobile">
        <div className="flex gap-2">
          <Select
            value={(form.countryCode as string) || '+880'}
            onValueChange={(v) => set('countryCode', v)}
          >
            <SelectTrigger className="w-28 border-slate-200">
              <SelectValue placeholder="+880" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="+880">+880</SelectItem>
              <SelectItem value="+1">+1</SelectItem>
              <SelectItem value="+44">+44</SelectItem>
              <SelectItem value="+61">+61</SelectItem>
              <SelectItem value="+91">+91</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={(form.mobile as string) || ''}
            onChange={(e) => set('mobile', e.target.value)}
            placeholder="1712-345678"
            className="border-slate-200 flex-1"
          />
        </div>
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Nationality">
          <Select
            value={(form.nationality as string) || 'Bangladeshi'}
            onValueChange={(v) => set('nationality', v)}
          >
            <SelectTrigger className="w-full border-slate-200">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bangladeshi">Bangladeshi</SelectItem>
              <SelectItem value="Indian">Indian</SelectItem>
              <SelectItem value="Pakistani">Pakistani</SelectItem>
              <SelectItem value="Nepali">Nepali</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Gender">
          <Select
            value={(form.gender as string) || ''}
            onValueChange={(v) => set('gender', v)}
          >
            <SelectTrigger className="w-full border-slate-200">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
              <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <FormField label="Preferred Destination">
        <Select
          value={(form.preferredDestination as string) || ''}
          onValueChange={(v) => set('preferredDestination', v)}
        >
          <SelectTrigger className="w-full border-slate-200">
            <SelectValue placeholder="Select destination" />
          </SelectTrigger>
          <SelectContent>
            {DESTINATIONS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Summary / Remarks">
        <Textarea
          value={(form.remarks as string) || ''}
          onChange={(e) => set('remarks', e.target.value)}
          placeholder="Any additional notes about this lead..."
          rows={3}
          className="border-slate-200 resize-none"
        />
      </FormField>

      <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
        <div>
          <Label className="text-sm font-medium text-slate-700">Welcome Email</Label>
          <p className="text-xs text-slate-500 mt-0.5">Send welcome email to this student</p>
        </div>
        <Switch
          checked={(form.welcomeEmail as boolean) || false}
          onCheckedChange={(v) => set('welcomeEmail', v)}
        />
      </div>
    </div>
  );
}

// ============================================================
// SECTION B: PERSONAL INFORMATION
// ============================================================

function PersonalSection({ form, setForm }: { form: Record<string, unknown>; setForm: (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void }) {
  const set = (key: string, val: unknown) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>Personal Information</SectionTitle>
        <SectionDesc>Core personal details. Some fields are pre-filled from lead information.</SectionDesc>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Given Name">
          <Input
            value={(form.givenName as string) || ''}
            onChange={(e) => set('givenName', e.target.value)}
            placeholder="Rahim"
            className="border-slate-200"
          />
        </FormField>
        <FormField label="Family Name">
          <Input
            value={(form.familyName as string) || ''}
            onChange={(e) => set('familyName', e.target.value)}
            placeholder="Hossain"
            className="border-slate-200"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Email">
          <Input
            type="email"
            value={(form.personalEmail as string) || ''}
            onChange={(e) => set('personalEmail', e.target.value)}
            placeholder="rahim.hossain@email.com"
            className="border-slate-200"
          />
        </FormField>
        <FormField label="Mobile">
          <Input
            value={(form.personalPhone as string) || ''}
            onChange={(e) => set('personalPhone', e.target.value)}
            placeholder="+880 1712-345678"
            className="border-slate-200"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Date of Birth">
          <Input
            type="date"
            value={(form.dateOfBirth as string) || ''}
            onChange={(e) => set('dateOfBirth', e.target.value)}
            className="border-slate-200"
          />
        </FormField>
        <FormField label="Nationality">
          <Select
            value={(form.personalNationality as string) || 'Bangladeshi'}
            onValueChange={(v) => set('personalNationality', v)}
          >
            <SelectTrigger className="w-full border-slate-200">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bangladeshi">Bangladeshi</SelectItem>
              <SelectItem value="Indian">Indian</SelectItem>
              <SelectItem value="Pakistani">Pakistani</SelectItem>
              <SelectItem value="Nepali">Nepali</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Gender">
          <Select
            value={(form.personalGender as string) || ''}
            onValueChange={(v) => set('personalGender', v)}
          >
            <SelectTrigger className="w-full border-slate-200">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
              <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Marital Status">
          <Select
            value={(form.maritalStatus as string) || ''}
            onValueChange={(v) => set('maritalStatus', v)}
          >
            <SelectTrigger className="w-full border-slate-200">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Single">Single</SelectItem>
              <SelectItem value="Married">Married</SelectItem>
              <SelectItem value="Divorced">Divorced</SelectItem>
              <SelectItem value="Widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <FormField label="Present Address">
        <Textarea
          value={(form.presentAddress as string) || ''}
          onChange={(e) => set('presentAddress', e.target.value)}
          placeholder="House 12, Road 5, Dhanmondi, Dhaka-1205"
          rows={3}
          className="border-slate-200 resize-none"
        />
      </FormField>

      <FormField label="Permanent Address">
        <Textarea
          value={(form.permanentAddress as string) || ''}
          onChange={(e) => set('permanentAddress', e.target.value)}
          placeholder="Village: Balia, Post: Balia, Police Station: Savar, District: Dhaka"
          rows={3}
          className="border-slate-200 resize-none"
        />
      </FormField>

      <div className="flex items-center gap-2">
        <Checkbox
          id="sameAsPresent"
          checked={(form.sameAsPresent as boolean) || false}
          onCheckedChange={(v) => {
            set('sameAsPresent', v);
            if (v) {
              set('permanentAddress', (form.presentAddress as string) || '');
            }
          }}
        />
        <Label htmlFor="sameAsPresent" className="text-sm text-slate-700 cursor-pointer">
          Same as Present Address
        </Label>
      </div>
    </div>
  );
}

// ============================================================
// SECTION C: FUNDING INFORMATION
// ============================================================

function FundingSection({ form, setForm }: { form: Record<string, unknown>; setForm: (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void }) {
  const set = (key: string, val: unknown) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const isMarried = (form.maritalStatus as string) === 'Married';
  const fundSources = (form.fundSources as string[]) || [];

  const toggleFundSource = (source: string) => {
    const current = fundSources.includes(source)
      ? fundSources.filter((s) => s !== source)
      : [...fundSources, source];
    set('fundSources', current);
  };

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>Funding Information</SectionTitle>
        <SectionDesc>
          {isMarried
            ? 'Funding details for your studies including dependent information.'
            : 'How will you fund your studies abroad?'}
        </SectionDesc>
      </div>

      <FormField label="Funding Status">
        <Select
          value={(form.fundingStatus as string) || ''}
          onValueChange={(v) => set('fundingStatus', v)}
        >
          <SelectTrigger className="w-full border-slate-200">
            <SelectValue placeholder="Select funding status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Self Funded">Self Funded</SelectItem>
            <SelectItem value="Partially Funded">Partially Funded</SelectItem>
            <SelectItem value="Fully Sponsored">Fully Sponsored</SelectItem>
            <SelectItem value="Scholarship">Scholarship</SelectItem>
            <SelectItem value="Bank Loan">Bank Loan</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Sponsor">
        <Select
          value={(form.sponsorType as string) || ''}
          onValueChange={(v) => set('sponsorType', v)}
        >
          <SelectTrigger className="w-full border-slate-200">
            <SelectValue placeholder="Select sponsor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Applicant">Applicant</SelectItem>
            <SelectItem value="Parents">Parents</SelectItem>
            <SelectItem value="Sibling">Sibling</SelectItem>
            <SelectItem value="Dependent">Dependent</SelectItem>
            <SelectItem value="Others">Others</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Source of Fund">
        <div className="grid grid-cols-2 gap-3 mt-1">
          {['Self-Funded', 'Loan Support', 'Scholarship', 'Other'].map((source) => (
            <div key={source} className="flex items-center gap-2">
              <Checkbox
                id={`fund-${source}`}
                checked={fundSources.includes(source)}
                onCheckedChange={() => toggleFundSource(source)}
              />
              <Label htmlFor={`fund-${source}`} className="text-sm text-slate-700 cursor-pointer">
                {source}
              </Label>
            </div>
          ))}
        </div>
      </FormField>

      {isMarried && (
        <>
          <div className="border-t border-slate-200 pt-4 mt-2">
            <p className="text-sm font-medium text-slate-700 mb-3">Married Applicant Details</p>
          </div>

          <FormField label="Applicant Status">
            <Select
              value={(form.applicantStatus as string) || ''}
              onValueChange={(v) => set('applicantStatus', v)}
            >
              <SelectTrigger className="w-full border-slate-200">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Primary">Primary Applicant</SelectItem>
                <SelectItem value="Dependent">Dependent</SelectItem>
                <SelectItem value="Joint">Joint Applicant</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Number of Dependents">
            <Input
              type="number"
              min={0}
              value={(form.noOfDependents as number) || 0}
              onChange={(e) => set('noOfDependents', parseInt(e.target.value) || 0)}
              className="border-slate-200 w-32"
            />
          </FormField>
        </>
      )}
    </div>
  );
}

// ============================================================
// SECTION D: CONTACT INFORMATION
// ============================================================

function ContactSection({ form, setForm }: { form: Record<string, unknown>; setForm: (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void }) {
  const set = (key: string, val: unknown) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>Contact Information</SectionTitle>
        <SectionDesc>Your contact details and emergency contact information.</SectionDesc>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Primary Email">
          <Input
            type="email"
            value={(form.primaryEmail as string) || ''}
            onChange={(e) => set('primaryEmail', e.target.value)}
            placeholder="rahim.hossain@email.com"
            className="border-slate-200"
          />
        </FormField>
        <FormField label="Alternative Email">
          <Input
            type="email"
            value={(form.altEmail as string) || ''}
            onChange={(e) => set('altEmail', e.target.value)}
            placeholder="rahim.alt@email.com"
            className="border-slate-200"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Mobile Number">
          <Input
            value={(form.contactPhone as string) || ''}
            onChange={(e) => set('contactPhone', e.target.value)}
            placeholder="+880 1712-345678"
            className="border-slate-200"
          />
        </FormField>
        <FormField label="Alternative Number">
          <Input
            value={(form.altPhone as string) || ''}
            onChange={(e) => set('altPhone', e.target.value)}
            placeholder="+880 1800-123456"
            className="border-slate-200"
          />
        </FormField>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <p className="text-sm font-medium text-slate-700 mb-4">Emergency Contact</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Emergency Contact Name">
          <Input
            value={(form.emergencyName as string) || ''}
            onChange={(e) => set('emergencyName', e.target.value)}
            placeholder="Abdul Hossain"
            className="border-slate-200"
          />
        </FormField>
        <FormField label="Relation">
          <Select
            value={(form.emergencyRelation as string) || ''}
            onValueChange={(v) => set('emergencyRelation', v)}
          >
            <SelectTrigger className="w-full border-slate-200">
              <SelectValue placeholder="Select relation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Parent">Parent</SelectItem>
              <SelectItem value="Sibling">Sibling</SelectItem>
              <SelectItem value="Spouse">Spouse</SelectItem>
              <SelectItem value="Friend">Friend</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Emergency Email">
          <Input
            type="email"
            value={(form.emergencyEmail as string) || ''}
            onChange={(e) => set('emergencyEmail', e.target.value)}
            placeholder="abdul.hossain@email.com"
            className="border-slate-200"
          />
        </FormField>
        <FormField label="Emergency Mobile">
          <Input
            value={(form.emergencyPhone as string) || ''}
            onChange={(e) => set('emergencyPhone', e.target.value)}
            placeholder="+880 1812-987654"
            className="border-slate-200"
          />
        </FormField>
      </div>
    </div>
  );
}

// ============================================================
// SECTION E: EDUCATION HISTORY
// ============================================================

/** One blank education row — shared by "Add Education" and the highest-qualification seeder. */
function emptyEducationEntry(): EducationEntry {
  return {
    id: uid(),
    academicLevel: '',
    institution: '',
    groupSubject: '',
    resultType: 'GPA',
    resultScore: '',
    duration: '',
    startYear: '',
    startMonth: '',
    endYear: '',
    endMonth: '',
    countryOfStudy: 'Bangladesh',
    cityOfStudy: '',
    boardName: '',
    primaryLanguage: 'English',
    studyGap: 'no',
  };
}

function EducationSection({ form, setForm }: { form: Record<string, unknown>; setForm: (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void }) {
  const set = (key: string, val: unknown) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const educations: EducationEntry[] = (form.educations as EducationEntry[]) || MOCK_EDUCATIONS;

  // Spec B) "Highest Qualification dropdown selects default visible sections".
  // Choosing a level opens every level up to it (SSC → HSC → Bachelor …) as an
  // empty row, so a student never has to remember the ladder. Existing rows are
  // never overwritten, and "Add Education" still adds rows without limit.
  const HIGHEST_QUALIFICATION_LADDER = [
    'SSC/O Level',
    'HSC/A Level',
    'Diploma',
    'Bachelor',
    'Master',
  ];
  const seedForQualification = (highest: string) => {
    const targetIndex = HIGHEST_QUALIFICATION_LADDER.indexOf(highest);
    if (targetIndex < 0) return;
    const levelsToOpen = HIGHEST_QUALIFICATION_LADDER.slice(0, targetIndex + 1);
    const missing = levelsToOpen
      .filter((level) => !educations.some((edu) => (edu.academicLevel || '').trim() === level))
      .map((level) => ({
        ...emptyEducationEntry(),
        academicLevel: level,
      }));
    if (missing.length === 0) return;
    set('educations', [...educations, ...missing]);
  };

  const addEducation = () => {
    set('educations', [...educations, emptyEducationEntry()]);
  };

  const updateEducation = (id: string, field: keyof EducationEntry, val: string) => {
    set(
      'educations',
      educations.map((edu) => (edu.id === id ? { ...edu, [field]: val } : edu))
    );
  };

  const removeEducation = (id: string) => {
    set('educations', educations.filter((edu) => edu.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <SectionTitle>Education History</SectionTitle>
          <SectionDesc>Add your education history starting from the most recent.</SectionDesc>
        </div>
        <Button
          type="button"
          onClick={addEducation}
          className="bg-[#0057B8] hover:bg-[#003d82] text-white shrink-0"
        >
          <Plus className="size-4 mr-1.5" />
          Add Education
        </Button>
      </div>

      <Card className="border border-slate-200 rounded-xl p-4 bg-slate-50">
        <FormField label="Highest Qualification">
          <Select
            value={(form.highestQualification as string) || ''}
            onValueChange={(value) => {
              set('highestQualification', value);
              seedForQualification(value);
            }}
          >
            <SelectTrigger className="w-full border-slate-200 bg-white">
              <SelectValue placeholder="Select your highest completed (or expected) qualification" />
            </SelectTrigger>
            <SelectContent>
              {HIGHEST_QUALIFICATION_LADDER.map((level) => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <p className="mt-2 text-xs text-slate-500">
          Selecting a level opens the matching sections below automatically. You can still add another qualification
          (unlimited) or remove any row.
        </p>
      </Card>

      {educations.length === 0 && (
        <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center">
          <GraduationCap className="size-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No education entries yet. Click &quot;Add Education&quot; to get started.</p>
        </div>
      )}

      {educations.map((edu) => (
        <Card key={edu.id} className="border border-slate-200 rounded-xl p-5 bg-white">
          <div className="flex items-start justify-between mb-4">
            <Badge variant="outline" className="text-xs font-medium border-[#0057B8] text-[#0057B8]">
              {edu.academicLevel || 'New Entry'}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeEducation(edu.id)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Academic Level">
              <Select
                value={edu.academicLevel}
                onValueChange={(v) => updateEducation(edu.id, 'academicLevel', v)}
              >
                <SelectTrigger className="w-full border-slate-200">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Institution">
              <Input
                value={edu.institution}
                onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                placeholder="Institution name"
                className="border-slate-200"
              />
            </FormField>
            <FormField label="Group / Subject">
              <Input
                value={edu.groupSubject}
                onChange={(e) => updateEducation(edu.id, 'groupSubject', e.target.value)}
                placeholder="e.g. Science, Business"
                className="border-slate-200"
              />
            </FormField>
            <FormField label="Result Type">
              <Select
                value={edu.resultType}
                onValueChange={(v) => updateEducation(edu.id, 'resultType', v)}
              >
                <SelectTrigger className="w-full border-slate-200">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {RESULT_TYPES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Result Score">
              <Input
                value={edu.resultScore}
                onChange={(e) => updateEducation(edu.id, 'resultScore', e.target.value)}
                placeholder="e.g. 5.00 or 85%"
                className="border-slate-200"
              />
            </FormField>
            <FormField label="Duration">
              <Input
                value={edu.duration}
                onChange={(e) => updateEducation(edu.id, 'duration', e.target.value)}
                placeholder="e.g. 2 Years"
                className="border-slate-200"
              />
            </FormField>
            <FormField label="Start Year">
              <Input
                value={edu.startYear}
                onChange={(e) => updateEducation(edu.id, 'startYear', e.target.value)}
                placeholder="2019"
                className="border-slate-200"
              />
            </FormField>
            <FormField label="Start Month">
              <Select
                value={edu.startMonth}
                onValueChange={(v) => updateEducation(edu.id, 'startMonth', v)}
              >
                <SelectTrigger className="w-full border-slate-200">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="End Year">
              <Input
                value={edu.endYear}
                onChange={(e) => updateEducation(edu.id, 'endYear', e.target.value)}
                placeholder="2020"
                className="border-slate-200"
              />
            </FormField>
            <FormField label="End Month">
              <Select
                value={edu.endMonth}
                onValueChange={(v) => updateEducation(edu.id, 'endMonth', v)}
              >
                <SelectTrigger className="w-full border-slate-200">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Country of Study">
              <Input
                value={edu.countryOfStudy}
                onChange={(e) => updateEducation(edu.id, 'countryOfStudy', e.target.value)}
                placeholder="Bangladesh"
                className="border-slate-200"
              />
            </FormField>
            <FormField label="City of Study">
              <Input
                value={edu.cityOfStudy}
                onChange={(e) => updateEducation(edu.id, 'cityOfStudy', e.target.value)}
                placeholder="Dhaka"
                className="border-slate-200"
              />
            </FormField>
            <FormField label="Board Name">
              <Input
                value={edu.boardName}
                onChange={(e) => updateEducation(edu.id, 'boardName', e.target.value)}
                placeholder="Dhaka Board"
                className="border-slate-200"
              />
            </FormField>
            <FormField label="Primary Language">
              <Input
                value={edu.primaryLanguage}
                onChange={(e) => updateEducation(edu.id, 'primaryLanguage', e.target.value)}
                placeholder="English"
                className="border-slate-200"
              />
            </FormField>
            <div className="col-span-full">
              <div className="flex items-center gap-3 mt-1">
                <Label className="text-sm font-medium text-slate-700">Study Gap</Label>
                <RadioGroup
                  value={edu.studyGap}
                  onValueChange={(v) => updateEducation(edu.id, 'studyGap', v)}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="yes" id={`gap-yes-${edu.id}`} />
                    <Label htmlFor={`gap-yes-${edu.id}`} className="text-sm text-slate-600 cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="no" id={`gap-no-${edu.id}`} />
                    <Label htmlFor={`gap-no-${edu.id}`} className="text-sm text-slate-600 cursor-pointer">No</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ============================================================
// SECTION F: PASSPORT DETAILS
// ============================================================

function PassportSection({ form, setForm }: { form: Record<string, unknown>; setForm: (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void }) {
  const set = (key: string, val: unknown) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const hasPassport = (form.hasPassport as string) || 'no';

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>Passport Details</SectionTitle>
        <SectionDesc>Provide your passport information.</SectionDesc>
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Do you have a passport?
        </Label>
        <RadioGroup
          value={hasPassport}
          onValueChange={(v) => set('hasPassport', v)}
          className="flex gap-4"
        >
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="yes" id="passport-yes" />
            <Label htmlFor="passport-yes" className="text-sm text-slate-600 cursor-pointer">Yes</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="no" id="passport-no" />
            <Label htmlFor="passport-no" className="text-sm text-slate-600 cursor-pointer">No</Label>
          </div>
        </RadioGroup>
      </div>

      {hasPassport === 'yes' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Passport Number">
            <Input
              value={(form.passportNumber as string) || ''}
              onChange={(e) => set('passportNumber', e.target.value)}
              placeholder="AB1234567"
              className="border-slate-200"
            />
          </FormField>
          <FormField label="Place of Issue">
            <Input
              value={(form.passportIssuePlace as string) || ''}
              onChange={(e) => set('passportIssuePlace', e.target.value)}
              placeholder="Dhaka"
              className="border-slate-200"
            />
          </FormField>
          <FormField label="Issue Date">
            <Input
              type="date"
              value={(form.passportIssueDate as string) || ''}
              onChange={(e) => set('passportIssueDate', e.target.value)}
              className="border-slate-200"
            />
          </FormField>
          <FormField label="Expiry Date">
            <Input
              type="date"
              value={(form.passportExpiry as string) || ''}
              onChange={(e) => set('passportExpiry', e.target.value)}
              className="border-slate-200"
            />
          </FormField>
          <FormField label="Issue Country">
            <Input
              value={(form.passportIssueCountry as string) || ''}
              onChange={(e) => set('passportIssueCountry', e.target.value)}
              placeholder="Bangladesh"
              className="border-slate-200"
            />
          </FormField>
          <FormField label="City of Birth">
            <Input
              value={(form.cityOfBirth as string) || ''}
              onChange={(e) => set('cityOfBirth', e.target.value)}
              placeholder="Dhaka"
              className="border-slate-200"
            />
          </FormField>
          <FormField label="Country of Birth">
            <Input
              value={(form.countryOfBirth as string) || ''}
              onChange={(e) => set('countryOfBirth', e.target.value)}
              placeholder="Bangladesh"
              className="border-slate-200"
            />
          </FormField>
        </div>
      ) : (
        <Card className="border border-blue-200 bg-blue-50 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-[#0057B8] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-900 mb-1">Apply for Passport</p>
              <p className="text-sm text-slate-600 mb-4">
                You will need a valid passport to apply for a student visa. We recommend applying as soon as possible as it can take 2-4 weeks to process.
              </p>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)"
                type="button"
                variant="outline"
                className="border-[#0057B8] text-[#0057B8] hover:bg-[#0057B8] hover:text-white"
              >
                <Bell className="size-4 mr-1.5" />
                Set Reminder
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// SECTION G: ENGLISH TEST SCORE
// ============================================================

function EnglishSection({ form, setForm }: { form: Record<string, unknown>; setForm: (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void }) {
  const set = (key: string, val: unknown) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const testStatus = (form.englishTestStatus as string) || 'no';
  const testName = (form.englishTestName as string) || '';
  const isGmat = testName === 'GMAT';
  const isDet = testName === 'DET Duolingo';
  const isSat = testName === 'SAT';

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>English Test Score</SectionTitle>
        <SectionDesc>Provide your English proficiency test details if available.</SectionDesc>
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Do you have an English Proficiency Test?
        </Label>
        <RadioGroup
          value={testStatus}
          onValueChange={(v) => set('englishTestStatus', v)}
          className="flex flex-wrap gap-4"
        >
          {['Yes', 'Yet to Receive', 'Planning For', 'No'].map((opt) => (
            <div key={opt} className="flex items-center gap-1.5">
              <RadioGroupItem value={opt} id={`eng-${opt.replace(/\s/g, '')}`} />
              <Label htmlFor={`eng-${opt.replace(/\s/g, '')}`} className="text-sm text-slate-600 cursor-pointer">
                {opt}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {(testStatus === 'Planning For' || testStatus === 'Yes') && (
        <>
          <FormField label="Test Name">
            <Select
              value={testName}
              onValueChange={(v) => set('englishTestName', v)}
            >
              <SelectTrigger className="w-full border-slate-200">
                <SelectValue placeholder="Select test" />
              </SelectTrigger>
              <SelectContent>
                {TEST_NAMES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </>
      )}

      {testStatus === 'Planning For' && (
        <FormField label="Planned Test Date">
          <Input
            type="date"
            value={(form.plannedTestDate as string) || ''}
            onChange={(e) => set('plannedTestDate', e.target.value)}
            className="border-slate-200 w-full sm:w-auto"
          />
        </FormField>
      )}

      {testStatus === 'Yes' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Test Date">
              <Input
                type="date"
                value={(form.englishTestDate as string) || ''}
                onChange={(e) => set('englishTestDate', e.target.value)}
                className="border-slate-200"
              />
            </FormField>
            <FormField label="Expiration Date">
              <Input
                type="date"
                value={(form.englishExpDate as string) || ''}
                onChange={(e) => set('englishExpDate', e.target.value)}
                className="border-slate-200"
              />
            </FormField>
            <FormField label="Certificate ID">
              <Input
                value={(form.englishCertId as string) || ''}
                onChange={(e) => set('englishCertId', e.target.value)}
                placeholder="Certificate ID"
                className="border-slate-200"
              />
            </FormField>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <p className="text-sm font-medium text-slate-700 mb-4">Test Scores</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <FormField label="Overall Score">
              <Input
                type="number"
                step="0.5"
                value={(form.englishOverall as number) || ''}
                onChange={(e) => set('englishOverall', parseFloat(e.target.value) || 0)}
                placeholder="7.0"
                className="border-slate-200"
              />
            </FormField>
            <FormField label="Listening">
              <Input
                type="number"
                step="0.5"
                value={(form.englishListening as number) || ''}
                onChange={(e) => set('englishListening', parseFloat(e.target.value) || 0)}
                placeholder="7.5"
                className="border-slate-200"
              />
            </FormField>
            <FormField label="Speaking">
              <Input
                type="number"
                step="0.5"
                value={(form.englishSpeaking as number) || ''}
                onChange={(e) => set('englishSpeaking', parseFloat(e.target.value) || 0)}
                placeholder="7.0"
                className="border-slate-200"
              />
            </FormField>
            <FormField label="Writing">
              <Input
                type="number"
                step="0.5"
                value={(form.englishWriting as number) || ''}
                onChange={(e) => set('englishWriting', parseFloat(e.target.value) || 0)}
                placeholder="6.5"
                className="border-slate-200"
              />
            </FormField>
            <FormField label="Reading">
              <Input
                type="number"
                step="0.5"
                value={(form.englishReading as number) || ''}
                onChange={(e) => set('englishReading', parseFloat(e.target.value) || 0)}
                placeholder="7.5"
                className="border-slate-200"
              />
            </FormField>
          </div>

          {isGmat && (
            <>
              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm font-medium text-slate-700 mb-4">GMAT Additional Scores</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <FormField label="AWA">
                  <Input type="number" step="0.5" value={(form.gmatAwa as number) || ''} onChange={(e) => set('gmatAwa', parseFloat(e.target.value) || 0)} className="border-slate-200" />
                </FormField>
                <FormField label="IR">
                  <Input type="number" step="1" value={(form.gmatIr as number) || ''} onChange={(e) => set('gmatIr', parseInt(e.target.value) || 0)} className="border-slate-200" />
                </FormField>
                <FormField label="Quantitative">
                  <Input type="number" step="1" value={(form.gmatQuant as number) || ''} onChange={(e) => set('gmatQuant', parseInt(e.target.value) || 0)} className="border-slate-200" />
                </FormField>
                <FormField label="Verbal">
                  <Input type="number" step="1" value={(form.gmatVerbal as number) || ''} onChange={(e) => set('gmatVerbal', parseInt(e.target.value) || 0)} className="border-slate-200" />
                </FormField>
              </div>
            </>
          )}

          {isDet && (
            <>
              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm font-medium text-slate-700 mb-4">DET Duolingo Additional Scores</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <FormField label="Literacy">
                  <Input type="number" step="5" value={(form.detLiteracy as number) || ''} onChange={(e) => set('detLiteracy', parseInt(e.target.value) || 0)} className="border-slate-200" />
                </FormField>
                <FormField label="Comprehension">
                  <Input type="number" step="5" value={(form.detComprehension as number) || ''} onChange={(e) => set('detComprehension', parseInt(e.target.value) || 0)} className="border-slate-200" />
                </FormField>
                <FormField label="Conversation">
                  <Input type="number" step="5" value={(form.detConversation as number) || ''} onChange={(e) => set('detConversation', parseInt(e.target.value) || 0)} className="border-slate-200" />
                </FormField>
                <FormField label="Production">
                  <Input type="number" step="5" value={(form.detProduction as number) || ''} onChange={(e) => set('detProduction', parseInt(e.target.value) || 0)} className="border-slate-200" />
                </FormField>
              </div>
            </>
          )}

          {isSat && (
            <>
              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm font-medium text-slate-700 mb-4">SAT Additional Scores</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <FormField label="Reading">
                  <Input type="number" step="10" value={(form.satReading as number) || ''} onChange={(e) => set('satReading', parseInt(e.target.value) || 0)} className="border-slate-200" />
                </FormField>
                <FormField label="Writing">
                  <Input type="number" step="10" value={(form.satWriting as number) || ''} onChange={(e) => set('satWriting', parseInt(e.target.value) || 0)} className="border-slate-200" />
                </FormField>
                <FormField label="Math">
                  <Input type="number" step="10" value={(form.satMath as number) || ''} onChange={(e) => set('satMath', parseInt(e.target.value) || 0)} className="border-slate-200" />
                </FormField>
                <FormField label="Essay">
                  <Input type="number" step="1" value={(form.satEssay as number) || ''} onChange={(e) => set('satEssay', parseInt(e.target.value) || 0)} className="border-slate-200" />
                </FormField>
              </div>
            </>
          )}
        </>
      )}

      {testStatus === 'No' && (
        <Card className="border border-blue-200 bg-blue-50 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-[#0057B8] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-900 mb-1">English Test Required</p>
              <p className="text-sm text-slate-600">
                Most universities require an English proficiency test score (IELTS, TOEFL, PTE, etc.) for admission. Please plan to take one as part of your application.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// SECTION H: WORK EXPERIENCE
// ============================================================

function WorkSection({ form, setForm }: { form: Record<string, unknown>; setForm: (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void }) {
  const set = (key: string, val: unknown) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const hasWorkExp = (form.hasWorkExp as string) || 'no';
  const workExps: WorkExpEntry[] = (form.workExperiences as WorkExpEntry[]) || [];

  const addWorkExp = () => {
    const newEntry: WorkExpEntry = {
      id: uid(),
      companyName: '',
      designation: '',
      startDate: '',
      endDate: '',
      currentlyWorking: false,
      salaryMode: '',
      jobRole: '',
    };
    set('workExperiences', [...workExps, newEntry]);
  };

  const updateWorkExp = (id: string, field: keyof WorkExpEntry, val: unknown) => {
    set(
      'workExperiences',
      workExps.map((w) => (w.id === id ? { ...w, [field]: val } : w))
    );
  };

  const removeWorkExp = (id: string) => {
    set('workExperiences', workExps.filter((w) => w.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>Work Experience</SectionTitle>
        <SectionDesc>Add any relevant work experience you may have.</SectionDesc>
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Do you have work experience?
        </Label>
        <RadioGroup
          value={hasWorkExp}
          onValueChange={(v) => set('hasWorkExp', v)}
          className="flex gap-4"
        >
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="yes" id="work-yes" />
            <Label htmlFor="work-yes" className="text-sm text-slate-600 cursor-pointer">Yes</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="no" id="work-no" />
            <Label htmlFor="work-no" className="text-sm text-slate-600 cursor-pointer">No</Label>
          </div>
        </RadioGroup>
      </div>

      {hasWorkExp === 'yes' && (
        <>
          <Button
            type="button"
            onClick={addWorkExp}
            className="bg-[#0057B8] hover:bg-[#003d82] text-white"
          >
            <Plus className="size-4 mr-1.5" />
            Add Work Experience
          </Button>

          {workExps.length === 0 && (
            <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center">
              <Briefcase className="size-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No work experience entries yet. Click &quot;Add Work Experience&quot; to get started.</p>
            </div>
          )}

          {workExps.map((exp) => (
            <Card key={exp.id} className="border border-slate-200 rounded-xl p-5 bg-white">
              <div className="flex items-start justify-between mb-4">
                <Badge variant="outline" className="text-xs font-medium border-[#0057B8] text-[#0057B8]">
                  {exp.companyName || 'New Entry'}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWorkExp(exp.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Company Name">
                  <Input
                    value={exp.companyName}
                    onChange={(e) => updateWorkExp(exp.id, 'companyName', e.target.value)}
                    placeholder="Company name"
                    className="border-slate-200"
                  />
                </FormField>
                <FormField label="Designation">
                  <Input
                    value={exp.designation}
                    onChange={(e) => updateWorkExp(exp.id, 'designation', e.target.value)}
                    placeholder="Job title"
                    className="border-slate-200"
                  />
                </FormField>
                <FormField label="Start Date">
                  <Input
                    type="date"
                    value={exp.startDate}
                    onChange={(e) => updateWorkExp(exp.id, 'startDate', e.target.value)}
                    className="border-slate-200"
                  />
                </FormField>
                <FormField label="End Date">
                  <Input
                    type="date"
                    value={exp.endDate}
                    onChange={(e) => updateWorkExp(exp.id, 'endDate', e.target.value)}
                    className="border-slate-200"
                    disabled={exp.currentlyWorking}
                  />
                </FormField>
                <div className="col-span-full flex items-center gap-2 mt-1">
                  <Checkbox
                    id={`current-${exp.id}`}
                    checked={exp.currentlyWorking}
                    onCheckedChange={(v) => updateWorkExp(exp.id, 'currentlyWorking', v)}
                  />
                  <Label htmlFor={`current-${exp.id}`} className="text-sm text-slate-700 cursor-pointer">
                    Currently Working Here
                  </Label>
                </div>
                <FormField label="Mode of Salary">
                  <Select
                    value={exp.salaryMode}
                    onValueChange={(v) => updateWorkExp(exp.id, 'salaryMode', v)}
                  >
                    <SelectTrigger className="w-full border-slate-200">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Job Role">
                  <Input
                    value={exp.jobRole}
                    onChange={(e) => updateWorkExp(exp.id, 'jobRole', e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="border-slate-200"
                  />
                </FormField>
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

// ============================================================
// SECTION I: REFERENCE / RECOMMENDATION
// ============================================================

function ReferenceSection({ form, setForm }: { form: Record<string, unknown>; setForm: (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void }) {
  const set = (key: string, val: unknown) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const hasReferral = (form.hasReferral as string) || 'no';

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>Reference / Recommendation</SectionTitle>
        <SectionDesc>Provide details of a referee who can recommend you.</SectionDesc>
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Do you have a reference?
        </Label>
        <RadioGroup
          value={hasReferral}
          onValueChange={(v) => set('hasReferral', v)}
          className="flex gap-4"
        >
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="yes" id="ref-yes" />
            <Label htmlFor="ref-yes" className="text-sm text-slate-600 cursor-pointer">Yes</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="no" id="ref-no" />
            <Label htmlFor="ref-no" className="text-sm text-slate-600 cursor-pointer">No</Label>
          </div>
        </RadioGroup>
      </div>

      {hasReferral === 'yes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Name">
            <Input
              value={(form.refName as string) || ''}
              onChange={(e) => set('refName', e.target.value)}
              placeholder="Dr. Anwarul Islam"
              className="border-slate-200"
            />
          </FormField>
          <FormField label="Designation">
            <Input
              value={(form.refDesignation as string) || ''}
              onChange={(e) => set('refDesignation', e.target.value)}
              placeholder="Professor"
              className="border-slate-200"
            />
          </FormField>
          <FormField label="Department">
            <Input
              value={(form.refDepartment as string) || ''}
              onChange={(e) => set('refDepartment', e.target.value)}
              placeholder="Computer Science & Engineering"
              className="border-slate-200"
            />
          </FormField>
          <FormField label="Organization">
            <Input
              value={(form.refOrganization as string) || ''}
              onChange={(e) => set('refOrganization', e.target.value)}
              placeholder="University of Dhaka"
              className="border-slate-200"
            />
          </FormField>
          <FormField label="Email">
            <Input
              type="email"
              value={(form.refEmail as string) || ''}
              onChange={(e) => set('refEmail', e.target.value)}
              placeholder="anwarul@du.ac.bd"
              className="border-slate-200"
            />
          </FormField>
          <FormField label="Contact Number">
            <Input
              value={(form.refPhone as string) || ''}
              onChange={(e) => set('refPhone', e.target.value)}
              placeholder="+880 1711-234567"
              className="border-slate-200"
            />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Office Address">
              <Textarea
                value={(form.refAddress as string) || ''}
                onChange={(e) => set('refAddress', e.target.value)}
                placeholder="Department of CSE, University of Dhaka, Dhaka-1000"
                rows={2}
                className="border-slate-200 resize-none"
              />
            </FormField>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SECTION J: BACKGROUND & VISA HISTORY
// ============================================================

function BackgroundSection({ form, setForm, token }: { form: Record<string, unknown>; setForm: (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void; token?: string | null }) {
  const set = (key: string, val: unknown) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  // Spec 8.1: a visa refusal must capture Country, Date, Reason AND evidence.
  // The evidence goes to the same private document store as section E, so the
  // counselor reviews it in one place and the student never loses the link.
  const [evidenceState, setEvidenceState] = useState<Record<string, 'idle' | 'uploading' | 'done' | 'error'>>({});
  const [evidenceError, setEvidenceError] = useState<Record<string, string>>({});
  const uploadRefusalEvidence = async (refusalId: string, file: File | undefined) => {
    if (!file) {
      setEvidenceError((prev) => ({ ...prev, [refusalId]: 'Choose a PDF or image file first.' }));
      return;
    }
    setEvidenceState((prev) => ({ ...prev, [refusalId]: 'uploading' }));
    setEvidenceError((prev) => ({ ...prev, [refusalId]: '' }));
    try {
      const body = new FormData();
      body.append('documentType', 'REFUSAL_LETTER');
      body.append('file', file);
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/student/documents', { method: 'POST', headers, credentials: 'include', body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Upload failed.');
      set('visaRefusals', visaRefusals.map((entry) => (entry.id === refusalId
        ? { ...entry, evidenceDocumentId: json.data?.id || '', evidenceFileName: file.name }
        : entry)));
      setEvidenceState((prev) => ({ ...prev, [refusalId]: 'done' }));
      if (typeof window !== 'undefined') {
        toast({ title: 'Refusal evidence uploaded', description: 'Your counselor can review it in the Documents section.' });
      }
    } catch (uploadFailure) {
      setEvidenceState((prev) => ({ ...prev, [refusalId]: 'error' }));
      setEvidenceError((prev) => ({ ...prev, [refusalId]: uploadFailure instanceof Error ? uploadFailure.message : 'Upload failed.' }));
    }
  };

  const hasVisa = (form.hasVisa as string) || 'no';
  const hasVisaRefusal = (form.hasVisaRefusal as string) || 'no';
  const hasImmigration = (form.hasImmigration as string) || 'no';
  const hasMedical = (form.hasMedical as string) || 'no';
  const hasCriminal = (form.hasCriminal as string) || 'no';

  const visas: VisaEntry[] = (form.visas as VisaEntry[]) || [];
  const visaRefusals: VisaRefusalEntry[] = (form.visaRefusals as VisaRefusalEntry[]) || [];
  const immigrations: ImmigrationEntry[] = (form.immigrations as ImmigrationEntry[]) || [];

  const addVisa = () => set('visas', [...visas, { country: '', visaType: '' }]);
  const updateVisa = (idx: number, field: keyof VisaEntry, val: string) =>
    set('visas', visas.map((v, i) => (i === idx ? { ...v, [field]: val } : v)));
  const removeVisa = (idx: number) => set('visas', visas.filter((_, i) => i !== idx));

  const addRefusal = () =>
    set('visaRefusals', [...visaRefusals, { id: uid(), country: '', visaType: '', rejectionDate: '', reason: '' }]);
  const updateRefusal = (id: string, field: keyof VisaRefusalEntry, val: string) =>
    set('visaRefusals', visaRefusals.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  const removeRefusal = (id: string) =>
    set('visaRefusals', visaRefusals.filter((r) => r.id !== id));

  const addImmigration = () =>
    set('immigrations', [...immigrations, { country: '', visaType: '', programTitle: '', institute: '', intake: '' }]);
  const updateImmigration = (idx: number, field: keyof ImmigrationEntry, val: string) =>
    set('immigrations', immigrations.map((im, i) => (i === idx ? { ...im, [field]: val } : im)));
  const removeImmigration = (idx: number) =>
    set('immigrations', immigrations.filter((_, i) => i !== idx));

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>Background &amp; Visa History</SectionTitle>
        <SectionDesc>Provide accurate information about your visa and background history.</SectionDesc>
      </div>

      {/* Has Visa */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Do you have any visa?
        </Label>
        <RadioGroup
          value={hasVisa}
          onValueChange={(v) => set('hasVisa', v)}
          className="flex gap-4"
        >
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="yes" id="bg-visa-yes" />
            <Label htmlFor="bg-visa-yes" className="text-sm text-slate-600 cursor-pointer">Yes</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="no" id="bg-visa-no" />
            <Label htmlFor="bg-visa-no" className="text-sm text-slate-600 cursor-pointer">No</Label>
          </div>
        </RadioGroup>
      </div>

      {hasVisa === 'yes' && (
        <div className="space-y-4">
          <Button type="button" variant="outline" onClick={addVisa} className="border-slate-200">
            <Plus className="size-4 mr-1.5" /> Add Visa
          </Button>
          {visas.map((v, idx) => (
            <Card key={idx} className="border border-slate-200 rounded-xl p-4 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Country">
                  <Input value={v.country} onChange={(e) => updateVisa(idx, 'country', e.target.value)} placeholder="Country" className="border-slate-200" />
                </FormField>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <FormField label="Visa Type">
                      <Select value={v.visaType} onValueChange={(val) => updateVisa(idx, 'visaType', val)}>
                        <SelectTrigger className="w-full border-slate-200">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {VISA_TYPES.map((vt) => (
                            <SelectItem key={vt} value={vt}>{vt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeVisa(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9 p-0 shrink-0 mb-0.5">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Visa Refusal */}
      <div className="border-t border-slate-200 pt-4">
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Do you have any visa refusal?
        </Label>
        <RadioGroup
          value={hasVisaRefusal}
          onValueChange={(v) => set('hasVisaRefusal', v)}
          className="flex gap-4"
        >
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="yes" id="bg-refusal-yes" />
            <Label htmlFor="bg-refusal-yes" className="text-sm text-slate-600 cursor-pointer">Yes</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="no" id="bg-refusal-no" />
            <Label htmlFor="bg-refusal-no" className="text-sm text-slate-600 cursor-pointer">No</Label>
          </div>
        </RadioGroup>
      </div>

      {hasVisaRefusal === 'yes' && (
        <div className="space-y-4">
          <Button type="button" variant="outline" onClick={addRefusal} className="border-slate-200">
            <Plus className="size-4 mr-1.5" /> Add Refusal
          </Button>
          {visaRefusals.map((r) => (
            <Card key={r.id} className="border border-slate-200 rounded-xl p-4 bg-white">
              <div className="flex items-start justify-between mb-3">
                <Badge variant="outline" className="text-xs font-medium border-red-300 text-red-600">
                  {r.country || 'Refusal Entry'}
                </Badge>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeRefusal(r.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0">
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Country">
                  <Input value={r.country} onChange={(e) => updateRefusal(r.id, 'country', e.target.value)} placeholder="Country" className="border-slate-200" />
                </FormField>
                <FormField label="Visa Type">
                  <Input value={r.visaType} onChange={(e) => updateRefusal(r.id, 'visaType', e.target.value)} placeholder="Visa type" className="border-slate-200" />
                </FormField>
                <FormField label="Rejection Date">
                  <Input type="date" value={r.rejectionDate} onChange={(e) => updateRefusal(r.id, 'rejectionDate', e.target.value)} className="border-slate-200" />
                </FormField>
                <FormField label="Reason">
                  <Input value={r.reason} onChange={(e) => updateRefusal(r.id, 'reason', e.target.value)} placeholder="Reason for refusal" className="border-slate-200" />
                </FormField>
                <FormField label="Evidence (refusal letter / decision notice)">
                  <div className="space-y-1">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                      onChange={(e) => void uploadRefusalEvidence(r.id, e.target.files?.[0])}
                      className="block w-full text-xs text-slate-600"
                    />
                    {evidenceState[r.id] === 'uploading' && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500"><Loader2 className="size-3 animate-spin" /> Uploading…</span>
                    )}
                    {r.evidenceFileName && evidenceState[r.id] !== 'error' && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700"><CheckCircle2 className="size-3" /> {r.evidenceFileName}</span>
                    )}
                    {evidenceError[r.id] && <span className="block text-[11px] text-red-600">{evidenceError[r.id]}</span>}
                  </div>
                </FormField>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Immigration history — optional free text, always visible (spec A) */}
      <div className="border-t border-slate-200 pt-4">
        <FormField label="Immigration history (optional)">
          <Textarea
            value={(form.immigrationHistory as string) || ''}
            onChange={(e) => set('immigrationHistory', e.target.value)}
            placeholder="Any travel, study or immigration history you want your counselor to know — including earlier applications, refusals, overstays or cancelled visas."
            rows={3}
            className="border-slate-200"
          />
        </FormField>
        <p className="mt-1 text-[11px] text-slate-500">Always visible. Leave it empty if nothing applies.</p>
      </div>

      {/* Immigration */}
      <div className="border-t border-slate-200 pt-4">
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Have you applied for any program / immigration?
        </Label>
        <RadioGroup
          value={hasImmigration}
          onValueChange={(v) => set('hasImmigration', v)}
          className="flex gap-4"
        >
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="yes" id="bg-imm-yes" />
            <Label htmlFor="bg-imm-yes" className="text-sm text-slate-600 cursor-pointer">Yes</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="no" id="bg-imm-no" />
            <Label htmlFor="bg-imm-no" className="text-sm text-slate-600 cursor-pointer">No</Label>
          </div>
        </RadioGroup>
      </div>

      {hasImmigration === 'yes' && (
        <div className="space-y-4">
          <Button type="button" variant="outline" onClick={addImmigration} className="border-slate-200">
            <Plus className="size-4 mr-1.5" /> Add Application
          </Button>
          {immigrations.map((im, idx) => (
            <Card key={idx} className="border border-slate-200 rounded-xl p-4 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Country">
                  <Input value={im.country} onChange={(e) => updateImmigration(idx, 'country', e.target.value)} placeholder="Country" className="border-slate-200" />
                </FormField>
                <FormField label="Visa Type">
                  <Input value={im.visaType} onChange={(e) => updateImmigration(idx, 'visaType', e.target.value)} placeholder="Visa type" className="border-slate-200" />
                </FormField>
                <FormField label="Program Title">
                  <Input value={im.programTitle} onChange={(e) => updateImmigration(idx, 'programTitle', e.target.value)} placeholder="Program title" className="border-slate-200" />
                </FormField>
                <FormField label="Institute">
                  <Input value={im.institute} onChange={(e) => updateImmigration(idx, 'institute', e.target.value)} placeholder="Institute name" className="border-slate-200" />
                </FormField>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <FormField label="Intake">
                      <Input value={im.intake} onChange={(e) => updateImmigration(idx, 'intake', e.target.value)} placeholder="e.g. September 2025" className="border-slate-200" />
                    </FormField>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeImmigration(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9 p-0 shrink-0 mb-0.5">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Medical & Criminal */}
      <div className="border-t border-slate-200 pt-4 space-y-4">
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-3 block">
            Do you have any medical condition?
          </Label>
          <RadioGroup value={hasMedical} onValueChange={(v) => set('hasMedical', v)} className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="yes" id="bg-med-yes" />
              <Label htmlFor="bg-med-yes" className="text-sm text-slate-600 cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="no" id="bg-med-no" />
              <Label htmlFor="bg-med-no" className="text-sm text-slate-600 cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700 mb-3 block">
            Do you have any criminal offense?
          </Label>
          <RadioGroup value={hasCriminal} onValueChange={(v) => set('hasCriminal', v)} className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="yes" id="bg-crim-yes" />
              <Label htmlFor="bg-crim-yes" className="text-sm text-slate-600 cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="no" id="bg-crim-no" />
              <Label htmlFor="bg-crim-no" className="text-sm text-slate-600 cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SECTION K: ADMISSION PREFERENCE
// ============================================================

function AdmissionSection({ form, setForm }: { form: Record<string, unknown>; setForm: (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void }) {
  const set = (key: string, val: unknown) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>Admission Preference</SectionTitle>
        <SectionDesc>Tell us about your study preferences for university applications.</SectionDesc>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Study Destination">
          <Select
            value={(form.studyDestination as string) || ''}
            onValueChange={(v) => set('studyDestination', v)}
          >
            <SelectTrigger className="w-full border-slate-200">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {DESTINATIONS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Study Level">
          <Select
            value={(form.studyLevel as string) || ''}
            onValueChange={(v) => set('studyLevel', v)}
          >
            <SelectTrigger className="w-full border-slate-200">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {STUDY_LEVELS.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Institute Type">
          <Input
            value={(form.instituteType as string) || ''}
            onChange={(e) => set('instituteType', e.target.value)}
            placeholder="e.g. Public University"
            className="border-slate-200"
          />
        </FormField>
        <FormField label="Institute Name">
          <Input
            value={(form.instituteName as string) || ''}
            onChange={(e) => set('instituteName', e.target.value)}
            placeholder="e.g. University of Manchester"
            className="border-slate-200"
          />
        </FormField>
        <FormField label="Study Area">
          <Input
            value={(form.studyArea as string) || ''}
            onChange={(e) => set('studyArea', e.target.value)}
            placeholder="e.g. Computer Science"
            className="border-slate-200"
          />
        </FormField>
        <FormField label="Program Title">
          <Input
            value={(form.programTitle as string) || ''}
            onChange={(e) => set('programTitle', e.target.value)}
            placeholder="e.g. MSc Computer Science"
            className="border-slate-200"
          />
        </FormField>
        <FormField label="Intake">
          <Input
            value={(form.intake as string) || ''}
            onChange={(e) => set('intake', e.target.value)}
            placeholder="e.g. September 2025"
            className="border-slate-200"
          />
        </FormField>
        <FormField label="Enrollment Priority">
          <Select
            value={(form.enrollmentChoice as string) || ''}
            onValueChange={(v) => set('enrollmentChoice', v)}
          >
            <SelectTrigger className="w-full border-slate-200">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1st">1st Choice</SelectItem>
              <SelectItem value="2nd">2nd Choice</SelectItem>
              <SelectItem value="3rd">3rd Choice</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Application Pathway">
          <Input
            value={(form.applicationPathway as string) || ''}
            onChange={(e) => set('applicationPathway', e.target.value)}
            placeholder="e.g. Direct, UCAS"
            className="border-slate-200"
          />
        </FormField>
        <FormField label="Pathway Provider">
          <Input
            value={(form.pathwayProvider as string) || ''}
            onChange={(e) => set('pathwayProvider', e.target.value)}
            placeholder="e.g. INTO, Kaplan"
            className="border-slate-200"
          />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Visa Type">
            <Select
              value={(form.visaType as string) || ''}
              onValueChange={(v) => set('visaType', v)}
            >
              <SelectTrigger className="w-full border-slate-200">
                <SelectValue placeholder="Select visa type" />
              </SelectTrigger>
              <SelectContent>
                {VISA_TYPES.map((vt) => (
                  <SelectItem key={vt} value={vt}>{vt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function StudentProfilePage() {
  const { token } = usePortalStore();

  const [activeTab, setActiveTab] = useState<SectionKey>('lead');
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const [profileCompletion, setProfileCompletion] = useState(45);
  // Reported by FormBDocumentsSection: { loaded, complete, pending, missing, rejected }
  const [documentsState, setDocumentsState] = useState({ loaded: false, complete: false, pending: 0, missing: 0, rejected: 0 });
  const [form, setForm] = useState<Record<string, unknown>>({
    // Lead
    givenName: 'Rahim',
    familyName: 'Hossain',
    leadEmail: 'rahim.hossain@email.com',
    countryCode: '+880',
    mobile: '1712-345678',
    nationality: 'Bangladeshi',
    gender: 'Male',
    preferredDestination: 'UK',
    remarks: 'Interested in MSc Computer Science at UK universities. Strong academic background with SSC GPA 5.00 and HSC GPA 4.80.',
    welcomeEmail: true,
    // Personal
    personalEmail: 'rahim.hossain@email.com',
    personalPhone: '+880 1712-345678',
    dateOfBirth: '2000-05-15',
    personalNationality: 'Bangladeshi',
    personalGender: 'Male',
    maritalStatus: 'Single',
    presentAddress: 'House 12, Road 5, Dhanmondi, Dhaka-1205',
    permanentAddress: 'Village: Balia, Post: Balia, Savar, Dhaka',
    sameAsPresent: false,
    // Funding
    fundingStatus: 'Self Funded',
    sponsorType: 'Parents',
    fundSources: ['Self-Funded', 'Loan Support'],
    // Contact
    primaryEmail: 'rahim.hossain@email.com',
    altEmail: '',
    contactPhone: '+880 1712-345678',
    altPhone: '+880 1800-123456',
    emergencyName: 'Abdul Hossain',
    emergencyEmail: 'abdul.hossain@email.com',
    emergencyPhone: '+880 1812-987654',
    emergencyRelation: 'Parent',
    // Education
    educations: MOCK_EDUCATIONS,
    // Passport
    hasPassport: 'yes',
    passportNumber: 'AB1234567',
    passportIssuePlace: 'Dhaka',
    passportIssueDate: '2021-03-10',
    passportExpiry: '2031-03-09',
    passportIssueCountry: 'Bangladesh',
    cityOfBirth: 'Dhaka',
    countryOfBirth: 'Bangladesh',
    // English
    englishTestStatus: 'Yes',
    englishTestName: 'IELTS',
    englishTestDate: '2024-09-15',
    englishExpDate: '2026-09-14',
    englishCertId: 'IELTS-24-BD-78901',
    englishOverall: 7.0,
    englishListening: 7.5,
    englishSpeaking: 7.0,
    englishWriting: 6.5,
    englishReading: 7.5,
    // Work
    hasWorkExp: 'yes',
    workExperiences: [
      {
        id: 'work-1',
        companyName: 'TechVista Solutions Ltd.',
        designation: 'Junior Software Developer',
        startDate: '2021-07-01',
        endDate: '2024-06-30',
        currentlyWorking: false,
        salaryMode: 'Bank Transfer',
        jobRole: 'Full Stack Developer',
      },
    ],
    // Reference
    hasReferral: 'yes',
    refName: 'Dr. Anwarul Islam',
    refDesignation: 'Professor',
    refDepartment: 'Computer Science & Engineering',
    refOrganization: 'University of Dhaka',
    refEmail: 'anwarul@du.ac.bd',
    refPhone: '+880 1711-234567',
    refAddress: 'Department of CSE, University of Dhaka, Dhaka-1000',
    // Background
    hasVisa: 'no',
    hasVisaRefusal: 'no',
    hasImmigration: 'no',
    visas: [],
    visaRefusals: [],
    immigrations: [],
    hasMedical: 'no',
    hasCriminal: 'no',
    // Admission
    studyDestination: 'UK',
    studyLevel: 'Masters',
    instituteType: 'Russell Group University',
    instituteName: 'University of Manchester',
    studyArea: 'Computer Science',
    programTitle: 'MSc Advanced Computer Science',
    intake: 'September 2025',
    enrollmentChoice: '1st',
    applicationPathway: 'Direct',
    pathwayProvider: '',
    visaType: 'Student',
  });

  // Load profile from API on mount
  useEffect(() => {
    async function loadProfile() {
      if (!token) { setProfileLoading(false); return; }
      try {
        const res = await fetch('/api/student-portal/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.data) {
          const p = json.data as Record<string, unknown>;
          // Populate form fields from API profile data
          const updates: Record<string, unknown> = {};
          if (p.givenName) updates.givenName = p.givenName;
          if (p.familyName) updates.familyName = p.familyName;
          if (p.dateOfBirth) updates.dateOfBirth = p.dateOfBirth;
          if (p.gender) { updates.personalGender = p.gender; updates.gender = p.gender; }
          if (p.nationality) { updates.personalNationality = p.nationality; updates.nationality = p.nationality; }
          if (p.city) updates.city = p.city;
          if (p.presentAddress) updates.presentAddress = p.presentAddress;
          if (p.permanentAddress) updates.permanentAddress = p.permanentAddress;
          if (p.passportNumber) updates.passportNumber = p.passportNumber;
          if (p.passportExpiry) updates.passportExpiry = p.passportExpiry;
          if (p.passportIssuePlace) updates.passportIssuePlace = p.passportIssuePlace;
          if (p.passportIssueDate) updates.passportIssueDate = p.passportIssueDate;
          if (p.passportIssueCountry) updates.passportIssueCountry = p.passportIssueCountry;
          if (p.cityOfBirth) updates.cityOfBirth = p.cityOfBirth;
          if (p.countryOfBirth) updates.countryOfBirth = p.countryOfBirth;
          if (p.preferredCountry) { updates.preferredDestination = p.preferredCountry; updates.studyDestination = p.preferredCountry; }
          if (p.preferredIntake) updates.intake = p.preferredIntake;
          if (p.preferredSubject) updates.studyArea = p.preferredSubject;
          if (p.preferredLevel) updates.studyLevel = p.preferredLevel;
          if (p.englishTestType) updates.englishTestName = p.englishTestType;
          if (p.englishScore) updates.englishOverall = p.englishScore;
          if (p.budget) updates.budget = p.budget;
          if (p.altEmail) updates.altEmail = p.altEmail;
          if (p.altPhone) updates.altPhone = p.altPhone;
          if (p.emergencyName) updates.emergencyName = p.emergencyName;
          if (p.emergencyEmail) updates.emergencyEmail = p.emergencyEmail;
          if (p.emergencyPhone) updates.emergencyPhone = p.emergencyPhone;
          if (p.emergencyRelation) updates.emergencyRelation = p.emergencyRelation;
          if (p.maritalStatus) updates.maritalStatus = p.maritalStatus;
          if (p.fundingStatus) updates.fundingStatus = p.fundingStatus;
          if (p.sponsorType) updates.sponsorType = p.sponsorType;
          if (p.fundSource) updates.fundSources = String(p.fundSource).split(',').map((s: string) => s.trim()).filter(Boolean);
          if (p.fullName) { updates.givenName = (p.fullName as string).split(' ')[0] || p.givenName; updates.familyName = (p.fullName as string).split(' ').slice(1).join(' ') || p.familyName; }
          if (p.profileCompletion !== undefined) setProfileCompletion(p.profileCompletion as number);
          if (p.hasPassport !== undefined) updates.hasPassport = p.hasPassport ? 'yes' : 'no';
          if (p.hasWorkExp !== undefined) updates.hasWorkExp = p.hasWorkExp ? 'yes' : 'no';
          if (p.hasReferral !== undefined) updates.hasReferral = p.hasReferral ? 'yes' : 'no';
          if (p.hasVisa !== undefined) updates.hasVisa = p.hasVisa ? 'yes' : 'no';
          if (p.hasVisaRefusal !== undefined) updates.hasVisaRefusal = p.hasVisaRefusal ? 'yes' : 'no';
          if (p.hasMedical !== undefined) updates.hasMedical = p.hasMedical ? 'yes' : 'no';
          if (p.hasCriminal !== undefined) updates.hasCriminal = p.hasCriminal ? 'yes' : 'no';
          // Handle related records
          if (p.educations && Array.isArray(p.educations) && p.educations.length > 0) {
            updates.educations = p.educations.map((e: Record<string, unknown>) => ({
              id: (e.id as string) || `edu-${Date.now()}`,
              academicLevel: e.academicLevel || '',
              institution: e.institution || '',
              groupSubject: e.groupSubject || '',
              resultType: e.resultType || '',
              resultScore: e.resultScore || '',
              duration: e.duration || '',
              startYear: e.startYear || '',
              startMonth: e.startMonth || '',
              endYear: e.endYear || '',
              endMonth: e.endMonth || '',
              countryOfStudy: e.countryOfStudy || '',
              cityOfStudy: e.cityOfStudy || '',
              boardName: e.boardName || '',
              primaryLanguage: e.primaryLanguage || '',
              studyGap: e.studyGap || '',
            }));
          }
          if (p.workExperiences && Array.isArray(p.workExperiences) && p.workExperiences.length > 0) {
            updates.workExperiences = p.workExperiences.map((w: Record<string, unknown>) => ({
              id: (w.id as string) || `work-${Date.now()}`,
              companyName: w.companyName || '',
              designation: w.designation || '',
              startDate: w.startDate || '',
              endDate: w.endDate || '',
              currentlyWorking: w.currentlyWorking || false,
              salaryMode: w.salaryMode || '',
              jobRole: w.jobRole || '',
            }));
          }
          if (Object.keys(updates).length > 0) {
            setForm(prev => ({ ...prev, ...updates }));
          }
        }
      } catch {
        // Fallback to default mock data already in state
      }
      setProfileLoading(false);
    }
    loadProfile();
  }, [token]);

  const activeIndex = SECTION_KEYS.indexOf(activeTab);

  const sectionComplete = useMemo(() => {
    const checks: Record<SectionKey, boolean> = {
      lead: !!(form.givenName && form.familyName && form.leadEmail),
      personal: !!(form.dateOfBirth && form.personalGender && form.maritalStatus),
      funding: !!(form.fundingStatus && form.sponsorType),
      contact: !!(form.primaryEmail && form.contactPhone),
      education: ((form.educations as EducationEntry[]) || []).length > 0,
      passport: (form.hasPassport as string) === 'no' || !!(form.passportNumber),
      english: (form.englishTestStatus as string) === 'no' || (form.englishTestStatus as string) === 'Planning For' || !!(form.englishOverall),
      work: (form.hasWorkExp as string) === 'no' || ((form.workExperiences as WorkExpEntry[]) || []).length > 0,
      reference: (form.hasReferral as string) === 'no' || !!(form.refName && form.refEmail),
      background: (form.hasVisa as string) === 'no' && (form.hasVisaRefusal as string) === 'no' && (form.hasImmigration as string) === 'no' && (form.hasMedical as string) === 'no' && (form.hasCriminal as string) === 'no',
      admission: !!(form.studyDestination && form.studyLevel && form.instituteName),
      // Form B section E) — required documents uploaded AND no rejected file
      // waiting on the student. The list itself is loaded by
      // FormBDocumentsSection; until it has loaded we do not claim completion.
      documents: documentsState.loaded && documentsState.complete,
    };
    return checks;
  }, [form, documentsState]);

  const completedCount = Object.values(sectionComplete).filter(Boolean).length;

  const goToPrev = useCallback(() => {
    if (activeIndex > 0) setActiveTab(SECTION_KEYS[activeIndex - 1]);
  }, [activeIndex]);

  const goToNext = useCallback(() => {
    if (activeIndex < SECTION_KEYS.length - 1) setActiveTab(SECTION_KEYS[activeIndex + 1]);
  }, [activeIndex]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/student-portal/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        if (json.data?.profileCompletion !== undefined) {
          setProfileCompletion(json.data.profileCompletion);
        }
        toast({ title: 'Profile saved successfully', description: 'Your changes have been saved.' });
      } else {
        toast({ title: 'Save failed', description: json.error || 'Could not save profile.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', description: 'Could not reach the server.', variant: 'destructive' });
    }
    setSaving(false);
  }, [form, activeTab, token]);

  const handleSaveAndContinue = useCallback(async () => {
    await handleSave();
    goToNext();
  }, [handleSave, goToNext]);

  // Mobile scroll to tab trigger
  const tabsListRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tabsListRef.current) {
      const activeTrigger = tabsListRef.current.querySelector(
        '[data-state="active"]'
      ) as HTMLElement;
      if (activeTrigger) {
        activeTrigger.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [activeTab]);

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(11)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Student Profile</h1>
            <p className="text-sm text-slate-500 mt-0.5">Complete your profile to unlock full features</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-slate-500">Profile Completion</span>
              <Badge
                className="text-white text-xs px-2.5 py-0.5"
                style={{ backgroundColor: profileCompletion >= 80 ? '#10B981' : profileCompletion >= 50 ? '#C93D13' : '#64748b' }}
              >
                {profileCompletion}%
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as SectionKey)}
          className="flex flex-col lg:flex-row gap-6"
        >
          {/* Sidebar / Tab Navigation */}
          <div className="lg:w-64 shrink-0">
            {/* Mobile: Horizontal Scrollable */}
            <div className="lg:hidden overflow-x-auto -mx-4 px-4 pb-2" ref={tabsListRef as React.RefObject<HTMLDivElement>}>
              <div className="flex gap-1 min-w-max">
                {SECTION_KEYS.map((key) => {
                  const isActive = activeTab === key;
                  const complete = sectionComplete[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                        ${isActive
                          ? 'bg-[#0057B8] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }
                      `}
                    >
                      {complete && !isActive && <CheckCircle2 className="size-3.5 text-green-500" />}
                      {isActive && SECTION_ICONS[key]}
                      {SECTION_LABELS[key]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop: Vertical List */}
            <div className="hidden lg:block sticky top-24">
              <nav className="space-y-1">
                {SECTION_KEYS.map((key, idx) => {
                  const isActive = activeTab === key;
                  const complete = sectionComplete[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
                        ${isActive
                          ? 'bg-[#0057B8] text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100'
                        }
                      `}
                    >
                      <span
                        className={`
                          flex items-center justify-center size-6 rounded-full text-xs font-bold shrink-0
                          ${isActive
                            ? 'bg-white/20 text-white'
                            : complete
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-500'
                          }
                        `}
                      >
                        {complete && !isActive ? (
                          <CheckCircle2 className="size-3.5" />
                        ) : (
                          idx + 1
                        )}
                      </span>
                      {SECTION_LABELS[key]}
                    </button>
                  );
                })}
              </nav>

              {/* Progress Card */}
              <Card className="mt-6 border border-slate-200 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500">Overall Progress</span>
                  <span className="text-sm font-bold text-[#C93D13]">{profileCompletion}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${profileCompletion}%`,
                      backgroundColor: profileCompletion >= 80 ? '#10B981' : '#C93D13',
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {completedCount} of {SECTION_KEYS.length} sections complete
                </p>
              </Card>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-w-0">
            <Card className="border border-slate-200 rounded-xl p-6 bg-white">
              <TabsContent value={activeTab} className="mt-0 outline-none">
                {activeTab === 'lead' && <LeadSection form={form} setForm={setForm} />}
                {activeTab === 'personal' && <PersonalSection form={form} setForm={setForm} />}
                {activeTab === 'funding' && <FundingSection form={form} setForm={setForm} />}
                {activeTab === 'contact' && <ContactSection form={form} setForm={setForm} />}
                {activeTab === 'education' && <EducationSection form={form} setForm={setForm} />}
                {activeTab === 'passport' && <PassportSection form={form} setForm={setForm} />}
                {activeTab === 'english' && <EnglishSection form={form} setForm={setForm} />}
                {activeTab === 'work' && <WorkSection form={form} setForm={setForm} />}
                {activeTab === 'reference' && <ReferenceSection form={form} setForm={setForm} />}
                {activeTab === 'background' && <BackgroundSection form={form} setForm={setForm} token={token} />}
                {activeTab === 'admission' && <AdmissionSection form={form} setForm={setForm} />}
                {activeTab === 'documents' && <FormBDocumentsSection token={token} onSummaryChange={setDocumentsState} />}
              </TabsContent>
            </Card>
          </div>
        </Tabs>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <p className="text-sm text-slate-500 hidden sm:block">
            Section <span className="font-semibold text-slate-900">{activeIndex + 1}</span> of <span className="font-semibold text-slate-900">11</span>
            <span className="mx-2 text-slate-300">|</span>
            Profile <span className="font-semibold" style={{ color: profileCompletion >= 80 ? '#10B981' : '#C93D13' }}>{profileCompletion}%</span> complete
          </p>
          <p className="text-sm text-slate-500 sm:hidden">
            {activeIndex + 1}/11 — {profileCompletion}%
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={goToPrev}
              disabled={activeIndex === 0}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft className="size-4 mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSave}
              disabled={saving}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Save className="size-4 mr-1" />
              <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
            </Button>
            {activeIndex < SECTION_KEYS.length - 1 ? (
              <Button
                type="button"
                onClick={handleSaveAndContinue}
                disabled={saving}
                className="bg-[#C93D13] hover:bg-[#9a3412] text-white"
              >
                Save &amp; Continue
                <ChevronRight className="size-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-[#C93D13] hover:bg-[#9a3412] text-white"
              >
                <Save className="size-4 mr-1" />
                {saving ? 'Saving...' : 'Complete Profile'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}