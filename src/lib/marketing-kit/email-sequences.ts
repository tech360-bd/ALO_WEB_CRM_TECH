/**
 * Email sequences — welcome (post-signup) and lead nurture (pre-sale).
 *
 * Structure adapted from coreyhaines31/marketingskills →
 * skills/emails/references/sequence-templates.md (7-email welcome,
 * 8-email nurture), localized to ALO Education's services. Each email
 * carries one job and one CTA — no batch-and-blast.
 */

export type KitEmail = {
  /** Send timing, e.g. "Immediate", "Day 2" */
  timing: string;
  subject: string;
  preview: string;
  body: string;
  cta: string;
};

export type EmailSequence = {
  id: 'welcome' | 'nurture';
  name: string;
  purpose: string;
  emails: KitEmail[];
};

export const EMAIL_SEQUENCES: EmailSequence[] = [
  {
    id: 'welcome',
    name: 'Welcome sequence (post-signup)',
    purpose: 'Convert a fresh enquiry into a booked consultation within 14 days.',
    emails: [
      {
        timing: 'Immediate',
        subject: 'Welcome to ALO Education — here is your first step',
        preview: 'Your counselor match and what happens next.',
        body:
          'Thank you for reaching out to ALO Education. A counselor will review your profile and match you with the right destinations and programs. While you wait, here is the one thing that helps most: a realistic shortlist based on your academics and budget.',
        cta: 'Book a free consultation',
      },
      {
        timing: 'Day 1–2',
        subject: 'Get your study-abroad readiness score in 10 minutes',
        preview: 'A quick check — no forms, no commitment.',
        body:
          'Our free readiness check looks at your academics, English score, budget range, and target intake, then shows where you stand. Most students finish it in under ten minutes and leave with a clear next step.',
        cta: 'Check your readiness',
      },
      {
        timing: 'Day 3–4',
        subject: 'Why families in Bangladesh trust ALO with the big decision',
        preview: 'The story behind our counseling process.',
        body:
          'ALO Education was built because studying abroad is too important to navigate on guesswork. Every recommendation we make is verified against university sources, scholarship databases, and real visa outcomes — not brochures.',
        cta: 'See how we work',
      },
      {
        timing: 'Day 5–6',
        subject: 'How Rahman secured a scholarship for his UK master\'s',
        preview: 'A real student, a real offer, a real plan.',
        body:
          'Rahman came to us with a good profile and a tight budget. Within one intake cycle he had three offers and a partial scholarship — because we matched him to universities where his profile was competitive, not just famous.',
        cta: 'Read success stories',
      },
      {
        timing: 'Day 7–8',
        subject: '"I don\'t have time for this." Sound familiar?',
        preview: 'The busy-season plan that still works.',
        body:
          'Between classes, work, and family, nobody has spare months. Our process is built for busy people: one counselor, one checklist, one portal where every document and deadline lives. You do the work once; we track it with you.',
        cta: 'See the student portal',
      },
      {
        timing: 'Day 9–11',
        subject: 'Have you tried the course finder yet?',
        preview: '8,000+ verified courses, filtered to your profile.',
        body:
          'The ALO course finder searches verified university courses by subject, budget, intake, and English requirements. Save matches, compare fees, and see exactly what each program asks for — before you apply anywhere.',
        cta: 'Open the course finder',
      },
      {
        timing: 'Day 12–14',
        subject: 'Ready to plan your intake?',
        preview: 'One free session, a full roadmap.',
        body:
          'Book a free consultation and leave with a written plan: target universities, scholarship options, English test timeline, and key deadlines. No fees, no obligation — just a roadmap you can act on.',
        cta: 'Book a free consultation',
      },
    ],
  },
  {
    id: 'nurture',
    name: 'Lead nurture sequence (pre-sale)',
    purpose: 'Educate a lead-magnet downloader into a consultation over 21 days.',
    emails: [
      {
        timing: 'Immediate',
        subject: 'Your visa document checklist is ready',
        preview: 'The same checklist our counselors use.',
        body:
          'Here is the document checklist our counselors use with every student. Keep it — you will compare it against your file before any submission.',
        cta: 'Download the checklist',
      },
      {
        timing: 'Day 2–3',
        subject: 'The document that sinks most visa files',
        preview: 'Financial evidence — explained properly.',
        body:
          'Most visa refusals trace back to financial evidence: mismatched balances, sudden deposits, or unexplained sources of funds. This short guide shows what officers actually look for.',
        cta: 'Read the guide',
      },
      {
        timing: 'Day 4–5',
        subject: 'Why "apply to famous universities" fails most students',
        preview: 'The problem underneath the problem.',
        body:
          'Applying only to famous universities is the most common — and most expensive — mistake. Fit beats fame: course content, entry requirements, fees, and scholarship odds all matter more than a ranking.',
        cta: 'See the comparison tool',
      },
      {
        timing: 'Day 6–8',
        subject: 'The ALO 7-phase method, mapped',
        preview: 'From evaluation to enrollment.',
        body:
          'Discover, Apply, Admit, Prepare, Depart, Arrive, Succeed — our seven phases, what happens in each, and who does what. This is the same process diagram we show in every first session.',
        cta: 'View the process map',
      },
      {
        timing: 'Day 9–11',
        subject: 'Case study: two offers, one scholarship',
        preview: 'How shortlisting changed the outcome.',
        body:
          'A shortlisted student received two offers in one cycle. The difference was not a better profile — it was a shortlist built on verified requirements and scholarship odds.',
        cta: 'Read the case study',
      },
      {
        timing: 'Day 12–14',
        subject: 'What makes ALO different from other agencies',
        preview: 'Verified data, one counselor, no surprises.',
        body:
          'We verify every course, fee, and deadline against university sources. You get one dedicated counselor, a shared checklist, and honest advice — including when the honest advice is "wait for the next intake."',
        cta: 'Compare our services',
      },
      {
        timing: 'Day 15–18',
        subject: '"Agencies all look the same." Here is the difference',
        preview: 'Common myths, answered directly.',
        body:
          'Myth: counseling is free, so it must be generic. Reality: our counseling is free because we are paid by partner universities after enrollment — your plan is built around your profile, not our commission.',
        cta: 'Read our service promise',
      },
      {
        timing: 'Day 19–21',
        subject: 'Your intake plan, in one session',
        preview: 'Free, 30 minutes, written follow-up.',
        body:
          'One free session is enough to map your intake: shortlist, budget, English test dates, scholarship targets, and deadlines. Bring your documents; leave with a written plan.',
        cta: 'Book a free consultation',
      },
    ],
  },
];
