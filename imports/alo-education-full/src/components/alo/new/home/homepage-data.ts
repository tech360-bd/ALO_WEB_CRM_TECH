// Homepage mock data — separated to avoid TSX parser issues with flag emojis

export const COUNTRIES = [
  { name: 'United Kingdom', flag: '🇬🇧', slug: 'uk', universities: 150, gradient: 'from-blue-50 to-blue-100' },
  { name: 'United States', flag: '🇺🇸', slug: 'usa', universities: 120, gradient: 'from-red-50 to-red-100' },
  { name: 'Canada', flag: '🇨🇦', slug: 'canada', universities: 80, gradient: 'from-amber-50 to-amber-100' },
  { name: 'Australia', flag: '🇦🇺', slug: 'australia', universities: 45, gradient: 'from-sky-50 to-sky-100' },
  { name: 'New Zealand', flag: '🇳🇿', slug: 'new-zealand', universities: 25, gradient: 'from-emerald-50 to-emerald-100' },
  { name: 'Ireland', flag: '🇮🇪', slug: 'ireland', universities: 30, gradient: 'from-green-50 to-green-100' },
  { name: 'Germany', flag: '🇩🇪', slug: 'germany', universities: 40, gradient: 'from-yellow-50 to-yellow-100' },
  { name: 'UAE', flag: '🇦🇪', slug: 'uae', universities: 35, gradient: 'from-orange-50 to-orange-100' },
  { name: 'France', flag: '🇫🇷', slug: 'france', universities: 35, gradient: 'from-indigo-50 to-indigo-100' },
  { name: 'Netherlands', flag: '🇳🇱', slug: 'netherlands', universities: 20, gradient: 'from-orange-50 to-amber-100' },
  { name: 'Italy', flag: '🇮🇹', slug: 'italy', universities: 25, gradient: 'from-emerald-50 to-lime-100' },
  { name: 'Malta', flag: '🇲🇹', slug: 'malta', universities: 10, gradient: 'from-sky-50 to-cyan-100' },
  { name: 'Cyprus', flag: '🇨🇾', slug: 'cyprus', universities: 12, gradient: 'from-amber-50 to-yellow-100' },
  { name: 'South Korea', flag: '🇰🇷', slug: 'south-korea', universities: 18, gradient: 'from-blue-50 to-violet-100' },
] as const;

export const UNIVERSITIES = [
  {
    name: 'University of Hertfordshire',
    city: 'Hatfield',
    country: 'United Kingdom',
    ranking: '601-800',
    tuition: '£14,000-£18,000',
    scholarship: 'Available',
    matchScore: 92,
  },
  {
    name: 'University of Portsmouth',
    city: 'Portsmouth',
    country: 'United Kingdom',
    ranking: '601-800',
    tuition: '£15,000-£19,000',
    scholarship: 'Available',
    matchScore: 88,
  },
  {
    name: 'Aston University',
    city: 'Birmingham',
    country: 'United Kingdom',
    ranking: '401-500',
    tuition: '£16,000-£21,000',
    scholarship: 'Available',
    matchScore: 95,
  },
  {
    name: 'University of Sunderland',
    city: 'Sunderland',
    country: 'United Kingdom',
    ranking: '801-1000',
    tuition: '£12,000-£15,000',
    scholarship: 'Available',
    matchScore: 85,
  },
  {
    name: 'University of Lincoln',
    city: 'Lincoln',
    country: 'United Kingdom',
    ranking: '801-1000',
    tuition: '£13,000-£17,000',
    scholarship: 'Available',
    matchScore: 82,
  },
  {
    name: 'Birmingham City University',
    city: 'Birmingham',
    country: 'United Kingdom',
    ranking: '801-1000',
    tuition: '£13,500-£16,000',
    scholarship: 'Available',
    matchScore: 80,
  },
] as const;

export const COURSES = [
  {
    name: 'MSc Data Science',
    university: 'University of Hertfordshire',
    city: 'Hatfield',
    degree: 'Masters',
    duration: '1 Year',
    tuition: '£15,000',
    intake: 'Sep 2025',
    english: 'IELTS 6.5',
    scholarship: true,
  },
  {
    name: 'MSc Cyber Security',
    university: 'University of Portsmouth',
    city: 'Portsmouth',
    degree: 'Masters',
    duration: '1 Year',
    tuition: '£17,200',
    intake: 'Sep 2025',
    english: 'IELTS 6.5',
    scholarship: true,
  },
  {
    name: 'MSc Computer Science',
    university: 'Aston University',
    city: 'Birmingham',
    degree: 'Masters',
    duration: '1 Year',
    tuition: '£19,500',
    intake: 'Sep 2025',
    english: 'IELTS 6.0',
    scholarship: true,
  },
  {
    name: 'MSc International Business',
    university: 'University of Sunderland',
    city: 'Sunderland',
    degree: 'Masters',
    duration: '1 Year',
    tuition: '£13,500',
    intake: 'Sep 2025',
    english: 'IELTS 6.0',
    scholarship: true,
  },
  {
    name: 'MSc Engineering Management',
    university: 'University of Lincoln',
    city: 'Lincoln',
    degree: 'Masters',
    duration: '1 Year',
    tuition: '£15,500',
    intake: 'Sep 2025',
    english: 'IELTS 6.0',
    scholarship: true,
  },
  {
    name: 'MBA International Business',
    university: 'Birmingham City University',
    city: 'Birmingham',
    degree: 'Masters',
    duration: '1.5 Years',
    tuition: '£16,000',
    intake: 'Sep 2025',
    english: 'IELTS 6.5',
    scholarship: true,
  },
] as const;

export const SCHOLARSHIPS = [
  {
    name: 'Vice-Chancellor\'s International Scholarship',
    university: 'University of Hertfordshire',
    amount: '£5,000',
    deadline: '30 June 2025',
    eligibility: 'Bangladeshi students with 2:1 or equivalent',
  },
  {
    name: 'Global Excellence Scholarship',
    university: 'University of Portsmouth',
    amount: '£3,000',
    deadline: '31 May 2025',
    eligibility: 'International students with strong academic records',
  },
  {
    name: 'Aston Global Advantage Scholarship',
    university: 'Aston University',
    amount: '£5,000-£10,000',
    deadline: '30 April 2025',
    eligibility: 'Postgraduate applicants from South Asia',
  },
  {
    name: 'International Excellence Award',
    university: 'University of Sunderland',
    amount: '£2,500',
    deadline: '15 July 2025',
    eligibility: 'Self-funded international students with merit',
  },
] as const;

export const ENGLISH_TESTS = [
  {
    name: 'IELTS',
    description: 'The world\'s most popular English language test for higher education and global migration.',
    bestFor: 'UK, Australia, Canada',
  },
  {
    name: 'PTE Academic',
    description: 'Fast results, AI-scored test accepted by thousands of institutions worldwide.',
    bestFor: 'UK, Australia, USA',
  },
  {
    name: 'TOEFL iBT',
    description: 'Widely accepted across US universities, with flexible test dates and locations.',
    bestFor: 'USA, Canada, Germany',
  },
  {
    name: 'Duolingo English Test',
    description: 'Affordable, convenient online test you can take from home with quick results.',
    bestFor: 'USA, UK, Ireland',
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      'ALO Education made my entire application process smooth and stress-free. From choosing the right university to getting my visa, their team guided me every step of the way. I\'m now pursuing my MSc in Data Science at the University of Hertfordshire.',
    name: 'Tushar Imran Nahid',
    university: 'University of Hertfordshire',
    course: 'MSc Data Science',
    outcome: 'Visa Approved',
  },
  {
    quote:
      'I was confused about which university and course would be best for me. The AI course finder and expert counsellors at ALO helped me find the perfect match. I received my offer letter within 3 weeks and my visa was approved without any issues.',
    name: 'Ummaye Mayesha Manna',
    university: 'University of Portsmouth',
    course: 'MSc Cyber Security',
    outcome: 'Offer Received',
  },
] as const;

export const BLOGS = [
  {
    title: 'Complete Guide to UK Student Visa from Bangladesh in 2025',
    summary:
      'Everything you need to know about the UK student visa application process, required documents, financial proof, and interview tips.',
    category: 'Visa Guide',
    author: 'ALO Team',
    readTime: '8 min read',
  },
  {
    title: 'Top 10 Universities in the UK for Bangladeshi Students',
    summary:
      'A curated list of UK universities offering excellent programmes, generous scholarships, and strong post-study work opportunities.',
    category: 'University Guide',
    author: 'ALO Team',
    readTime: '6 min read',
  },
  {
    title: 'IELTS vs PTE vs TOEFL: Which Test Should You Take?',
    summary:
      'A detailed comparison of the three most popular English proficiency tests to help you choose the right one for your study abroad plans.',
    category: 'English Tests',
    author: 'ALO Team',
    readTime: '5 min read',
  },
] as const;

export const FAQS = [
  {
    q: 'How much does it cost to study in the UK from Bangladesh?',
    a: 'Tuition fees for UK universities typically range from £12,000 to £25,000 per year for masters programmes. Living costs depend on the city but average £1,000-£1,500 per month. ALO Education helps you find programmes that fit your budget and identifies scholarship opportunities to reduce costs.',
  },
  {
    q: 'What are the English language requirements for UK universities?',
    a: 'Most UK masters programmes require IELTS 6.0-7.0 (with no band below 5.5-6.0). PTE Academic (50-65+) and TOEFL iBT are also widely accepted. Some universities accept Duolingo English Test. Requirements vary by course and institution, so always check the specific programme page.',
  },
  {
    q: 'Can I work while studying in the UK?',
    a: 'Yes, international students on a Student Visa can work up to 20 hours per week during term time and full-time during holidays. After graduation, the Graduate Route visa allows you to stay and work in the UK for 2 years (3 years for PhD graduates).',
  },
  {
    q: 'How long does the UK student visa process take from Bangladesh?',
    a: 'The standard processing time is 3-6 weeks. You can opt for the priority service (5 working days) or super priority service (next working day) for an additional fee. ALO Education assists with document preparation, financial evidence, and visa application submission.',
  },
  {
    q: 'Do I need to pay ALO Education for their services?',
    a: 'ALO Education\'s counselling and application support services are completely free for students. We are funded by our partner universities. From course selection to visa application, you get expert guidance at no cost.',
  },
  {
    q: 'What documents do I need to apply to UK universities?',
    a: 'Typical requirements include: academic transcripts and certificates, a valid passport, personal statement, CV/resume, two reference letters, English language test score (IELTS/PTE/TOEFL), and a portfolio (for design courses). Specific requirements vary by programme.',
  },
  {
    q: 'Can ALO Education help with scholarships?',
    a: 'Yes, we actively help students identify and apply for scholarships offered by our partner universities. Many UK universities offer international student scholarships ranging from £1,000 to £10,000. Our counsellors will guide you through eligibility criteria and application deadlines.',
  },
  {
    q: 'What support does ALO Education provide after I receive my offer?',
    a: 'We provide end-to-end support including: offer acceptance guidance, CAS (Confirmation of Acceptance for Studies) assistance, accommodation advice, pre-departure briefings, airport pickup arrangements, and ongoing support during your studies in the UK.',
  },
] as const;

export const PARTNER_LOGOS = [
  'University of Birmingham',
  'Aston University',
  'University of Hertfordshire',
  'University of Portsmouth',
  'University of Sunderland',
  'University of Lincoln',
  'Birmingham City University',
  'University of Dundee',
  'University of Aberdeen',
  'University of Kent',
] as const;
