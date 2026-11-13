import { db } from '@/lib/db';
import { normalizePhone } from '@/lib/phone-normalization';
import { getWhatsAppAccessToken, getWhatsAppGraphVersion } from '@/lib/whatsapp-config';
import { MAIN_NUMBER, COO_NUMBER } from '@/lib/whatsapp-number-pool';

// Compatibility exports now reflect operator configuration only; empty values
// intentionally disable sender routing until a real number is configured.
export const ALO_MAIN_WHATSAPP_NUMBER = MAIN_NUMBER;
export const ALO_URGENT_SUPPORT_NUMBER = COO_NUMBER;
const MAIN_NORMALIZED = normalizePhone(MAIN_NUMBER);
const MAX_CONNECTION_CHECK_AGE_MS = 24 * 60 * 60 * 1000;

export type AuthorizedWhatsAppSender = {
  id: string;
  phoneNumber: string;
  normalizedPhone: string;
  metaPhoneNumberId: string;
  ownerType: string;
  employeeOwnerId: string;
  fallbackUsed: boolean;
  fallbackReason: string;
};

function isRecentlyVerified(number: {
  connectionStatus: string;
  activeStatus: string;
  lastConnectionCheckAt: Date | null;
  lastConnectionCheckError: string;
  metaPhoneNumberId: string;
}) {
  const age = number.lastConnectionCheckAt ? Date.now() - number.lastConnectionCheckAt.getTime() : -1;
  return number.activeStatus === 'active'
    && number.connectionStatus === 'connected'
    && /^\d+$/.test(number.metaPhoneNumberId.trim())
    && !number.lastConnectionCheckError
    && age >= 0
    && age <= MAX_CONNECTION_CHECK_AGE_MS;
}

async function isAuthorizedForActor(number: {
  ownerType: string;
  employeeOwnerId: string;
  branch: string;
  department: string;
}, actorId?: string | null): Promise<boolean> {
  const ownerType = number.ownerType.toUpperCase();
  if (ownerType === 'ALO_MAIN') return true;
  if (!actorId) return false;
  const actor = await db.employee.findFirst({
    where: { userId: actorId, status: 'active' },
    select: { userId: true, branch: true, department: true },
  }).catch(() => null);
  if (!actor) return false;
  if (ownerType === 'EMPLOYEE') {
    if (!number.employeeOwnerId) return false;
    const owner = await db.employee.findFirst({
      where: { OR: [
        { id: number.employeeOwnerId },
        { userId: number.employeeOwnerId },
        { employeeId: number.employeeOwnerId },
      ], status: 'active' },
      select: { userId: true },
    }).catch(() => null);
    return !!owner && owner.userId === actorId;
  }
  if (ownerType === 'BRANCH') return !!number.branch && actor.branch === number.branch;
  if (ownerType === 'DEPARTMENT') return !!number.department && actor.department === number.department;
  // The COO line is reserved for urgent escalation, not employee assignment.
  return ownerType === 'COO' && ['coo', 'executive'].includes(actor.department.toLowerCase());
}

/** Resolve a real, recently verified Meta number. Never uses an unverified ID. */
export async function resolveAuthorizedWhatsAppSender(preferredPhone?: string | null, actorId?: string | null): Promise<{
  sender: AuthorizedWhatsAppSender | null;
  error: string | null;
}> {
  const accessToken = getWhatsAppAccessToken();
  const graphVersion = getWhatsAppGraphVersion();
  if (!accessToken || !graphVersion) {
    return { sender: null, error: 'WHATSAPP_CLOUD_API_NOT_CONFIGURED' };
  }
  if (!MAIN_NORMALIZED) {
    return { sender: null, error: 'WHATSAPP_MAIN_NUMBER_NOT_CONFIGURED' };
  }

  const preferredNormalized = normalizePhone(preferredPhone || MAIN_NUMBER);
  try {
    const preferred = preferredNormalized
      ? await db.whatsAppOfficialNumber.findUnique({ where: { normalizedPhone: preferredNormalized } })
      : null;
    const preferredVerified = !!preferred && isRecentlyVerified(preferred);
    const preferredAuthorized = preferredVerified && await isAuthorizedForActor(preferred, actorId);
    if (preferred && preferredVerified && preferredAuthorized) {
      return {
        sender: {
          id: preferred.id,
          phoneNumber: preferred.phoneNumber,
          normalizedPhone: preferred.normalizedPhone,
          metaPhoneNumberId: preferred.metaPhoneNumberId,
          ownerType: preferred.ownerType,
          employeeOwnerId: preferred.employeeOwnerId,
          fallbackUsed: false,
          fallbackReason: '',
        },
        error: null,
      };
    }

    const main = preferredNormalized === MAIN_NORMALIZED
      ? preferred
      : await db.whatsAppOfficialNumber.findUnique({ where: { normalizedPhone: MAIN_NORMALIZED } });
    if (!main || !isRecentlyVerified(main) || !await isAuthorizedForActor(main, actorId)) {
      return { sender: null, error: 'NO_RECENTLY_VERIFIED_OFFICIAL_NUMBER' };
    }
    const fallbackReason = !preferredVerified
      ? 'PREFERRED_NUMBER_NOT_VERIFIED; MAIN_NUMBER_FALLBACK'
      : !preferredAuthorized
        ? 'PREFERRED_NUMBER_NOT_AUTHORIZED; MAIN_NUMBER_FALLBACK'
        : 'MAIN_NUMBER_FALLBACK';
    return {
      sender: {
        id: main.id,
        phoneNumber: main.phoneNumber,
        normalizedPhone: main.normalizedPhone,
        metaPhoneNumberId: main.metaPhoneNumberId,
        ownerType: main.ownerType,
        employeeOwnerId: main.employeeOwnerId,
        fallbackUsed: preferredNormalized !== MAIN_NORMALIZED,
        fallbackReason: preferredNormalized !== MAIN_NORMALIZED ? fallbackReason : '',
      },
      error: null,
    };
  } catch {
    return { sender: null, error: 'OFFICIAL_NUMBER_REGISTRY_UNAVAILABLE' };
  }
}
