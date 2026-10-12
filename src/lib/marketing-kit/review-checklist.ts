/**
 * Human review gates for using reusable campaign copy in a live channel.
 *
 * These checks intentionally do not approve, schedule, or publish anything.
 * The checklist is a reminder to verify claims and permissions against ALO's
 * source-of-truth records before a real marketing workflow is used.
 */
export type MarketingKitReviewItem = {
  id: string;
  label: string;
  detail: string;
};

export const MARKETING_KIT_REVIEW_CHECKLIST: MarketingKitReviewItem[] = [
  {
    id: 'verify-current-facts',
    label: 'Verify every current fact and number',
    detail: 'Check fees, scholarships, intake dates, deadlines, success rates, and statistics against approved source evidence.',
  },
  {
    id: 'approve-stories-and-testimonials',
    label: 'Confirm permission for named stories and testimonials',
    detail: 'Use real student names, outcomes, photographs, or quotes only when the source is verified and the required permission is recorded.',
  },
  {
    id: 'remove-guarantees',
    label: 'Remove absolute admission or visa promises',
    detail: 'Do not promise an offer, scholarship, visa decision, or outcome that ALO or a provider cannot guarantee.',
  },
  {
    id: 'consent-and-opt-out',
    label: 'Confirm recipient consent and opt-out handling',
    detail: 'For direct promotional messages, verify lawful consent, sender identity, suppression lists, and the channel-specific opt-out.',
  },
  {
    id: 'check-links-and-brand',
    label: 'Test the destination link and brand presentation',
    detail: 'Check the booking or landing link, attribution, approved logo, language, and audience fit on the target channel.',
  },
  {
    id: 'verify-channel-and-approval',
    label: 'Confirm provider readiness and human approval',
    detail: 'A marketing manager must approve the final asset; the provider, permissions, and send-time rules must be verified before scheduling.',
  },
];
