/**
 * Campaign kits — ready-to-run campaign cards (hook / copy / CTA / channels).
 *
 * Frameworks adapted from coreyhaines31/marketingskills (copywriting,
 * offers, launch, marketing-loops skills) and tuned to ALO Education's real
 * services. Copy avoids AI tells: no "it's not X, it's Y" reveals, no
 * trailing comma clauses, no fake 'Re:' subject lines.
 */

export type MarketingKit = {
  id: string;
  name: string;
  objective: string;
  audience: string;
  channels: string[];
  hook: string;
  copy: string;
  cta: string;
};

export const DEFAULT_MARKETING_KITS: MarketingKit[] = [
  {
    id: 'consultation-launch',
    name: 'Consultation launch',
    objective: 'Convert high-intent study-abroad enquiries',
    audience: 'Prospective students and parents',
    channels: ['Facebook', 'Instagram', 'WhatsApp'],
    hook: 'Your next study destination starts with a clear plan.',
    copy: 'Get a realistic shortlist, budget view, and next-step plan from an ALO Education counselor. No pressure — just verified guidance.',
    cta: 'Book a consultation',
  },
  {
    id: 'ielts-prep',
    name: 'IELTS prep sprint',
    objective: 'Drive qualified language-prep leads',
    audience: 'Students preparing for September intake',
    channels: ['Instagram', 'YouTube', 'Search'],
    hook: 'Turn your target band into a study plan.',
    copy: 'See the score range, practice routine, and application deadlines that fit your destination. Start with a free readiness check.',
    cta: 'Check readiness',
  },
  {
    id: 'visa-readiness',
    name: 'Visa readiness',
    objective: 'Reduce incomplete application files',
    audience: 'Offer holders and active applicants',
    channels: ['Email', 'WhatsApp', 'Portal'],
    hook: 'A complete file is easier to review and easier to trust.',
    copy: 'Use the ALO checklist to track evidence, deadlines, and review status before submission. Your counselor sees the same source of truth.',
    cta: 'Open the checklist',
  },
  {
    id: 'scholarship-push',
    name: 'Scholarship push',
    objective: 'Drive scholarship applications before deadlines',
    audience: 'Offer holders and shortlisted students',
    channels: ['Email', 'WhatsApp', 'Portal'],
    hook: 'Merit should be rewarded — and deadlines wait for no one.',
    copy: 'ALO maintains a verified database of scholarships matched to your profile and destination. We check eligibility, amounts, and closing dates so you apply early and win more.',
    cta: 'Find scholarships',
  },
  {
    id: 'deadline-urgency',
    name: 'Intake deadline alert',
    objective: 'Re-activate applicants before intake closes',
    audience: 'Active applicants with pending submissions',
    channels: ['SMS', 'WhatsApp', 'Email'],
    hook: 'The January intake closes sooner than you think.',
    copy: 'University application deadlines for the upcoming intake are closer than they look. Confirm your shortlist, fee-waiver options, and submission dates with your counselor this week.',
    cta: 'Check your deadline',
  },
  {
    id: 'parent-webinar',
    name: 'Parent webinar invite',
    objective: 'Educate parents and capture family-level enquiries',
    audience: 'Parents of prospective students',
    channels: ['Facebook', 'YouTube', 'WhatsApp'],
    hook: "Your child's future abroad, planned properly.",
    copy: 'A free 45-minute session on budgets, visa financial requirements, timelines, and how to evaluate universities honestly. Bring your questions — our counselors answer live.',
    cta: 'Register for the webinar',
  },
  {
    id: 'referral-loop',
    name: 'Referral loop',
    objective: 'Turn enrolled students and alumni into a referral channel',
    audience: 'Enrolled students, alumni, and their families',
    channels: ['WhatsApp', 'Email'],
    hook: 'Know someone who is dreaming about studying abroad?',
    copy: 'Refer a friend and we will guide them through the same verified process — shortlist, applications, scholarships, visa. You both stay informed at every step.',
    cta: 'Refer a friend',
  },
  {
    id: 're-engagement',
    name: 'Re-engagement nudge',
    objective: 'Win back cold leads before the next intake',
    audience: 'Leads with no contact in 30+ days',
    channels: ['Email', 'SMS'],
    hook: 'Still thinking about studying abroad?',
    copy: 'Plans change, intakes roll, and deadlines pass. Tell us where you stand — a 15-minute call is enough to rebuild your timeline for the next intake.',
    cta: 'Book a free call',
  },
];
