export interface NewsArticle {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  /**
   * Master §06/§09: article cards use one controlled brand-tinted surface
   * (never a rainbow gradient and never a near-black block) plus a single
   * Lucide icon, so a grid of news cards reads as one system.
   */
  surface: string;
  icon: string;
}

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    slug: 'uk-graduate-route-visa-update-2024',
    title: 'UK Graduate Route Visa Update: What International Students Need to Know',
    date: 'August 5, 2024',
    category: 'Visa Updates',
    excerpt: 'The UK government has announced its decision regarding the Graduate Route visa following the MAC review. Good news for international students planning their studies.',
    surface: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]',
    icon: 'Stamp',
  },
  {
    slug: 'new-partnership-university-of-derby',
    title: 'ALO Education Announces New Partnership with University of Derby',
    date: 'July 28, 2024',
    category: 'University News',
    excerpt: 'We are thrilled to announce our official partnership with the University of Derby, opening up new opportunities for Bangladeshi students.',
    surface: 'bg-[var(--alo-cta-soft)] text-[var(--alo-cta)]',
    icon: 'Handshake',
  },
  {
    slug: 'australia-student-visa-financial-requirements',
    title: 'Australia Increases Financial Requirements for Student Visas',
    date: 'July 15, 2024',
    category: 'Visa Updates',
    excerpt: 'The Australian government has updated the minimum financial capacity requirement for international students. See how this affects your application.',
    surface: 'bg-crm-success-bg text-crm-success-text',
    icon: 'Landmark',
  },
  {
    slug: 'fall-2025-usa-admissions-open',
    title: 'Fall 2025 Admissions Now Open for Top US Universities',
    date: 'July 10, 2024',
    category: 'Admissions',
    excerpt: 'Start your application journey early! Many US universities have opened their portals for Fall 2025 intake. Here is a guide on how to prepare.',
    surface: 'bg-[var(--alo-info-bg)] text-[var(--alo-info-text)]',
    icon: 'GraduationCap',
  },
  {
    slug: 'scholarship-deadline-reminder-canada',
    title: 'Upcoming Scholarship Deadlines for Canadian Universities',
    date: 'June 22, 2024',
    category: 'Scholarships',
    excerpt: 'Don\'t miss out on funding opportunities. We have compiled a list of major Canadian university scholarships closing next month.',
    surface: 'bg-crm-warning-bg text-crm-warning-text',
    icon: 'Award',
  },
  {
    slug: 'qs-world-university-rankings-2025',
    title: 'QS World University Rankings 2025 Released',
    date: 'June 5, 2024',
    category: 'Rankings',
    excerpt: 'Discover which of our partner universities climbed the ranks in the latest QS World University Rankings 2025.',
    surface: 'bg-[var(--alo-surface-muted)] text-[var(--alo-text-secondary)]',
    icon: 'Trophy',
  },
  {
    slug: 'alo-education-dhaka-seminar',
    title: 'Huge Turnout at Our UK Study Abroad Seminar in Dhaka',
    date: 'May 20, 2024',
    category: 'ALO News',
    excerpt: 'Thank you to the hundreds of students who attended our latest study abroad seminar. Here are the key takeaways from the event.',
    surface: 'bg-[var(--alo-brand-light)] text-[var(--alo-brand-deep)]',
    icon: 'Megaphone',
  },
  {
    slug: 'ireland-post-study-work-opportunities',
    title: 'Why Ireland is Becoming a Top Destination for Tech Students',
    date: 'May 12, 2024',
    category: 'Destinations',
    excerpt: 'With its booming tech sector and favorable post-study work visa policies, Ireland is attracting more international students than ever.',
    surface: 'bg-crm-success-bg text-crm-success-text',
    icon: 'Compass',
  },
];
