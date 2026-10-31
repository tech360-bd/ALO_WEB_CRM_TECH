import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  contentFindUnique: vi.fn(),
}));

vi.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: mocks.authenticateRequest,
}));

vi.mock('@/lib/db', () => ({
  db: {
    marketingGeneratedContent: {
      findUnique: mocks.contentFindUnique,
    },
  },
}));

import { auditSeoPage } from '@/lib/seo/page-auditor';
import {
  collegeOrUniversitySchema,
  courseSchema,
  faqPageSchema,
  organizationSchema,
} from '@/lib/seo/schema-helpers';
import { POST } from '@/app/api/seo/audit/route';

beforeEach(() => {
  vi.stubEnv('NEXTAUTH_URL', 'https://alo.test');
  mocks.authenticateRequest.mockReset().mockResolvedValue({
    userId: 'seo-1',
    actorUserId: 'seo-1',
    userType: 'MARKETING_MANAGER',
    roles: ['MARKETING_MANAGER'],
    permissions: [],
  });
  mocks.contentFindUnique.mockReset().mockResolvedValue(null);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('Deterministic Technical SEO & Schema.org JSON-LD Auditor', () => {
  it('passes compliant destination pages with valid CollegeOrUniversity & Course JSON-LD', () => {
    const uniLd = collegeOrUniversitySchema({
      name: 'University of Manchester',
      slug: 'university-of-manchester',
      country: 'GB',
      city: 'Manchester',
      officialWebsite: 'https://www.manchester.ac.uk',
    });
    const courseLd = courseSchema({
      name: 'MSc Advanced Computer Science',
      description: 'Postgraduate computer science degree in Manchester.',
      slug: 'msc-advanced-computer-science',
      providerName: 'University of Manchester',
    });

    const report = auditSeoPage({
      title: 'MSc Advanced Computer Science — University of Manchester',
      metaDescription:
        'Explore verified entry requirements, tuition fees, and intakes for MSc Advanced Computer Science at the University of Manchester.',
      canonicalUrl: 'https://aloeducation.com/course/msc-advanced-computer-science',
      markdown:
        '# MSc Advanced Computer Science\n\nCompare programs in [Course Finder](/course-finder) or view [UK Scholarships](/scholarships).\n\n## Entry Criteria\n\nCheck official academic requirements.',
      jsonLd: [organizationSchema(), uniLd, courseLd],
    });

    expect(report.verification).toBe('deterministic_content_audit_not_search_engine_indexation');
    expect(report.summary.failed).toBe(0);
    expect(report.summary.warnings).toBe(0);
    expect(report.jsonLd.detectedTypes).toEqual([
      'EducationalOrganization',
      'CollegeOrUniversity',
      'Course',
    ]);
  });

  it('catches prohibited 100% visa/admission guarantees, broken JSON-LD, dead anchors, and skipped headings', () => {
    const html = `
      <html>
        <head>
          <title>Short</title>
          <meta name="description" content="Short" />
          <link rel="canonical" href="http://insecure.example/page?utm_source=x" />
          <script type="application/ld+json">{ bad json</script>
        </head>
        <body>
          <h1>Study Abroad</h1>
          <h3>Skipped H2</h3>
          <p>Apply today for 100% visa approval and guaranteed admission!</p>
          <a href="javascript:void(0)">Click</a>
          <img src="/hero.jpg" />
        </body>
      </html>
    `;

    const report = auditSeoPage({ html });
    const byId = Object.fromEntries(report.checks.map((c) => [c.id, c]));

    expect(byId.title_tag.status).toBe('WARN');
    expect(byId.canonical_url.status).toBe('FAIL');
    expect(byId.heading_hierarchy.status).toBe('WARN');
    expect(byId.internal_links.status).toBe('FAIL');
    expect(byId.image_alt.status).toBe('WARN');
    expect(byId.schema_json_ld.status).toBe('FAIL');
    expect(byId.compliance_guard.status).toBe('FAIL');
  });

  it('emits Google FAQ rich-result advisory on FAQPage schemas', () => {
    const faq = faqPageSchema([{ question: 'When is intake?', answer: 'January and September.' }]);
    const report = auditSeoPage({
      title: 'UK Intake Frequently Asked Questions — ALO Education',
      metaDescription:
        'Verified answers on UK university intakes, document timelines, and counseling steps for Bangladeshi applicants.',
      canonicalUrl: 'https://aloeducation.com/faqs',
      markdown: '# UK Intake FAQs\n\nSee [Course Finder](/course-finder) and [Apply](/apply).',
      jsonLd: [faq],
    });
    expect(report.jsonLd.advisories.length).toBeGreaterThan(0);
  });

  it('enforces SEO staff authorization and cross-origin protection on POST /api/seo/audit', async () => {
    mocks.authenticateRequest.mockResolvedValueOnce({
      userId: 'stu-1',
      actorUserId: 'stu-1',
      userType: 'STUDENT',
      roles: ['STUDENT'],
      permissions: [],
    });

    const studentRes = await POST(
      new Request('https://alo.test/api/seo/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', origin: 'https://alo.test' },
        body: JSON.stringify({ title: 'Test page title of valid length here' }),
      }),
    );
    expect(studentRes.status).toBe(403);

    const crossOriginRes = await POST(
      new Request('https://alo.test/api/seo/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', origin: 'https://evil.invalid' },
        body: JSON.stringify({ title: 'Test page title of valid length here' }),
      }),
    );
    expect(crossOriginRes.status).toBe(403);
  });
});
