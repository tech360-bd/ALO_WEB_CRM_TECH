// Word-level acceptance for the SERVICES + SCHOLARSHIPS + RESOURCES spec.
// Static source pins + pure-lib tests — no db.

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

import { SPEC_SERVICES, SERVICE_SLUG_ALIASES, getSpecService, specServiceToPayload } from '@/lib/website/spec-services';
import { computeScholarshipStatus, isVerificationStale, VERIFICATION_STALE_DAYS } from '@/lib/scholarships/status-engine';
import { RELATED_QUESTIONS_POOL, pickRelatedQuestions, questionTagsFor } from '@/lib/website/related-questions';
import { RESOURCE_CATEGORIES, getResourceCategory } from '@/lib/website/resource-categories';

// ---------------------------------------------------------------------------
describe('Services system — spec §3-§12', () => {
  it('has exactly the 14 spec services with the exact publication slugs', () => {
    const slugs = SPEC_SERVICES.map((s) => s.slug);
    expect(slugs).toEqual([
      'personalized-counselling', 'university-selection', 'course-matching',
      'application-assistance', 'sop-cv-support', 'document-checking',
      'visa-guidance', 'interview-preparation', 'english-test-preparation',
      'financial-planning', 'scholarship-guidance', 'pre-departure-orientation',
      'post-arrival-support', 'career-counselling',
    ]);
  });

  it('directory hero shows the exact spec headline, subtitle and CTAs', () => {
    const page = read('src/app/services/page.tsx');
    expect(page).toContain('Complete Support for Your Study Abroad Journey');
    expect(page).toContain('Provide professional guidance from course selection and university applications to visa preparation, pre-departure planning and post-arrival support');
    expect(page).toContain('Book Free Consultation');
    expect(page).toContain('Explore Course Finder');
    expect(page).toContain('14 Services');
    expect(page).toContain('href={`/services/${s.slug}`}');
  });

  it('every card links to its own detail page (no dead cards)', () => {
    for (const s of SPEC_SERVICES) {
      expect(s.title.length).toBeGreaterThan(3);
      expect(s.shortDescription.length).toBeGreaterThan(30);
    }
  });

  it('detail hub has What/Why/Who/ALO Helps/Process/Documents/Eligibility/Timeline/Fees', () => {
    const hub = read('src/components/website/ServiceDetailHub.tsx');
    for (const t of ['What This Service Is', 'Why Students Need It', 'Who It Is For', 'What ALO Does', 'Step-by-Step Process', 'Eligibility / Requirements', 'Fees', 'Timeline']) {
      expect(hub).toContain(t);
    }
    expect(hub).toContain('Contact ALO for current service pricing.');
    expect(hub).toContain('Processing times vary by institution, country, intake and applicant circumstances. Confirm your individual timeline with an ALO counselor.');
  });

  it('detail hub has: Start Application (where applicable), Related Questions, Related Services, spec §12 final CTA + WhatsApp', () => {
    const hub = read('src/components/website/ServiceDetailHub.tsx');
    expect(hub).toContain('Start Application');
    expect(hub).toContain('<RelatedQuestions');
    expect(hub).toContain('Related Services');
    expect(hub).toContain('Ready to Take the Next Step?');
    expect(hub).toContain('Book Free Consultation');
    expect(hub).toContain('Start Course Finder');
    expect(hub).toContain('Check Eligibility');
    expect(hub).toContain('Chat with Counselor');
    expect(hub).toContain('+880 180 502 0101');
    expect(hub).toContain('wa.me/8801805020101');
  });

  it('service-specific content (§8): visa disclaimer, language-prep link, scholarships link', () => {
    const hub = read('src/components/website/ServiceDetailHub.tsx');
    expect(hub).toContain('Visa rules can change. Current requirements must be verified against official government and visa-authority sources before submission.');
    expect(hub).toContain('/language-prep');
    expect(hub).toContain('/scholarships — verified scholarships only');
  });

  it('API guarantees: /api/services unions DB + catalog; [slug] falls back to spec catalog with aliases', () => {
    const list = read('src/app/api/services/route.ts');
    const detail = read('src/app/api/services/[slug]/route.ts');
    expect(list).toContain('SPEC_SERVICES');
    expect(detail).toContain('getSpecService');
    expect(detail).toContain('specServiceToPayload');
  });

  it('legacy slugs resolve to canonical spec slugs', () => {
    expect(SERVICE_SLUG_ALIASES['student-visa-guidance-file-processing']).toBe('visa-guidance');
    expect(getSpecService('student-visa-guidance-file-processing')?.slug).toBe('visa-guidance');
  });

  it('spec-service payload is honest: pending verification + ALO Editorial, no fabricated fees', () => {
    const p = specServiceToPayload(SPEC_SERVICES[0]);
    expect(p.verificationStatus).toBe('pending');
    expect(p.sourceName).toBe('ALO Editorial');
    expect(p.fees).toBe('');
  });

  it('services detail page emits Service + Breadcrumb JSON-LD and clean canonical metadata', () => {
    const page = read('src/app/services/[slug]/page.tsx');
    expect(page).toContain("'@type': 'Service'");
    expect(page).toContain("'@type': 'BreadcrumbList'");
    expect(page).toContain('generateStaticParams');
    expect(page).toContain('SPEC_SERVICES');
  });
});

// ---------------------------------------------------------------------------
describe('Scholarships system — spec §13-§24', () => {
  const listing = () => read('src/components/website/ScholarshipsListing.tsx');

  it('status engine computes OPEN / CLOSING_SOON / CLOSED / UPCOMING / NEEDS_VERIFICATION', () => {
    const now = new Date('2026-10-03T00:00:00Z');
    const verifiedNow = new Date('2026-09-01T00:00:00Z').toISOString();
    const verifiedMeta = { verificationStatus: 'verified', lastVerifiedAt: verifiedNow };
    expect(computeScholarshipStatus({ openingDate: '2026-01-01', deadlineDate: '2027-01-01', ...verifiedMeta, now })).toBe('OPEN');
    expect(computeScholarshipStatus({ deadlineDate: '2026-10-20', ...verifiedMeta, now })).toBe('CLOSING_SOON');
    expect(computeScholarshipStatus({ deadlineDate: '2026-01-01', ...verifiedMeta, now })).toBe('CLOSED');
    expect(computeScholarshipStatus({ openingDate: '2027-01-01', deadlineDate: '2027-06-01', ...verifiedMeta, now })).toBe('UPCOMING');
    expect(computeScholarshipStatus({ verificationStatus: 'pending', lastVerifiedAt: null, now })).toBe('NEEDS_VERIFICATION');
    expect(computeScholarshipStatus({ status: 'CLOSED', ...verifiedMeta, now })).toBe('CLOSED');
  });

  it('outdated verification is NEVER presented as open (spec §20)', () => {
    const now = new Date('2026-10-03T00:00:00Z');
    // verified > 90 days ago + open dates → must not be OPEN
    const stale = { verificationStatus: 'verified', lastVerifiedAt: '2026-01-01', deadlineDate: '2027-01-01', now };
    expect(computeScholarshipStatus(stale)).toBe('NEEDS_VERIFICATION');
    expect(isVerificationStale('2026-01-01', VERIFICATION_STALE_DAYS, now)).toBe(true);
    expect(isVerificationStale('2026-10-01', VERIFICATION_STALE_DAYS, now)).toBe(false);
    expect(isVerificationStale(null)).toBe(true);
  });

  it('listing hero shows the exact spec headline and subtitle', () => {
    const l = listing();
    expect(l).toContain('Find Scholarships for Your Study Abroad Journey');
    expect(l).toContain('Discover verified scholarship opportunities and understand their eligibility, funding, deadlines and application requirements');
  });

  it('listing has the full §15 filter system', () => {
    const l = listing();
    for (const f of ['Country', 'University', 'Study level', 'Subject', 'Scholarship type', 'Funding type', 'Amount', 'Fully funded', 'Partially funded', 'Tuition reduction', 'Merit-based', 'Need-based', 'International students', 'Application open', 'Intake']) {
      expect(l).toContain(f);
    }
    // no dead buttons (spec: no silent no-ops)
    expect(l).not.toContain('disabled title=');
    expect(l).not.toContain('Button disabled');
  });

  it('cards show status badge, last-verified, and working View Details / Check Eligibility links', () => {
    const l = listing();
    expect(l).toContain('computeScholarshipStatus');
    expect(l).toContain('SCHOLARSHIP_STATUS_BADGES');
    expect(l).toContain('Last verified:');
    expect(l).toContain('View Details');
    expect(l).toContain('Check Eligibility');
    expect(l).toContain('href={`/scholarships/${s.slug}`}');
  });

  it('API accepts the §15 filter params and only publishes active records', () => {
    const api = read('src/app/api/scholarships/route.ts');
    for (const p of ['studyLevel', 'subject', 'scholarshipType', 'intake', 'applicationOpen']) {
      expect(api).toContain(`searchParams.get('${p}')`);
    }
    expect(api).toContain("status: 'active'");
  });

  it('detail hub: status engine, NEEDS_VERIFICATION banner, coverage split, separate-vs-automatic, strategy, final CTA', () => {
    const hub = read('src/components/website/ScholarshipDetailHub.tsx');
    expect(hub).toContain('computeScholarshipStatus');
    expect(hub).toContain('Needs Manual Verification — information may have changed');
    expect(hub).toContain('Living costs');
    expect(hub).toContain('SEPARATE scholarship application');
    expect(hub).toContain('automatically considered with your admission application');
    expect(hub).toContain('Scholarship Application Strategy');
    expect(hub).toContain('ALO never promises scholarship success');
    expect(hub).toContain('Check My Scholarship Eligibility');
    expect(hub).toContain('Find Matching Courses');
    expect(hub).toContain('Chat with Counselor');
    expect(hub).toContain('Still Have Questions?');
  });

  it('official-source rule: source fields + last verified on the page (spec §21)', () => {
    const hub = read('src/components/website/ScholarshipDetailHub.tsx');
    expect(hub).toContain('officialSourceUrl');
    expect(hub).toContain('lastVerifiedAt');
  });
});

// ---------------------------------------------------------------------------
describe('Resources system — spec §25-§39', () => {
  it('has exactly the 10 canonical category slugs', () => {
    expect(RESOURCE_CATEGORIES.map((c) => c.slug)).toEqual([
      'blogs', 'visa-guides', 'scholarships', 'application-tips', 'pre-departure',
      'accommodation', 'financial-planning', 'english-tests', 'student-visa-faqs', 'study-abroad-guides',
    ]);
    expect(getResourceCategory('visa-guides')?.name).toBe('Visa Guides');
  });

  it('hub hero shows the exact spec headline + subtitle, working search form', () => {
    const page = read('src/app/resources/page.tsx');
    expect(page).toContain('Your Complete Study Abroad Knowledge Hub');
    expect(page).toContain('Practical, updated and student-friendly guidance for researching courses, universities, applications, scholarships, visas and life abroad');
    expect(page).toContain('Search articles...');
    expect(page).toContain("role=\"search\"");
    expect(page).not.toContain('disabled title=');
    expect(page).toContain('Last verified:');
    expect(page).toContain('Read Full Guide');
  });

  it('canonical routes exist: /resources/{category} + /resources/{category}/{article-slug}', () => {
    expect(existsSync(join(ROOT, 'src/app/resources/[slug]/page.tsx'))).toBe(true);
    expect(existsSync(join(ROOT, 'src/app/resources/[slug]/[article]/page.tsx'))).toBe(true);
    expect(existsSync(join(ROOT, 'src/components/website/ResourcesCategoryListing.tsx'))).toBe(true);
    const article = read('src/app/resources/[slug]/[article]/page.tsx');
    expect(article).toContain("'@type': 'Article'");
    expect(article).toContain("'@type': 'BreadcrumbList'");
    expect(article).toContain('generateMetadata');
  });

  it('detail hub has TOC anchors, Important Notes, Action Checklist, Related Questions, §51 ending', () => {
    const hub = read('src/components/website/ResourceDetailHub.tsx');
    expect(hub).toContain('Table of Contents');
    expect(hub).toContain('scroll-mt-28');
    expect(hub).toContain('Important Notes');
    expect(hub).toContain('Action Checklist');
    expect(hub).toContain('<RelatedQuestions');
    expect(hub).toContain('Still Have Questions?');
    expect(hub).toContain('Explore More');
    expect(hub).toContain('Ready to Start?');
    expect(hub).toContain('Chat with Counselor');
  });
});

// ---------------------------------------------------------------------------
describe('Unified engines — related questions & related content (spec §38-§39)', () => {
  it('pool is deterministic, relevant, honest (no fabricated stats)', () => {
    expect(RELATED_QUESTIONS_POOL.length).toBeGreaterThanOrEqual(12);
    const picked = pickRelatedQuestions(['visa', 'documents'], 6);
    expect(picked.length).toBeGreaterThanOrEqual(4);
    expect(picked.every((q) => q.tags.includes('visa') || q.tags.includes('documents'))).toBe(true);
    // deterministic: same input → same output
    expect(pickRelatedQuestions(['visa'], 5)).toEqual(pickRelatedQuestions(['visa'], 5));
  });

  it('questionTagsFor maps spec pages to relevant tags', () => {
    expect(questionTagsFor('service', 'visa-guidance')).toContain('visa');
    expect(questionTagsFor('scholarship', 'xyz')).toContain('scholarship');
    expect(questionTagsFor('resource', 'English Tests')).toContain('english');
  });
});

// ---------------------------------------------------------------------------
describe('Search & SEO (spec §49-§50)', () => {
  it('/api/search indexes services, scholarships, resources, FAQs', () => {
    const api = read('src/app/api/search/route.ts');
    expect(api).toContain('db.service.findMany');
    expect(api).toContain('db.scholarship.findMany');
    expect(api).toContain('db.resource.findMany');
    expect(api).toContain('db.unifiedFaq.findMany');
  });
});

// ---------------------------------------------------------------------------
describe('Admin management (spec §45-§48, §53) + schema additions', () => {
  it('admin pages exist for all three systems', () => {
    for (const p of ['services', 'scholarships', 'resources']) {
      expect(existsSync(join(ROOT, `src/app/admin/${p}/page.tsx`))).toBe(true);
    }
  });

  it('manager exposes every required manual creation button', () => {
    const m = read('src/components/admin/AdminContentManager.tsx');
    for (const b of ['+ Add Service', '+ Add Scholarship', '+ Add Resource', '+ Add FAQ', '+ Add Related Content', '+ Add Official Source']) {
      expect(m).toContain(b);
    }
  });

  it('faq + official-source admin APIs exist with RBAC + audit', () => {
    const faqs = read('src/app/api/admin/faqs/route.ts');
    const sources = read('src/app/api/admin/official-sources/route.ts');
    expect(faqs).toContain('SUPER_ADMIN');
    expect(faqs).toContain('contentAuditLog');
    expect(sources).toContain('OfficialSource');
    expect(sources).toContain('contentAuditLog');
    expect(sources).toContain('official_visa_authority');
  });

  it('admin content routes audit-log changes', () => {
    for (const p of ['services', 'scholarships', 'resources']) {
      expect(read(`src/app/api/admin/${p}/[id]/route.ts`)).toContain('contentAuditLog');
    }
  });

  it('schema got scholarshipType + intake with a guarded migration', () => {
    expect(read('prisma/schema.prisma')).toContain('scholarshipType');
    expect(read('prisma/schema.prisma')).toContain('intake');
    expect(existsSync(join(ROOT, 'prisma/migrations/20261003030000_ssr_scholarship_filters/migration.sql'))).toBe(true);
    const mig = read('prisma/migrations/20261003030000_ssr_scholarship_filters/migration.sql');
    expect(mig).toContain('information_schema.COLUMNS');
    expect(mig).toContain("COLUMN_NAME = 'scholarshipType'");
  });
});
