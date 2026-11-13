/**
 * Google Business Profile API client (outbound).
 *
 * ALO already had an *inbound* path — `POST /api/marketing/webhooks/google-business`
 * turns a pushed review into a `MarketingLead`. What was missing is any way to
 * read ALO's own Business Profile back out of Google: which locations exist,
 * what their hours and phone number are, and what the reviews say. Without that
 * the admin can only ever see data someone else chose to push.
 *
 * API versions used, and why they differ:
 *   - Account management: `mybusinessaccountmanagement.googleapis.com/v1`
 *   - Location details:   `mybusinessbusinessinformation.googleapis.com/v1`
 *   - Reviews:            `mybusiness.googleapis.com/v4`
 *
 * Reviews are still on v4 because Google never shipped a v1 reviews endpoint;
 * it restricted the v4 reviews API instead. As of 2022 Google grants reviews
 * access only to accounts with 10 or more locations, and refuses everyone else
 * with a 403. ALO is a single-office consultancy, so the realistic outcome of a
 * reviews call is a 403. That is reported as `NO_ACCESS` with Google's own
 * reason rather than being hidden, retried, or worked around with scraped data.
 * An empty review list would be indistinguishable from "no reviews" and would
 * be a lie, so it is never returned.
 *
 * Free-first: the Business Profile API is free and needs no billing account.
 *
 * Real locations only. Nothing in this module creates a location, and the spec
 * forbids inventing locations for SEO purposes. This client is read-only.
 */

import { getGoogleStackConfig } from '@/lib/google/config';
import {
  SCOPE_BUSINESS_PROFILE,
  describeGoogleCredential,
  googleApiRequest,
  resolveGoogleCredential,
  type GoogleApiResult,
} from '@/lib/google/oauth';

export const BUSINESS_PROFILE_SCOPE = SCOPE_BUSINESS_PROFILE;

const ACCOUNTS_BASE = 'https://mybusinessaccountmanagement.googleapis.com/v1';
const INFORMATION_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1';
const V4_BASE = 'https://mybusiness.googleapis.com/v4';
const TIMEOUT_MS = 15_000;

export type BusinessProfileStatus = 'READY' | 'NOT_CONFIGURED' | 'NO_ACCESS' | 'AUTH_FAILED' | 'API_ERROR' | 'TIMEOUT';

export interface BusinessProfileResult<T> {
  status: BusinessProfileStatus;
  data?: T;
  reason?: string;
  httpStatus?: number;
  googleErrorReason?: string;
  fetchedAt?: string;
}

export interface BusinessProfileAccount {
  name: string;
  accountId: string;
  accountName?: string;
  type?: string;
  role?: string;
}

export interface BusinessProfileLocation {
  name: string;
  locationId: string;
  title: string;
  primaryPhone: string;
  websiteUri: string;
  addressLine: string;
  locality: string;
  country: string;
  postalCode: string;
  primaryCategory: string;
  rating: number | null;
  reviewCount: number | null;
  /** Opening hours as Google stores them, flattened to a readable summary. */
  hoursSummary: string;
}

export interface BusinessProfileReview {
  reviewId: string;
  rating: number;
  comment: string;
  reviewerName: string;
  createTime: string;
  updateTime: string;
  /** True when the business has replied. */
  hasReply: boolean;
}

interface RawAccount {
  name?: string;
  accountName?: string;
  type?: string;
  role?: string;
}

interface RawHoursPeriod {
  openDay?: string;
  openTime?: string;
  closeDay?: string;
  closeTime?: string;
}

interface RawLocation {
  name?: string;
  title?: string;
  primaryPhone?: string;
  websiteUri?: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
    regionCode?: string;
  };
  primaryCategory?: { displayName?: string; categoryId?: string };
  metadata?: { rating?: number; reviewCount?: number; hasVoiceOfMerchant?: boolean };
  regularHours?: { openInfo?: string; specialDays?: unknown[]; weekdayText?: string[]; periods?: RawHoursPeriod[] };
  moreHours?: unknown[];
}

/** Fields requested for each location. Asking for less costs less quota. */
const LOCATION_READ_MASK = [
  'name',
  'title',
  'primaryPhone',
  'websiteUri',
  'storefrontAddress',
  'primaryCategory',
  'metadata',
  'regularHours',
].join(',');

function notConfigured<T>(env: NodeJS.ProcessEnv): BusinessProfileResult<T> {
  return {
    status: 'NOT_CONFIGURED',
    reason: describeGoogleCredential(env).reason,
  };
}

function mapStatus(result: GoogleApiResult<unknown>): BusinessProfileStatus {
  if (result.status === 'READY') return 'READY';
  // A 403 from Business Profile means the credential cannot see the account,
  // which is an access problem, not an authentication problem.
  return result.httpStatus === 403 ? 'NO_ACCESS' : result.status;
}

/** Flatten Google's hours structure into one readable line per location. */
export function summarizeHours(location: RawLocation): string {
  const weekdayText = location.regularHours?.weekdayText;
  if (Array.isArray(weekdayText) && weekdayText.length > 0) {
    return weekdayText.join('; ').slice(0, 500);
  }
  const periods = location.regularHours?.periods;
  if (!Array.isArray(periods) || periods.length === 0) {
    return location.regularHours?.openInfo === 'OPEN_24_7' ? 'Open 24 hours' : '';
  }
  return periods
    .slice(0, 7)
    .map((period) => {
      const open = [period.openDay, period.openTime].filter(Boolean).join(' ');
      const close = [period.closeDay, period.closeTime].filter(Boolean).join(' ');
      return close ? `${open}–${close}` : open;
    })
    .filter(Boolean)
    .join('; ')
    .slice(0, 500);
}

/** Accounts the credential can manage. */
export async function listAccounts(
  env: NodeJS.ProcessEnv = process.env,
): Promise<BusinessProfileResult<BusinessProfileAccount[]>> {
  if (resolveGoogleCredential(env).mode === 'none') return notConfigured(env);

  const result = await googleApiRequest<{ accounts?: RawAccount[] }>(
    BUSINESS_PROFILE_SCOPE,
    `${ACCOUNTS_BASE}/accounts?pageSize=20`,
    {},
    env,
    TIMEOUT_MS,
  );
  if (result.status !== 'READY') {
    return {
      status: mapStatus(result),
      reason: result.reason,
      httpStatus: result.httpStatus,
      googleErrorReason: result.googleErrorReason,
    };
  }
  const accounts = (result.data.accounts ?? []).map((account) => ({
    // `accounts/1234567890`
    name: account.name ?? '',
    accountId: (account.name ?? '').split('/').pop() ?? '',
    accountName: account.accountName,
    type: account.type,
    role: account.role,
  }));
  return { status: 'READY', data: accounts, fetchedAt: result.fetchedAt };
}

/**
 * Locations under an account.
 *
 * When `accountId` is omitted, the configured `GOOGLE_BUSINESS_ACCOUNT_ID` is
 * used; when that is also absent the first visible account is used, so a single
 * call works for the common one-account setup.
 */
export async function listLocations(
  accountId?: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<BusinessProfileResult<BusinessProfileLocation[]>> {
  if (resolveGoogleCredential(env).mode === 'none') return notConfigured(env);

  let resolvedAccountId = accountId?.trim() || '';
  if (!resolvedAccountId) {
    resolvedAccountId = getGoogleStackConfig(env).businessProfile.accountId;
  }
  if (!resolvedAccountId) {
    const accounts = await listAccounts(env);
    if (accounts.status !== 'READY' || !accounts.data || accounts.data.length === 0) {
      return {
        status: accounts.status,
        reason:
          accounts.reason ??
          'No Business Profile account is visible to this credential and GOOGLE_BUSINESS_ACCOUNT_ID is not set.',
        httpStatus: accounts.httpStatus,
        googleErrorReason: accounts.googleErrorReason,
      };
    }
    resolvedAccountId = accounts.data[0].accountId;
  }

  const result = await googleApiRequest<{ locations?: RawLocation[] }>(
    BUSINESS_PROFILE_SCOPE,
    `${INFORMATION_BASE}/accounts/${encodeURIComponent(resolvedAccountId)}/locations?readMask=${encodeURIComponent(LOCATION_READ_MASK)}&pageSize=100`,
    {},
    env,
    TIMEOUT_MS,
  );
  if (result.status !== 'READY') {
    return {
      status: mapStatus(result),
      reason: result.reason,
      httpStatus: result.httpStatus,
      googleErrorReason: result.googleErrorReason,
    };
  }

  const locations = (result.data.locations ?? []).map((location) => {
    const address = location.storefrontAddress;
    return {
      name: location.name ?? '',
      locationId: (location.name ?? '').split('/').pop() ?? '',
      title: location.title ?? '',
      primaryPhone: location.primaryPhone ?? '',
      websiteUri: location.websiteUri ?? '',
      addressLine: (address?.addressLines ?? []).join(', '),
      locality: address?.locality ?? '',
      country: address?.regionCode ?? '',
      postalCode: address?.postalCode ?? '',
      primaryCategory: location.primaryCategory?.displayName ?? '',
      rating: typeof location.metadata?.rating === 'number' ? location.metadata.rating : null,
      reviewCount: typeof location.metadata?.reviewCount === 'number' ? location.metadata.reviewCount : null,
      hoursSummary: summarizeHours(location),
    } satisfies BusinessProfileLocation;
  });
  return { status: 'READY', data: locations, fetchedAt: result.fetchedAt };
}

interface RawReview {
  name?: string;
  reviewId?: string;
  starRating?: number;
  comment?: string;
  createTime?: string;
  updateTime?: string;
  reviewer?: { displayName?: string; profilePhotoUrl?: string };
  reviewReply?: { comment?: string; updateTime?: string };
}

/**
 * Reviews for one location.
 *
 * Uses the v4 endpoint because Google never released a v1 reviews API. Access is
 * restricted by Google to accounts with 10+ locations, so for ALO this most
 * likely returns `NO_ACCESS` with Google's own reason. That outcome is reported
 * honestly — an empty list is never substituted, because "no reviews" and
 * "reviews unavailable" mean different things to a marketing team.
 */
export async function listReviews(
  locationName: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<BusinessProfileResult<BusinessProfileReview[]>> {
  if (resolveGoogleCredential(env).mode === 'none') return notConfigured(env);
  const trimmed = locationName.trim();
  if (trimmed === '') {
    return { status: 'API_ERROR', reason: 'A location name is required (accounts/<id>/locations/<id>).' };
  }

  const result = await googleApiRequest<{ reviews?: RawReview[]; totalReviewCount?: number }>(
    BUSINESS_PROFILE_SCOPE,
    `${V4_BASE}/${trimmed.replace(/^\/+/, '')}/reviews?pageSize=50&orderBy=updateTime%20desc`,
    {},
    env,
    TIMEOUT_MS,
  );
  if (result.status !== 'READY') {
    return {
      status: mapStatus(result),
      reason:
        result.httpStatus === 403
          ? `Google refused review access (403). Google restricts the Business Profile reviews API to accounts with 10 or more locations; a single-office account is normally refused. ${result.googleErrorReason ?? ''}`.trim()
          : result.reason,
      httpStatus: result.httpStatus,
      googleErrorReason: result.googleErrorReason,
    };
  }

  const reviews = (result.data.reviews ?? []).map((review) => ({
    reviewId: review.reviewId ?? (review.name ?? '').split('/').pop() ?? '',
    rating: typeof review.starRating === 'number' ? review.starRating : 0,
    comment: (review.comment ?? '').slice(0, 2000),
    reviewerName: review.reviewer?.displayName ?? 'A Google user',
    createTime: review.createTime ?? '',
    updateTime: review.updateTime ?? '',
    hasReply: Boolean(review.reviewReply?.comment),
  }));
  return { status: 'READY', data: reviews, fetchedAt: result.fetchedAt };
}

/**
 * Connection self-test.
 *
 * Distinguishes the three states an operator actually needs to tell apart:
 * no credential, a credential Google rejects, and a working credential that
 * cannot see the configured account.
 */
export async function verifyBusinessProfileConnection(
  env: NodeJS.ProcessEnv = process.env,
): Promise<{
  status: BusinessProfileStatus;
  configuredAccountId: string;
  accountsVisible: number;
  configuredAccountVisible: boolean;
  locationCount: number;
  reason: string;
}> {
  const config = getGoogleStackConfig(env);
  if (resolveGoogleCredential(env).mode === 'none') {
    return {
      status: 'NOT_CONFIGURED',
      configuredAccountId: config.businessProfile.accountId,
      accountsVisible: 0,
      configuredAccountVisible: false,
      locationCount: 0,
      reason: describeGoogleCredential(env).reason,
    };
  }

  const accounts = await listAccounts(env);
  if (accounts.status !== 'READY' || !accounts.data) {
    return {
      status: accounts.status,
      configuredAccountId: config.businessProfile.accountId,
      accountsVisible: 0,
      configuredAccountVisible: false,
      locationCount: 0,
      reason: accounts.reason ?? 'Business Profile did not return an account list.',
    };
  }

  const configuredVisible =
    config.businessProfile.accountId === '' ||
    accounts.data.some((account) => account.accountId === config.businessProfile.accountId);

  const locations = await listLocations(undefined, env);
  return {
    status: locations.status,
    configuredAccountId: config.businessProfile.accountId,
    accountsVisible: accounts.data.length,
    configuredAccountVisible: configuredVisible,
    locationCount: locations.data?.length ?? 0,
    reason:
      locations.status === 'READY'
        ? `Connected. ${accounts.data.length} account(s) visible, ${locations.data?.length ?? 0} location(s) readable${
            configuredVisible ? '' : `, but GOOGLE_BUSINESS_ACCOUNT_ID (${config.businessProfile.accountId}) is NOT among the visible accounts`
          }.`
        : (locations.reason ?? 'Locations could not be read.'),
  };
}
