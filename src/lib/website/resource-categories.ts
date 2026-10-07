// Canonical resource categories (spec §25) — shared by the hub page,
// category dispatcher routes and the admin UI. Do not add categories
// outside this list without updating the spec mapping.

import { BookOpen, Shield, Award, FileText, Plane, Home, Banknote, Languages, HelpCircle, Globe } from 'lucide-react';

export interface ResourceCategoryDef {
  slug: string;
  name: string;
  icon: any;
  desc: string;
}

export const RESOURCE_CATEGORIES: ResourceCategoryDef[] = [
  { slug: 'blogs', name: 'Blogs', icon: BookOpen, desc: 'High-quality guides on visas, scholarships and test preparation.' },
  { slug: 'visa-guides', name: 'Visa Guides', icon: Shield, desc: 'Country-specific visa rules — never mixed between countries, official sources only.' },
  { slug: 'scholarships', name: 'Scholarships', icon: Award, desc: 'Verified scholarships explained in depth — eligibility, deadlines, strategy.' },
  { slug: 'application-tips', name: 'Application Tips', icon: FileText, desc: 'Applications, documents, offers and deadlines done right the first time.' },
  { slug: 'pre-departure', name: 'Pre-Departure', icon: Plane, desc: 'Checklists for the weeks before you fly — documents, banking, arrival.' },
  { slug: 'accommodation', name: 'Accommodation', icon: Home, desc: 'Halls, private residences and safe booking — costs shown only when verified.' },
  { slug: 'financial-planning', name: 'Financial Planning', icon: Banknote, desc: 'Tuition, living costs, currency and budgeting — sourced, dated figures.' },
  { slug: 'english-tests', name: 'English Tests', icon: Languages, desc: 'IELTS, PTE, TOEFL, Duolingo, OET — connected to Language Preparation.' },
  { slug: 'student-visa-faqs', name: 'Student Visa FAQs', icon: HelpCircle, desc: 'Direct answers to the visa questions students actually ask.' },
  { slug: 'study-abroad-guides', name: 'Study Abroad Guides', icon: Globe, desc: 'Country and subject deep-dives from counseling to enrollment.' },
];

export function getResourceCategory(slug: string): ResourceCategoryDef | undefined {
  return RESOURCE_CATEGORIES.find((c) => c.slug === slug);
}
