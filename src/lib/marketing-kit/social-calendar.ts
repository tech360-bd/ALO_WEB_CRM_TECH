/**
 * Social content calendar — two weeks of ready-to-schedule posts.
 *
 * Post frameworks adapted from coreyhaines31/marketingskills →
 * skills/social: story first, platform mechanics second. Every post has
 * one hook, one idea, one CTA. No emoji-as-sentiment, no broetry.
 */

export type SocialPost = {
  day: number;
  platform: 'Facebook' | 'Instagram' | 'LinkedIn' | 'YouTube Shorts' | 'WhatsApp Status';
  format: string;
  hook: string;
  copy: string;
  cta: string;
  /** Local time window (Bangladesh) */
  bestTime: string;
};

export const SOCIAL_CALENDAR: SocialPost[] = [
  {
    day: 1,
    platform: 'Instagram',
    format: 'Carousel (5 slides)',
    hook: '5 documents that decide your visa.',
    copy:
      'Slide 1: the checklist title. Slides 2–5: one document per slide with the #1 mistake students make on it. Final slide: free checklist download. Most visa refusals trace back to financial evidence — save this and check yours.',
    cta: 'Checklist link in bio',
    bestTime: '7:00–9:00 pm',
  },
  {
    day: 1,
    platform: 'LinkedIn',
    format: 'Text post',
    hook: 'We reviewed 200 visa files this year. The same 3 mistakes appeared in 7 of 10 refusals.',
    copy:
      'Not missing documents — mismatched ones. Sudden deposits without source, bank statements that do not match the sponsor\'s income, and translations that contradict the originals. A visa file is a story told in evidence. Make every page agree with the others.',
    cta: 'Comment "CHECKLIST" for the guide',
    bestTime: '9:00–11:00 am',
  },
  {
    day: 2,
    platform: 'Facebook',
    format: 'Short video (30s)',
    hook: 'POV: you shortlisted universities by fit, not fame.',
    copy:
      'Fast cuts: student profile card → 4 universities matched on requirements + scholarship odds → offer letters arriving. Voiceover: applying where your profile is competitive beats applying where everyone applies.',
    cta: 'Free consultation link in comments',
    bestTime: '8:00–10:00 pm',
  },
  {
    day: 3,
    platform: 'WhatsApp Status',
    format: 'Image + caption',
    hook: 'January intake deadlines are closer than you think.',
    copy:
      'A clean list of universities closing in the next 30 days, with ALO fee-waiver options marked. End with: talk to a counselor before your target closes.',
    cta: 'Message us "JANUARY"',
    bestTime: '12:00–2:00 pm',
  },
  {
    day: 4,
    platform: 'YouTube Shorts',
    format: 'Talking-head short (45s)',
    hook: 'The scholarship nobody applies for.',
    copy:
      'Counselor on camera: most students apply for the famous scholarships everyone knows. The higher win rate is in the small, eligibility-matched ones. We match both — that is the job.',
    cta: 'Scholarship finder link in description',
    bestTime: '7:00–9:00 pm',
  },
  {
    day: 5,
    platform: 'Instagram',
    format: 'Story series (3 frames)',
    hook: 'A day in the life of an ALO counselor.',
    copy:
      'Frame 1: morning shortlist review. Frame 2: visa file check with a student on call. Frame 3: offer letter celebration. Real work, no stock footage of graduation caps.',
    cta: 'Swipe up for a counselor match',
    bestTime: '11:00 am–1:00 pm',
  },
  {
    day: 6,
    platform: 'LinkedIn',
    format: 'Document post (PDF)',
    hook: 'The 2026 cost of studying abroad — real numbers, per country.',
    copy:
      'A one-page PDF: tuition + living + visa + flights for UK, US, Australia, Canada, Germany. Built from verified university data, updated this quarter. The number parents ask for first.',
    cta: 'Download the PDF',
    bestTime: '8:00–10:00 am',
  },
  {
    day: 7,
    platform: 'Facebook',
    format: 'Live announcement',
    hook: 'Live in 1 hour: "Ask a visa counselor anything."',
    copy:
      'Parents and students join a live session on financial requirements, interview prep, and refusal reasons. We answer every question, including the uncomfortable ones.',
    cta: 'Set a reminder',
    bestTime: '8:00 pm',
  },
  {
    day: 8,
    platform: 'Instagram',
    format: 'Reel (20s)',
    hook: '"I got into my dream university." — the 6 months before that sentence.',
    copy:
      'Text-on-screen timeline: profile evaluation → shortlist → documents → applications → offer. Voiceover from an enrolled student: the plan did the work, not luck.',
    cta: 'Start your plan — link in bio',
    bestTime: '7:00–9:00 pm',
  },
  {
    day: 9,
    platform: 'WhatsApp Status',
    format: 'Poll + image',
    hook: 'Where are you in the process?',
    copy:
      'Poll: Just researching / Shortlisting / Applied / Waiting for visa. Each option replies with the single most useful next step for that stage.',
    cta: 'Vote and reply for your step',
    bestTime: '12:00–2:00 pm',
  },
  {
    day: 10,
    platform: 'LinkedIn',
    format: 'Text post',
    hook: 'We tell some students to wait.',
    copy:
      'Honest advice is a feature. If your profile is not ready for this intake, we say so — and build the plan for the next one. That honesty is why our students\' files are complete when they submit.',
    cta: 'Read our service promise',
    bestTime: '9:00–11:00 am',
  },
  {
    day: 11,
    platform: 'YouTube Shorts',
    format: 'Screen recording (40s)',
    hook: 'How the course finder actually works.',
    copy:
      'Screen recording: enter subject + budget + intake → verified courses appear with fees, requirements, and deadlines → save matches to a shortlist. No scraped data — verified sources only.',
    cta: 'Try the course finder',
    bestTime: '7:00–9:00 pm',
  },
  {
    day: 12,
    platform: 'Instagram',
    format: 'Carousel (4 slides)',
    hook: 'IELTS: what band 7 actually requires.',
    copy:
      'Slide 1: the myth (native-level English). Slides 2–4: the real levers — task strategy, vocabulary range, error patterns. Final slide: free 12-week roadmap.',
    cta: 'Roadmap link in bio',
    bestTime: '7:00–9:00 pm',
  },
  {
    day: 13,
    platform: 'Facebook',
    format: 'Student story post',
    hook: 'From Chittagong to Manchester — the full timeline.',
    copy:
      'A real enrolled student walks through their 8 months: evaluation, shortlist, applications, offer, visa, departure. Specific dates, specific numbers. End with the referral CTA.',
    cta: 'Share if you know a future student',
    bestTime: '8:00–10:00 pm',
  },
  {
    day: 14,
    platform: 'LinkedIn',
    format: 'Text post',
    hook: 'What we verify before we recommend a university.',
    copy:
      'Course still running. Accreditation current. Fees match the official source. Deadlines confirmed for the next intake. Scholarship claims checked against the university\'s own pages. If we cannot verify it, we do not recommend it.',
    cta: 'See the verification standard',
    bestTime: '8:00–10:00 am',
  },
];
