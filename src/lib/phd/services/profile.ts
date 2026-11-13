import { db } from '@/lib/db';
import type { ProfileUpdateInput } from '../validation';
import type { PhdActor } from '../auth';
import { recordPhdAudit } from '../audit';

/**
 * Columns declared as required `@db.Text` in MySQL have no database default, so
 * a freshly provisioned profile must write an explicit empty string. Keeping
 * these as '' (not null) preserves the "unknown vs not applicable" distinction
 * used everywhere else in the PhD module.
 */
const EMPTY_PROFILE_TEXT = {
  relevantModules: '',
  methodsExperience: '',
  publications: '',
  researchExperience: '',
  employmentHistory: '',
  existingResearchIdea: '',
  researchSetting: '',
  equipmentNeeds: '',
  personalDeadlines: '',
} as const;

export async function getOrCreateProfile(userId: string) {
  const existing = await db.phdProfile.findUnique({
    where: { userId },
    include: { interests: true },
  });
  if (existing) return existing;
  return db.phdProfile.create({
    data: { userId, ...EMPTY_PROFILE_TEXT },
    include: { interests: true },
  });
}

export interface ProfileView {
  id: string;
  completedAt: Date | null;
  onboardingStep: number;
  privacyAcceptedAt: Date | null;
  fields: Record<string, string | string[] | Date | null>;
  interests: Array<{ kind: string; value: string }>;
  completion: number;
}

const REQUIRED_FOR_COMPLETION = [
  'highestQualification', 'degreeSubject', 'awardingInstitution', 'classification',
  'primaryDiscipline', 'preferredMethods', 'studyMode', 'fundingRequirement', 'currentStage',
];

export function computeProfileCompletion(profile: {
  highestQualification: string;
  degreeSubject: string;
  awardingInstitution: string;
  classification: string;
  methodsExperience: string;
  primaryDiscipline: string;
  preferredMethods: string;
  studyMode: string;
  fundingRequirement: string;
  currentStage: string;
  researchSetting: string;
  existingResearchIdea: string;
}): number {
  const values: Record<string, string> = {
    highestQualification: profile.highestQualification,
    degreeSubject: profile.degreeSubject,
    awardingInstitution: profile.awardingInstitution,
    classification: profile.classification,
    methodsExperience: profile.methodsExperience,
    primaryDiscipline: profile.primaryDiscipline === 'UNDECIDED' ? '' : profile.primaryDiscipline,
    preferredMethods: profile.preferredMethods && profile.preferredMethods !== '[]' ? profile.preferredMethods : '',
    studyMode: profile.studyMode === 'UNDECIDED' ? '' : profile.studyMode,
    fundingRequirement: profile.fundingRequirement === 'UNDECIDED' ? '' : profile.fundingRequirement,
    currentStage: profile.currentStage,
    researchSetting: profile.researchSetting,
    existingResearchIdea: profile.existingResearchIdea,
  };
  const filled = Object.values(values).filter((value) => value && value.trim().length > 0).length;
  return Math.round((filled / Object.keys(values).length) * 100);
}

export function toProfileView(profile: Awaited<ReturnType<typeof getOrCreateProfile>>): ProfileView {
  return {
    id: profile.id,
    completedAt: profile.completedAt,
    onboardingStep: profile.onboardingStep,
    privacyAcceptedAt: profile.privacyAcceptedAt,
    interests: profile.interests.map((interest) => ({ kind: interest.kind, value: interest.value })),
    completion: computeProfileCompletion(profile),
    fields: {
      highestQualification: profile.highestQualification,
      degreeSubject: profile.degreeSubject,
      awardingInstitution: profile.awardingInstitution,
      gradeAwarded: profile.gradeAwarded,
      gpa: profile.gpa,
      classification: profile.classification,
      relevantModules: profile.relevantModules,
      dissertationTitle: profile.dissertationTitle,
      methodsExperience: profile.methodsExperience,
      publications: profile.publications,
      researchExperience: profile.researchExperience,
      employmentHistory: profile.employmentHistory,
      englishTestStatus: profile.englishTestStatus,
      englishTestType: profile.englishTestType,
      englishTestScore: profile.englishTestScore,
      englishTestDate: profile.englishTestDate,
      primaryDiscipline: profile.primaryDiscipline,
      existingResearchIdea: profile.existingResearchIdea,
      preferredMethods: parseMethods(profile.preferredMethods),
      researchSetting: profile.researchSetting,
      studyMode: profile.studyMode,
      desiredStart: profile.desiredStart,
      locationPreferences: profile.locationPreferences,
      fundingRequirement: profile.fundingRequirement,
      budgetRange: profile.budgetRange,
      equipmentNeeds: profile.equipmentNeeds,
      currentStage: profile.currentStage,
      existingDocuments: profile.existingDocuments,
      preferredContact: profile.preferredContact,
      personalDeadlines: profile.personalDeadlines,
    },
  };
}

export function parseMethods(value: string): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
}

export async function saveProfile(actor: PhdActor, input: ProfileUpdateInput) {
  const profile = await getOrCreateProfile(actor.userId);
  const {
    subjects, targetUniversities, locations, privacyAccepted, preferredMethods, englishTestDate,
    ...scalar
  } = input;

  // Optional text fields arrive as `null` when the applicant clears a box. The
  // underlying columns are required strings, so clearing is stored as ''.
  const scalarData: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(scalar)) {
    if (value === undefined) continue;
    // Text columns are required in MySQL; clearing a box is stored as ''. Numeric
    // and boolean columns must keep their native type.
    scalarData[key] = value === null
      ? ''
      : typeof value === 'number' || typeof value === 'boolean'
        ? value
        : String(value);
  }

  const updated = await db.phdProfile.update({
    where: { userId: actor.userId },
    data: {
      ...scalarData,
      ...(preferredMethods ? { preferredMethods: JSON.stringify(preferredMethods) } : {}),
      ...(englishTestDate !== undefined ? { englishTestDate: englishTestDate ? new Date(englishTestDate) : null } : {}),
      ...(privacyAccepted ? { privacyAcceptedAt: new Date() } : {}),
    },
  });

  if (privacyAccepted) await recordPhdAudit({ actor, action: 'PROFILE_PRIVACY_ACCEPTED', entityType: 'PhdProfile', entityId: updated.id });

  if (subjects || targetUniversities || locations) {
    await db.$transaction(async (tx) => {
      if (subjects) {
        await tx.phdProfileInterest.deleteMany({ where: { profileId: profile.id, kind: 'SUBJECT' } });
        if (subjects.length) {
          await tx.phdProfileInterest.createMany({
            data: subjects.map((value) => ({ profileId: profile.id, kind: 'SUBJECT', value: value.slice(0, 120) })),
            skipDuplicates: true,
          });
        }
      }
      if (targetUniversities) {
        await tx.phdProfileInterest.deleteMany({ where: { profileId: profile.id, kind: 'TARGET_UNIVERSITY' } });
        if (targetUniversities.length) {
          await tx.phdProfileInterest.createMany({
            data: targetUniversities.map((value) => ({ profileId: profile.id, kind: 'TARGET_UNIVERSITY', value: value.slice(0, 120) })),
            skipDuplicates: true,
          });
        }
      }
      if (locations) {
        await tx.phdProfileInterest.deleteMany({ where: { profileId: profile.id, kind: 'LOCATION' } });
        if (locations.length) {
          await tx.phdProfileInterest.createMany({
            data: locations.map((value) => ({ profileId: profile.id, kind: 'LOCATION', value: value.slice(0, 120) })),
            skipDuplicates: true,
          });
        }
      }
    });
  }

  const withInterests = await db.phdProfile.findUniqueOrThrow({
    where: { userId: actor.userId },
    include: { interests: true },
  });

  // Completing the profile means the required fields are populated; the applicant
  // can still edit it afterwards without losing the completion marker.
  const completion = computeProfileCompletion(withInterests);
  const missing = REQUIRED_FOR_COMPLETION.filter((field) => {
    const value = (withInterests as unknown as Record<string, unknown>)[field];
    return !value || (typeof value === 'string' && (!value.trim() || value === 'UNDECIDED' || value === '[]'));
  });
  if (completion >= 70 && missing.length === 0 && !withInterests.completedAt) {
    await db.phdProfile.update({ where: { id: withInterests.id }, data: { completedAt: new Date() } });
  }

  return db.phdProfile.findUniqueOrThrow({
    where: { userId: actor.userId },
    include: { interests: true },
  });
}
