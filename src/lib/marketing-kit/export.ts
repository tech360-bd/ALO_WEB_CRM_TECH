import { DEFAULT_MARKETING_KITS, type MarketingKit } from './campaign-kits';
import { CRO_CHECKLIST } from './cro-checklist';
import { EMAIL_SEQUENCES } from './email-sequences';
import { LEAD_MAGNETS } from './lead-magnets';
import { MARKETING_KIT_REVIEW_CHECKLIST } from './review-checklist';
import { SMS_TEMPLATES } from './sms-templates';
import { SOCIAL_CALENDAR } from './social-calendar';

/**
 * Build a portable Markdown export of the full static marketing library.
 * The exported status note makes it clear that copying a template does not
 * verify claims or approve an outbound campaign.
 */
export function buildMarketingKitLibraryMarkdown(kits: MarketingKit[] = DEFAULT_MARKETING_KITS): string {
  const sections: string[] = [
    '# ALO Education — Marketing Kit Library',
    '',
    '> Draft/reference material only. Verify facts, consent, links, brand rules, and approval before any live use. Exporting does not create, schedule, or publish a campaign.',
    '',
    `## Campaign kits (${kits.length})`,
    ...kits.flatMap((kit) => [
      '',
      `### ${kit.name}`,
      '',
      `- Objective: ${kit.objective}`,
      `- Audience: ${kit.audience}`,
      `- Channels: ${kit.channels.join(', ')}`,
      `- Hook: ${kit.hook}`,
      `- CTA: ${kit.cta}`,
      '',
      kit.copy,
    ]),
    '',
    `## Email sequences (${EMAIL_SEQUENCES.length})`,
    ...EMAIL_SEQUENCES.flatMap((sequence) => [
      '',
      `### ${sequence.name}`,
      '',
      `Purpose: ${sequence.purpose}`,
      ...sequence.emails.flatMap((email, index) => [
        '',
        `#### Email ${index + 1} — ${email.timing}`,
        '',
        `- Subject: ${email.subject}`,
        `- Preview: ${email.preview}`,
        `- CTA: ${email.cta}`,
        '',
        email.body,
      ]),
    ]),
    '',
    `## Lead magnets (${LEAD_MAGNETS.length})`,
    ...LEAD_MAGNETS.flatMap((magnet) => [
      '',
      `### ${magnet.name}`,
      '',
      `- Format: ${magnet.format}`,
      `- Audience: ${magnet.audience}`,
      `- Hook: ${magnet.hook}`,
      `- CTA: ${magnet.cta}`,
      `- Follow-up sequence: ${magnet.sequence}`,
      '',
      magnet.description,
      '',
      ...magnet.deliverable.map((item) => `- ${item}`),
    ]),
    '',
    `## SMS & WhatsApp templates (${SMS_TEMPLATES.length})`,
    ...SMS_TEMPLATES.flatMap((template) => [
      '',
      `### ${template.name}`,
      '',
      `- Channel: ${template.channel}`,
      `- Trigger: ${template.trigger}`,
      `- Timing: ${template.timing}`,
      `- Compliance: ${template.compliance}`,
      '',
      template.body,
    ]),
    '',
    `## Social calendar (${SOCIAL_CALENDAR.length} posts)`,
    ...SOCIAL_CALENDAR.flatMap((post) => [
      '',
      `### Day ${post.day} — ${post.platform} (${post.format})`,
      '',
      `- Best time (Bangladesh): ${post.bestTime}`,
      `- Hook: ${post.hook}`,
      `- CTA: ${post.cta}`,
      '',
      post.copy,
    ]),
    '',
    `## CRO checklist (${CRO_CHECKLIST.length} items)`,
    ...CRO_CHECKLIST.flatMap((item) => [
      '',
      `### ${item.page} — ${item.principle}`,
      '',
      `- Action: ${item.action}`,
      `- Experiment: ${item.experiment}`,
    ]),
    '',
    '## Human review checklist',
    '',
    ...MARKETING_KIT_REVIEW_CHECKLIST.map((item) => `- [ ] **${item.label}.** ${item.detail}`),
    '',
    'Checklist completion in the ALO interface is local to that page view and is not an approval record.',
    '',
  ];

  return sections.join('\n');
}
