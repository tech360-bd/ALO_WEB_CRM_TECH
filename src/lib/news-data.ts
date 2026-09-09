export interface NewsArticle {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  thumbnailColor: string;
}

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    slug: 'uk-graduate-route-visa-update-2024',
    title: 'UK Graduate Route Visa Update: What International Students Need to Know',
    date: 'August 5, 2024',
    category: 'Visa Updates',
    excerpt: 'The UK government has announced its decision regarding the Graduate Route visa following the MAC review. Good news for international students planning their studies.',
    thumbnailColor: 'from-[#0057B8] to-[#003d80]',
  },
  {
    slug: 'new-partnership-university-of-derby',
    title: 'ALO Education Announces New Partnership with University of Derby',
    date: 'July 28, 2024',
    category: 'University News',
    excerpt: 'We are thrilled to announce our official partnership with the University of Derby, opening up new opportunities for Bangladeshi students.',
    thumbnailColor: 'from-[#E8501A] to-[#c23f10]',
  },
  {
    slug: 'australia-student-visa-financial-requirements',
    title: 'Australia Increases Financial Requirements for Student Visas',
    date: 'July 15, 2024',
    category: 'Visa Updates',
    excerpt: 'The Australian government has updated the minimum financial capacity requirement for international students. See how this affects your application.',
    thumbnailColor: 'from-emerald-500 to-emerald-700',
  },
  {
    slug: 'fall-2025-usa-admissions-open',
    title: 'Fall 2025 Admissions Now Open for Top US Universities',
    date: 'July 10, 2024',
    category: 'Admissions',
    excerpt: 'Start your application journey early! Many US universities have opened their portals for Fall 2025 intake. Here is a guide on how to prepare.',
    thumbnailColor: 'from-purple-500 to-purple-700',
  },
  {
    slug: 'scholarship-deadline-reminder-canada',
    title: 'Upcoming Scholarship Deadlines for Canadian Universities',
    date: 'June 22, 2024',
    category: 'Scholarships',
    excerpt: 'Don\'t miss out on funding opportunities. We have compiled a list of major Canadian university scholarships closing next month.',
    thumbnailColor: 'from-amber-500 to-amber-700',
  },
  {
    slug: 'qs-world-university-rankings-2025',
    title: 'QS World University Rankings 2025 Released',
    date: 'June 5, 2024',
    category: 'Rankings',
    excerpt: 'Discover which of our partner universities climbed the ranks in the latest QS World University Rankings 2025.',
    thumbnailColor: 'from-slate-700 to-slate-900',
  },
  {
    slug: 'alo-education-dhaka-seminar',
    title: 'Huge Turnout at Our UK Study Abroad Seminar in Dhaka',
    date: 'May 20, 2024',
    category: 'ALO News',
    excerpt: 'Thank you to the hundreds of students who attended our latest study abroad seminar. Here are the key takeaways from the event.',
    thumbnailColor: 'from-[#0057B8] to-blue-500',
  },
  {
    slug: 'ireland-post-study-work-opportunities',
    title: 'Why Ireland is Becoming a Top Destination for Tech Students',
    date: 'May 12, 2024',
    category: 'Destinations',
    excerpt: 'With its booming tech sector and favorable post-study work visa policies, Ireland is attracting more international students than ever.',
    thumbnailColor: 'from-green-500 to-green-700',
  },
];
