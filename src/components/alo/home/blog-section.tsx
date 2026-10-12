'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { BlogCard, type BlogCardData } from '@/components/alo/cards/blog-card';
import {
  BlogQuickView,
  type BlogArticleData,
} from '@/components/alo/drawers/blog-quick-view';
import { ArrowRight, BookOpen } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Sample Data                                                        */
/* ------------------------------------------------------------------ */

const BLOGS: BlogCardData[] = [
  {
    title: 'Complete Guide to UK Student Visa 2025: Step-by-Step Process for Bangladeshi Students',
    excerpt: 'Everything you need to know about the UK student visa application, from CAS letter to biometrics. Updated with the latest UKVI requirements for 2025 intakes.',
    category: 'Visa Guide',
    image: '/images/alo/blogs/blog-01.webp',
    readingTime: '8 min read',
    date: '15 Jan 2025',
    slug: 'uk-student-visa-guide-2025',
  },
  {
    title: 'Top 10 Universities in the UK for Data Science Masters in 2025',
    excerpt: 'We analysed employability rates, tuition costs, scholarship availability and student satisfaction to rank the best UK universities for Data Science.',
    category: 'University Rankings',
    image: '/images/alo/blogs/blog-01.webp',
    readingTime: '6 min read',
    date: '10 Jan 2025',
    slug: 'top-uk-universities-data-science',
  },
  {
    title: 'How to Write a Winning Personal Statement for UK Universities',
    excerpt: 'Admissions tutors share what makes a personal statement stand out. Includes real examples from successful ALO students who secured offers from Russell Group universities.',
    category: 'Application Tips',
    image: '/images/alo/blogs/blog-01.webp',
    readingTime: '7 min read',
    date: '5 Jan 2025',
    slug: 'winning-personal-statement-uk',
  },
  {
    title: 'Scholarship Guide for Bangladeshi Students 2025',
    excerpt: 'Complete guide to scholarships available for Bangladeshi students studying abroad. Includes UK, USA, Canada, and Australia scholarship deadlines and eligibility criteria.',
    category: 'Scholarships',
    image: '/images/alo/blogs/blog-02.webp',
    readingTime: '8 min read',
    date: 'Updated Jul 15, 2025',
    slug: 'scholarship-guide-bangladeshi-students-2025',
  },
  {
    title: 'PTE vs IELTS vs TOEFL: Which Test Should You Take?',
    excerpt: 'Compare the three most popular English proficiency tests accepted by universities worldwide. Understand scoring, cost, and which test is best for your target country.',
    category: 'English Tests',
    image: '/images/alo/blogs/blog-03.webp',
    readingTime: '6 min read',
    date: 'Updated Jul 10, 2025',
    slug: 'pte-vs-ielts-vs-toefl-comparison',
  },
  {
    title: 'Top 10 Universities in Australia for Bangladeshi Students',
    excerpt: 'Explore the top 10 Australian universities popular among Bangladeshi students. Compare rankings, tuition fees, scholarship opportunities, and post-study work rights.',
    category: 'Universities',
    image: '/images/alo/blogs/blog-01.webp',
    readingTime: '7 min read',
    date: 'Updated Jul 5, 2025',
    slug: 'top-10-universities-australia-bangladeshi-students',
  },
];

/* ------------------------------------------------------------------ */
/*  Full Article Data (for quick-view drawer)                          */
/* ------------------------------------------------------------------ */

const FULL_ARTICLES: Record<string, BlogArticleData> = {
  'uk-student-visa-guide-2025': {
    title: 'Complete Guide to UK Student Visa 2025: Step-by-Step Process for Bangladeshi Students',
    excerpt: 'Everything you need to know about the UK student visa application, from CAS letter to biometrics. Updated with the latest UKVI requirements for 2025 intakes.',
    category: 'Visa Guide',
    image: '/images/alo/blogs/blog-01.webp',
    readingTime: '8 min read',
    date: '15 Jan 2025',
    slug: 'uk-student-visa-guide-2025',
    author: {
      name: 'Sarah Mitchell',
      role: 'Senior Visa Consultant at ALO Education',
      avatar: '/images/alo/testimonials/student-01.webp',
    },
    content: [
      { type: 'paragraph', text: 'Applying for a UK student visa can feel overwhelming, especially with the ever-changing immigration rules. At ALO Education, we have helped over 5,000 Bangladeshi students successfully obtain their UK Student Visa (formerly Tier 4). This comprehensive guide covers every step of the process for the 2025 intake cycle.' },
      { type: 'subheading', text: '1. Obtain Your CAS Letter' },
      { type: 'paragraph', text: 'The Confirmation of Acceptance for Studies (CAS) is the single most important document in your visa application. Your university issues this after you accept an unconditional offer and pay the required deposit. The CAS contains a unique reference number and details about your course, tuition fees, and personal information.' },
      { type: 'paragraph', text: 'Make sure to double-check every detail on your CAS — including the spelling of your name, passport number, and course start date. Even a minor error can lead to a visa refusal. If you spot any discrepancies, contact your university immediately to request a correction before your visa appointment.' },
      { type: 'subheading', text: '2. Prepare Your Financial Documents' },
      { type: 'paragraph', text: 'UKVI requires proof that you can cover your tuition fees and living expenses. For London-based universities, you need to show at least £1,483 per month for up to 9 months. For universities outside London, the requirement is £1,136 per month.' },
      { type: 'bullets', text: '', items: [
        'Bank statements from the last 28 days showing the required balance',
        'Sponsorship letter (if funded by a parent or guardian)',
        'Loan sanction letter from an approved financial institution',
        'Scholarship award letter (if applicable — reduces the amount you need to show)',
      ]},
      { type: 'subheading', text: '3. Book Your Biometrics Appointment' },
      { type: 'paragraph', text: 'After submitting your online application on GOV.UK, you will need to book a biometrics appointment at a Visa Application Centre (VAC) in Dhaka or Sylhet. During the appointment, your fingerprints and photograph will be taken. The process is straightforward and typically takes 15-20 minutes.' },
      { type: 'quote', text: 'At ALO Education, we prepare students for every stage of the visa process. Our 98.6% approval rate speaks to the quality of our documentation review and mock interview preparation. — Sarah Mitchell, Senior Visa Consultant' },
      { type: 'subheading', text: '4. Wait for Your Decision' },
      { type: 'paragraph', text: 'Standard processing times for UK student visas from Bangladesh are typically 3-6 weeks. You can opt for the priority service (5 working days) or super-priority service (next working day) for an additional fee. We recommend applying at least 8 weeks before your course start date to allow for any unexpected delays.' },
      { type: 'paragraph', text: 'Once your visa is approved, you will receive a Biometric Residence Permit (BRP) which you must collect upon arrival in the UK. The BRP is valid for the duration of your course plus a short grace period. Keep it safe — it serves as your primary form of identification in the UK.' },
    ],
  },
  'top-uk-universities-data-science': {
    title: 'Top 10 Universities in the UK for Data Science Masters in 2025',
    excerpt: 'We analysed employability rates, tuition costs, scholarship availability and student satisfaction to rank the best UK universities for Data Science.',
    category: 'University Rankings',
    image: '/images/alo/blogs/blog-01.webp',
    readingTime: '6 min read',
    date: '10 Jan 2025',
    slug: 'top-uk-universities-data-science',
    author: {
      name: 'Dr. Ahmed Rahman',
      role: 'Lead Academic Counsellor at ALO Education',
      avatar: '/images/alo/testimonials/student-02.webp',
    },
    content: [
      { type: 'paragraph', text: 'Data Science continues to be one of the most sought-after fields for postgraduate study in the UK. With starting salaries averaging £35,000-£55,000 and a thriving tech ecosystem, the UK offers exceptional ROI for Bangladeshi students pursuing an MSc in Data Science.' },
      { type: 'subheading', text: 'Our Ranking Methodology' },
      { type: 'paragraph', text: 'We evaluated 45 UK universities offering Data Science Masters programmes across five key dimensions: graduate employability rate (30%), tuition affordability for international students (25%), research quality (20%), industry partnerships (15%), and international student satisfaction (10%). Here are our top picks.' },
      { type: 'subheading', text: 'Top 3 Universities' },
      { type: 'bullets', text: '', items: [
        'University of Oxford — MSc in Social Data Science: World-class faculty, 96% employability within 6 months, £40,500/year tuition. Strongest research output in computational social science.',
        'Imperial College London — MSc Data Science: Direct pipeline to London tech firms, 94% graduate employment, £38,700/year. Unmatched industry connections with Google DeepMind and OpenAI.',
        'University of Edinburgh — MSc Data Science: Excellent scholarship options for Bangladeshi students, £36,600/year, strong focus on machine learning and AI. 92% satisfaction rate.',
      ]},
      { type: 'subheading', text: 'Scholarship Opportunities' },
      { type: 'paragraph', text: 'Several UK universities offer generous scholarships specifically for Bangladeshi students. The Chevening Scholarship covers full tuition and living expenses. The Commonwealth Scholarship is another excellent option. Additionally, universities like Edinburgh, Manchester, and Birmingham offer merit-based bursaries of £2,000-£10,000 for international students.' },
      { type: 'quote', text: 'Data Science graduates from UK universities are among the highest-paid professionals in the country. The average starting salary in London is £48,000, with many graduates securing roles at companies like Barclays, HSBC, and Deloitte within months of graduation. — Dr. Ahmed Rahman' },
      { type: 'paragraph', text: 'At ALO Education, our expert counsellors can help you identify the best Data Science programme based on your academic background, budget, and career goals. We provide end-to-end support from shortlisting universities to visa processing.' },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BlogSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<BlogArticleData | null>(null);

  const handleQuickView = useCallback((slug: string) => {
    const article = FULL_ARTICLES[slug];
    if (article) {
      setSelectedBlog(article);
      setDrawerOpen(true);
    }
  }, []);

  return (
    <section
      ref={sectionRef}
      id="blog"
      className="w-full bg-alo-white py-16 sm:py-20"
      aria-labelledby="blog-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0066CC]/8 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0066CC]">
              <BookOpen className="h-3.5 w-3.5" strokeWidth={2.5} />
              Blog &amp; Guides
            </span>
          </div>
          <h2
            id="blog-heading"
            className="mt-4 text-2xl font-bold tracking-tight text-alo-black sm:text-3xl lg:text-4xl"
          >
            Latest Insights for Study Abroad
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-alo-gray">
            Expert-written guides on visas, applications, scholarships and student life.
          </p>
        </motion.div>

        {/* ── Grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BLOGS.map((blog, i) => (
            <motion.div
              key={blog.slug}
              initial={{ opacity: 0, y: 25 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <BlogCard
                blog={blog}
                onQuickView={() => handleQuickView(blog.slug)}
                onClick={() => console.log('Navigate to blog:', blog.slug)}
              />
            </motion.div>
          ))}
        </div>

        {/* ── View All Link ───────────────────────────────────── */}
        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <a
            href="/blog"
            className="group inline-flex items-center gap-2 rounded-xl border border-alo-blue/20 bg-alo-blue-light px-6 py-3 text-sm font-bold text-alo-blue transition-all duration-200 hover:bg-alo-blue hover:text-white focus-ring"
          >
            View All Articles
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>

      {/* ── Blog Quick View Drawer ─────────────────────────────── */}
      <BlogQuickView
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        blog={selectedBlog}
      />
    </section>
  );
}
