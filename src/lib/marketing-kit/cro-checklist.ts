/**
 * CRO checklist — page-level conversion review items.
 *
 * Framework adapted from coreyhaines31/marketingskills → skills/cro
 * (page analysis + form + experiments references), applied to ALO's
 * highest-traffic conversion pages.
 */

export type CroItem = {
  id: string;
  page: string;
  principle: string;
  action: string;
  /** Suggested experiment to validate the change */
  experiment: string;
};

export const CRO_CHECKLIST: CroItem[] = [
  {
    id: 'cro-home-hero-cta',
    page: 'Homepage',
    principle: 'One primary action above the fold',
    action: 'Hero CTA reads "Request a Consultation" (outcome, not "Learn More"). Secondary CTA demoted to text link.',
    experiment: 'A/B: outcome CTA vs generic CTA — measure consultation bookings per 1,000 sessions.',
  },
  {
    id: 'cro-home-proof',
    page: 'Homepage',
    principle: 'Proof near the CTA, not at the footer',
    action: 'Move one verified success story + stat strip directly under the hero CTA.',
    experiment: 'A/B: proof-above vs proof-below — measure scroll depth and CTA clicks.',
  },
  {
    id: 'cro-consult-form',
    page: '/book-consultation',
    principle: 'Fewer fields, progressive disclosure',
    action: 'Keep the form to name + phone + destination + intake. Move academics to the post-submit profile step.',
    experiment: 'A/B: 4-field vs 8-field form — measure completion rate.',
  },
  {
    id: 'cro-consult-trust',
    page: '/book-consultation',
    principle: 'Answer "what happens after I submit?" before it is asked',
    action: 'Add a 3-step "what happens next" strip (counselor call within 24h → plan → portal) beside the form.',
    experiment: 'A/B: with vs without the strip — measure form starts.',
  },
  {
    id: 'cro-finder-result',
    page: '/course-finder',
    principle: 'Empty states convert',
    action: 'When filters return nothing, offer "broaden search" one-click relaxations plus a counselor CTA.',
    experiment: 'Measure assisted-search rate from empty state vs dead end.',
  },
  {
    id: 'cro-eligibility',
    page: '/eligibility-check',
    principle: 'Show the logic, then the tool',
    action: 'Lead with the decision-logic diagram, then the checker — visitors trust a result they can see the rules of.',
    experiment: 'A/B: checker-first vs diagram-first — measure checker starts.',
  },
  {
    id: 'cro-destination',
    page: '/destinations/[country]',
    principle: 'Deadline urgency is factual, not manufactured',
    action: 'Show the real next intake deadline with a countdown sourced from verified data, next to the enquiry CTA.',
    experiment: 'A/B: with vs without countdown — measure enquiry rate.',
  },
  {
    id: 'cro-exit-intent',
    page: 'All public pages',
    principle: 'Catch exits with the highest-value offer',
    action: 'Exit-intent modal offers the visa checklist (email-gated), not a generic newsletter.',
    experiment: 'Measure email capture rate vs newsletter modal baseline.',
  },
];
