/**
 * ALO Education — partner branding persistence and resolution.
 *
 * Pure validation lives in `branding.ts`. This file owns everything that needs
 * the database:
 *   • reading/writing one branding row per B2B tenant
 *   • deciding which partner (if any) a signed-in student belongs to
 *
 * The resolution order for a student is deliberately conservative — the first
 * authoritative link wins, and a partner is returned only when the student is
 * genuinely attached to it:
 *   1. PortalStudentProfile (the portal record that carries partnerId)
 *   2. the student's own Application rows (partnerId recorded at intake)
 *   3. the lead the student was converted from (Lead has no partnerId column,
 *      so this step uses the lead's partner reference only when present)
 */

import { db } from '@/lib/db';
import {
  buildPartnerFooterTheme,
  validatePartnerBranding,
  type PartnerBrandingInput,
  type PartnerBrandingView,
  type PartnerFooterTheme,
} from './branding';

const SELECT = {
  partnerId: true,
  displayName: true,
  tagline: true,
  logoUrl: true,
  primaryColor: true,
  secondaryColor: true,
  accentColor: true,
  websiteUrl: true,
  supportEmail: true,
  supportPhone: true,
  showInFooter: true,
  updatedAt: true,
} as const;

type BrandingRow = {
  partnerId: string;
  displayName: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  websiteUrl: string;
  supportEmail: string;
  supportPhone: string;
  showInFooter: boolean;
  updatedAt: Date;
};

function toView(row: BrandingRow): PartnerBrandingView {
  return {
    partnerId: row.partnerId,
    displayName: row.displayName,
    tagline: row.tagline,
    logoUrl: row.logoUrl,
    primaryColor: row.primaryColor,
    secondaryColor: row.secondaryColor,
    accentColor: row.accentColor,
    websiteUrl: row.websiteUrl,
    supportEmail: row.supportEmail,
    supportPhone: row.supportPhone,
    showInFooter: row.showInFooter,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  };
}

export async function getPartnerBranding(partnerId: string): Promise<PartnerBrandingView | null> {
  if (!partnerId) return null;
  const row = await db.partnerBranding.findUnique({ where: { partnerId }, select: SELECT });
  return row ? toView(row) : null;
}

export async function savePartnerBranding(input: {
  partnerId: string;
  branding: PartnerBrandingInput;
  updatedById: string;
}): Promise<{ ok: true; branding: PartnerBrandingView } | { ok: false; error: string; field?: string }> {
  if (!input.partnerId) return { ok: false, error: 'Partner identity is required.' };
  const validated = validatePartnerBranding(input.branding);
  if (!validated.ok) return validated;

  const row = await db.partnerBranding.upsert({
    where: { partnerId: input.partnerId },
    create: {
      partnerId: input.partnerId,
      ...validated.value,
      updatedById: input.updatedById,
    },
    update: {
      ...validated.value,
      updatedById: input.updatedById,
    },
    select: SELECT,
  });
  return { ok: true, branding: toView(row) };
}

/**
 * The partner a student belongs to, or null for a direct ALO student.
 * Never fabricated: any lookup failure degrades to "no partner branding",
 * which shows the general ALO footer only.
 */
export async function resolveStudentPartnerId(student: {
  id: string;
  studentId?: string;
}): Promise<string> {
  try {
    const profile = await db.portalStudentProfile.findFirst({
      where: { studentId: student.studentId || student.id },
      select: { partnerId: true },
    });
    if (profile?.partnerId) return profile.partnerId;
  } catch {
    /* fall through to the application link */
  }

  try {
    const application = await db.application.findFirst({
      where: { studentId: student.id, partnerId: { not: '' } },
      select: { partnerId: true },
      orderBy: { createdAt: 'desc' },
    });
    if (application?.partnerId) return application.partnerId;
  } catch {
    /* no partner link */
  }

  return '';
}

/** Branding for the footer block added to a B2B-linked student's portal. */
export async function getStudentPartnerBranding(student: {
  id: string;
  studentId?: string;
}): Promise<PartnerBrandingView | null> {
  const partnerId = await resolveStudentPartnerId(student);
  if (!partnerId) return null;
  return getPartnerBranding(partnerId);
}

/** Branding for a partner's own users (they see their own footer branding). */
export async function getPartnerUserBranding(userId: string): Promise<PartnerBrandingView | null> {
  if (!userId) return null;
  try {
    const profile = await db.partnerProfile.findUnique({
      where: { userId },
      select: { partnerId: true, companyName: true },
    });
    if (!profile?.partnerId) return null;
    const branding = await getPartnerBranding(profile.partnerId);
    if (branding) return branding;
    // A partner who has not customised anything yet still gets their company
    // name in their own portal footer — but with ALO colours, never invented.
    if (!profile.companyName) return null;
    return {
      partnerId: profile.partnerId,
      displayName: profile.companyName,
      tagline: '',
      logoUrl: '',
      primaryColor: '#0066CC',
      secondaryColor: '#F37021',
      accentColor: '#FFB347',
      websiteUrl: '',
      supportEmail: '',
      supportPhone: '',
      showInFooter: true,
      updatedAt: null,
    };
  } catch {
    return null;
  }
}

export function themeFor(branding: PartnerBrandingView): PartnerFooterTheme {
  return buildPartnerFooterTheme(branding);
}
