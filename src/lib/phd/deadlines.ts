import { DEADLINE_STATUSES, type VerificationStatus } from './constants';

export type DeadlineStatus = (typeof DEADLINE_STATUSES)[number];

export interface DeadlineInput {
  dueDate: Date | string | null | undefined;
  kind?: string;
  verificationStatus?: string | VerificationStatus;
  sourceUrl?: string | null;
  reminderDays?: number;
  timezone?: string | null;
}

export interface DeadlineAssessment {
  status: DeadlineStatus;
  label: string;
  daysRemaining: number | null;
  isOpen: boolean;
  isExpired: boolean;
  needsVerification: boolean;
  note: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function assessDeadline(input: DeadlineInput, now: Date = new Date()): DeadlineAssessment {
  const reminderDays = Math.max(1, input.reminderDays ?? 14);
  const verified = input.verificationStatus === 'VERIFIED_OFFICIAL' || input.verificationStatus === 'VERIFIED_MAY_BE_OUTDATED';
  const personal = input.kind === 'PERSONAL';

  if (!input.dueDate) {
    return {
      status: 'DATE_NOT_PUBLISHED',
      label: 'Date not published',
      daysRemaining: null,
      isOpen: false,
      isExpired: false,
      needsVerification: true,
      note: 'No closing date is recorded. Do not describe this opportunity as open or closed.',
    };
  }

  const due = input.dueDate instanceof Date ? input.dueDate : new Date(input.dueDate);
  if (Number.isNaN(due.getTime())) {
    return {
      status: 'NEEDS_VERIFICATION',
      label: 'Needs verification',
      daysRemaining: null,
      isOpen: false,
      isExpired: false,
      needsVerification: true,
      note: 'The recorded date could not be parsed. Re-enter it from the official source.',
    };
  }

  const daysRemaining = Math.ceil((due.getTime() - now.getTime()) / DAY_MS);
  if (daysRemaining < 0) {
    return {
      status: 'EXPIRED',
      label: 'Expired',
      daysRemaining,
      isOpen: false,
      isExpired: true,
      needsVerification: !verified && !personal,
      note: `The recorded closing date passed ${Math.abs(daysRemaining)} day(s) ago. An expired deadline must never be presented as open.`,
    };
  }

  if (!verified && !personal) {
    return {
      status: 'NEEDS_VERIFICATION',
      label: 'Needs verification',
      daysRemaining,
      isOpen: false,
      isExpired: false,
      needsVerification: true,
      note: `A date is recorded but has not been verified${input.sourceUrl ? '' : ' and has no source URL'}. Check the official page before relying on it.`,
    };
  }

  if (daysRemaining <= reminderDays) {
    return {
      status: 'CLOSING_SOON',
      label: 'Closing soon',
      daysRemaining,
      isOpen: true,
      isExpired: false,
      needsVerification: !verified && !personal,
      note: `Closing in ${daysRemaining} day(s). Time-zone rules${input.timezone ? ` (${input.timezone})` : ' are not specified'} can change the effective deadline.`,
    };
  }

  return {
    status: 'UPCOMING',
    label: 'Upcoming',
    daysRemaining,
    isOpen: true,
    isExpired: false,
    needsVerification: !verified && !personal,
    note: `Closing in ${daysRemaining} day(s).${verified ? '' : ' The date is not yet verified.'}`,
  };
}

export function isStale(lastVerifiedAt: Date | string | null | undefined, now: Date = new Date(), maxDays = 180): boolean {
  if (!lastVerifiedAt) return true;
  const verified = lastVerifiedAt instanceof Date ? lastVerifiedAt : new Date(lastVerifiedAt);
  if (Number.isNaN(verified.getTime())) return true;
  return now.getTime() - verified.getTime() > maxDays * DAY_MS;
}

export function nextVerificationDate(lastVerifiedAt: Date | string | null | undefined, days = 180, now: Date = new Date()): Date {
  const base = lastVerifiedAt ? new Date(lastVerifiedAt) : now;
  const validBase = Number.isNaN(base.getTime()) ? now : base;
  const next = new Date(validBase.getTime() + days * DAY_MS);
  // A re-verification date in the past is not actionable; schedule from today.
  return next.getTime() <= now.getTime() ? new Date(now.getTime() + days * DAY_MS) : next;
}
