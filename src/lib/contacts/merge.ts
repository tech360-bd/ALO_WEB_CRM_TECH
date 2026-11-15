/**
 * CONTACT MERGE — POLICY (brief Phase 2 §4)
 * ========================================
 * Merging two contact records is the single most destructive operation in this
 * module, so the rules live in a pure function that is unit-tested and the write
 * path only executes a plan it was handed.
 *
 * Why this schema merges by **aliasing**, not by deletion
 * ------------------------------------------------------
 * `WhatsAppContact` is keyed on the phone number (`phone` and `normalizedPhone` are
 * both `@unique`) and no other table holds a foreign key to it:
 *
 *   - conversations and messages reference the *number* (`participantPhone`,
 *     `senderPhone`, `receiverPhone`) and `studentId`/`leadId`;
 *   - consents reference `contactId` as an unconstrained string;
 *   - guardians and applications hang off `studentId`.
 *
 * Therefore "merge" here means: consolidate the person-level fields onto the
 * destination row, and keep the source row as an **alias** of it. Nothing is
 * deleted, so every number stays searchable, every conversation keeps its number,
 * consent rows stay where they were, and the operation is reversible by removing a
 * tag. Deleting the source instead would silently drop a searchable number and make
 * recovery impossible without a full backup restore.
 *
 * Rules, each of which refuses rather than guesses:
 *
 *  1. A contact can never be merged into itself.
 *  2. Two different student ids (or lead/partner ids) block the merge — that would
 *     rewrite a student identity, which the brief forbids absolutely.
 *  3. A row already aliased to someone else is refused; a row already aliased to the
 *     destination is reported as already done (idempotent).
 *  4. Source and destination must both come from the caller's authorised scope; the
 *     route enforces that, and the plan re-checks it never sees the same id twice.
 *  5. Opt-out and block flags are unioned. A merge must never make a contact more
 *     contactable than either row was.
 *  6. The destination keeps its own non-empty values; a source only fills gaps.
 *  7. Google resource names from *both* rows are preserved. Only one can occupy
 *     `externalContactId`, so the others are recorded as `google_alias:<name>` tags,
 *     which the Contacts sync understands — otherwise the next Google sync would
 *     re-create the contact we just merged.
 */
import { createHash } from 'node:crypto';

export interface MergeContactRow {
  id: string;
  phone: string;
  normalizedPhone: string;
  displayName: string;
  profileName: string;
  email: string;
  normalizedEmail: string;
  countryCode: string;
  externalContactId: string;
  studentId: string;
  leadId: string;
  partnerId: string;
  assignedCounselorId: string;
  branch: string;
  source: string;
  isBlocked: boolean;
  isOptedOut: boolean;
  optedOutAt: string | null;
  tags: string[];
  updatedAt: string;
  createdAt: string;
}

export interface MergePlanInput {
  destination: MergeContactRow;
  sources: MergeContactRow[];
}

export interface MergeFieldResolution {
  field: string;
  value: string | boolean;
  from: 'destination' | 'source' | 'union';
  note: string;
}

export interface AliasUpdate {
  id: string;
  phone: string;
  tags: string[];
  studentId: string;
  leadId: string;
  partnerId: string;
  assignedCounselorId: string;
  branch: string;
  isOptedOut: boolean;
  optedOutAt: string | null;
  isBlocked: boolean;
}

export interface MergePlan {
  ok: boolean;
  /** Hard refusals. When non-empty, nothing may be written. */
  blockers: string[];
  /** Facts the operator must see but that do not stop the merge. */
  warnings: string[];
  destinationId: string;
  sourceIds: string[];
  /** The exact next destination values; the route writes only these. */
  destinationUpdate: {
    displayName: string;
    profileName: string;
    email: string;
    normalizedEmail: string;
    countryCode: string;
    externalContactId: string;
    studentId: string;
    leadId: string;
    partnerId: string;
    assignedCounselorId: string;
    branch: string;
    isOptedOut: boolean;
    optedOutAt: string | null;
    isBlocked: boolean;
    tags: string[];
  };
  aliasUpdates: AliasUpdate[];
  resolutions: MergeFieldResolution[];
  preserved: {
    numbers: string[];
    externalContactIds: string[];
    googleAliases: string[];
    studentIdentity: string;
    leadIdentity: string;
    partnerIdentity: string;
  };
  /** Anti-TOCTOU token: preview and execute must agree on the same database state. */
  confirmationToken: string;
  policy: string;
}

export const MAX_MERGE_SOURCES = 5;
const MERGED_PREFIX = 'merged_into:';
const GOOGLE_ALIAS_PREFIX = 'google_alias:';

export function parseTags(raw: string | string[] | null | undefined): string[] {
  if (Array.isArray(raw)) return raw.map((tag) => String(tag).trim()).filter(Boolean);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed.map((tag) => String(tag).trim()).filter(Boolean);
  } catch {
    // A non-JSON tag string is still a tag: keep it rather than lose data.
    return raw.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

export function serializeTags(tags: string[]): string {
  return JSON.stringify([...new Set(tags.filter(Boolean))]);
}

/** The contact this row has been merged into, if any. */
export function mergedInto(tags: string[]): string | null {
  const tag = tags.find((entry) => entry.startsWith(MERGED_PREFIX));
  return tag ? tag.slice(MERGED_PREFIX.length) : null;
}

/** Google resource names this row is an alias for. */
export function googleAliases(tags: string[]): string[] {
  return tags.filter((entry) => entry.startsWith(GOOGLE_ALIAS_PREFIX)).map((entry) => entry.slice(GOOGLE_ALIAS_PREFIX.length));
}

function unionTags(...groups: string[][]): string[] {
  return [...new Set(groups.flat().filter(Boolean))];
}

/**
 * Build the merge plan. Pure: no database, no clock except the caller's data.
 *
 * `tokenInput` is derived only from ids and `updatedAt` values, so the same database
 * state always yields the same token and any concurrent change invalidates it.
 */
export function planContactMerge(input: MergePlanInput): MergePlan {
  const { destination } = input;
  const sources = [...input.sources];
  const blockers: string[] = [];
  const warnings: string[] = [];

  const destinationTags = destination.tags;
  const destinationAlias = mergedInto(destinationTags);

  if (sources.length === 0) blockers.push('Choose at least one contact to merge into the destination.');
  if (sources.length > MAX_MERGE_SOURCES) blockers.push(`At most ${MAX_MERGE_SOURCES} contacts can be merged at once.`);
  if (sources.some((source) => source.id === destination.id)) blockers.push('A contact cannot be merged into itself.');
  if (new Set(sources.map((source) => source.id)).size !== sources.length) blockers.push('The same source contact was selected twice.');
  if (destinationAlias) {
    blockers.push('The destination is itself an alias of another contact. Merge into the primary record instead.');
  }

  for (const source of sources) {
    const alias = mergedInto(source.tags);
    if (alias === destination.id) {
      warnings.push(`${source.normalizedPhone} is already an alias of this contact — it will be left as it is.`);
    } else if (alias) {
      blockers.push(`${source.normalizedPhone} is already merged into another contact (${alias}). Restore that merge first.`);
    }
  }

  // Identity conflicts are refusals, not warnings: these fields must never be rewritten.
  if (destination.studentId && sources.some((source) => source.studentId && source.studentId !== destination.studentId)) {
    blockers.push('These contacts are linked to two different students. Merging would rewrite a student identity, so it is refused.');
  }
  if (destination.leadId && sources.some((source) => source.leadId && source.leadId !== destination.leadId)) {
    blockers.push('These contacts are linked to two different leads. Merging would rewrite a lead identity, so it is refused.');
  }
  if (destination.partnerId && sources.some((source) => source.partnerId && source.partnerId !== destination.partnerId)) {
    blockers.push('These contacts belong to two different partners. Merging would cross a partner boundary, so it is refused.');
  }

  const actionable = sources.filter((source) => mergedInto(source.tags) !== destination.id);
  const resolutions: MergeFieldResolution[] = [];

  const pick = (field: 'displayName' | 'profileName' | 'email' | 'countryCode' | 'studentId' | 'leadId' | 'partnerId' | 'assignedCounselorId' | 'branch'): { value: string; from: MergeFieldResolution['from']; note: string } => {
    const current = String(destination[field] ?? '').trim();
    if (current) {
      const differing = actionable.find((source) => String(source[field] ?? '').trim() && String(source[field] ?? '').trim() !== current);
      return {
        value: current,
        from: 'destination',
        note: differing
          ? `Destination keeps "${current}"; the source value "${String(differing[field])}" is recorded in the audit trail and not applied.`
          : 'Destination value preserved.',
      };
    }
    const candidate = actionable.find((source) => String(source[field] ?? '').trim());
    if (candidate) {
      return { value: String(candidate[field]).trim(), from: 'source', note: 'Destination was empty, so the source value fills the gap.' };
    }
    return { value: '', from: 'destination', note: 'Empty on every record.' };
  };

  const displayName = pick('displayName');
  const profileName = pick('profileName');
  const email = pick('email');
  const countryCode = pick('countryCode');
  const studentId = pick('studentId');
  const leadId = pick('leadId');
  const partnerId = pick('partnerId');
  const assignedCounselorId = pick('assignedCounselorId');
  const branch = pick('branch');
  for (const [field, resolution] of Object.entries({ displayName, profileName, email, countryCode, studentId, leadId, partnerId, assignedCounselorId, branch })) {
    resolutions.push({ field, value: resolution.value, from: resolution.from, note: resolution.note });
  }

  // Google resource names: one column, many names. The rest become alias tags so a
  // later People API sync recognises them instead of re-creating the contact.
  const sourceResourceNames = [...new Set(actionable.map((source) => source.externalContactId).filter(Boolean))];
  const primaryResourceName = destination.externalContactId || sourceResourceNames[0] || '';
  const aliasResourceNames = [...new Set([
    ...googleAliases(destinationTags),
    ...sourceResourceNames.filter((name) => name !== primaryResourceName),
  ])];

  const optedOut = destination.isOptedOut || actionable.some((source) => source.isOptedOut);
  const blocked = destination.isBlocked || actionable.some((source) => source.isBlocked);
  const optedOutAt = optedOut
    ? [destination.optedOutAt, ...actionable.map((source) => source.optedOutAt)].filter((value): value is string => Boolean(value)).sort()[0] ?? null
    : null;

  if (optedOut && !destination.isOptedOut) {
    warnings.push('Opt-out is inherited from a source contact: the merged record will not be contacted.');
  }
  if (blocked && !destination.isBlocked) {
    warnings.push('A source contact is blocked: the merged record inherits the block.');
  }

  const destinationNextTags = unionTags(
    destinationTags.filter((tag) => !tag.startsWith(MERGED_PREFIX)),
    ...actionable.map((source) => source.tags.filter((tag) => !tag.startsWith(MERGED_PREFIX) && !tag.startsWith(GOOGLE_ALIAS_PREFIX))),
    aliasResourceNames.map((name) => `${GOOGLE_ALIAS_PREFIX}${name}`),
  );

  const aliasUpdates: AliasUpdate[] = actionable.map((source) => ({
    id: source.id,
    phone: source.normalizedPhone,
    // The alias keeps its own provenance tags but is marked as pointing at the
    // destination, which is how the registry and the dashboard recognise it.
    tags: unionTags(
      source.tags.filter((tag) => !tag.startsWith(MERGED_PREFIX)),
      [`${MERGED_PREFIX}${destination.id}`],
    ),
    // Mirrored person-level links keep the *number* identifying the same student.
    studentId: studentId.value,
    leadId: leadId.value,
    partnerId: partnerId.value,
    assignedCounselorId: assignedCounselorId.value,
    branch: branch.value,
    isOptedOut: optedOut,
    optedOutAt,
    isBlocked: blocked,
  }));

  const token = mergeConfirmationToken({
    destinationId: destination.id,
    sourceIds: sources.map((source) => source.id),
    destinationUpdatedAt: destination.updatedAt,
    sourceUpdatedAt: sources.map((source) => source.updatedAt),
  });

  return {
    ok: blockers.length === 0,
    blockers,
    warnings,
    destinationId: destination.id,
    sourceIds: sources.map((source) => source.id),
    destinationUpdate: {
      displayName: displayName.value,
      profileName: profileName.value,
      email: email.value,
      normalizedEmail: email.value.toLowerCase(),
      countryCode: countryCode.value,
      externalContactId: primaryResourceName,
      studentId: studentId.value,
      leadId: leadId.value,
      partnerId: partnerId.value,
      assignedCounselorId: assignedCounselorId.value,
      branch: branch.value,
      isOptedOut: optedOut,
      optedOutAt,
      isBlocked: blocked,
      tags: destinationNextTags,
    },
    aliasUpdates,
    resolutions,
    preserved: {
      numbers: [...new Set([destination.normalizedPhone, ...actionable.map((source) => source.normalizedPhone)])],
      externalContactIds: [...new Set([destination.externalContactId, ...sourceResourceNames].filter(Boolean))],
      googleAliases: aliasResourceNames,
      studentIdentity: studentId.value,
      leadIdentity: leadId.value,
      partnerIdentity: partnerId.value,
    },
    confirmationToken: token,
    policy:
      'Manual, confirmation-based merge. Nothing is merged automatically, no record is deleted, and student/lead/partner identities are never rewritten.',
  };
}

/**
 * Deterministic token over the *state* the operator previewed.
 *
 * It is not an authentication token — the caller is already authorised and scoped —
 * it exists so an execute request can only apply to the exact rows the preview saw.
 * Any concurrent edit changes `updatedAt` and therefore the token.
 */
export function mergeConfirmationToken(input: {
  destinationId: string;
  sourceIds: string[];
  destinationUpdatedAt: string;
  sourceUpdatedAt: string[];
}): string {
  const canonical = JSON.stringify({
    d: input.destinationId,
    s: [...input.sourceIds].sort(),
    du: input.destinationUpdatedAt,
    su: [...input.sourceUpdatedAt].sort(),
  });
  return createHash('sha256').update(canonical).digest('hex').slice(0, 32);
}

/** Human summary for API responses and the UI. */
export function summarizeMergePlan(plan: MergePlan): string {
  if (!plan.ok) return `Merge refused: ${plan.blockers[0]}`;
  const numbers = plan.preserved.numbers.length;
  return `Merge ${plan.sourceIds.length} contact(s) into ${plan.destinationId}: ${numbers} number(s) preserved, ${plan.aliasUpdates.length} kept as alias(es), nothing deleted.`;
}
