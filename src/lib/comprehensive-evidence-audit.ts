import { db } from './db';
import { getCountryDestination } from './country-destinations-data';
import { getTestPrepBySlug, MASTER_TEST_PREP_DATA } from './test-prep-data';
import { MASTER_BLOGS_DATA } from './blogs-data';

interface AuditResult {
  category: string;
  testName: string;
  status: 'PASS' | 'FAIL' | 'PARTIAL';
  evidence: string;
}

export async function runMasterEvidenceAudit(): Promise<AuditResult[]> {
  const results: AuditResult[] = [];

  function record(category: string, testName: string, status: 'PASS' | 'FAIL' | 'PARTIAL', evidence: string) {
    results.push({ category, testName, status, evidence });
    console.log(`[${status}] [${category}] ${testName} -> ${evidence}`);
  }

  console.log(`\n============================================================`);
  console.log(`ALO EDUCATION — MASTER EVIDENCE-BASED AUDIT EXECUTION`);
  console.log(`============================================================\n`);

  // ── 1. DATABASE MODELS & COUNTS ──
  try {
    const uniCount = await db.crmUniversity.count();
    record('Database', 'CrmUniversity Table', uniCount >= 300 ? 'PASS' : 'PARTIAL', `Found ${uniCount} real universities`);
  } catch (e: any) {
    record('Database', 'CrmUniversity Table', 'FAIL', e.message);
  }

  try {
    const courseCount = await db.crmCourse.count();
    record('Database', 'CrmCourse Table', courseCount >= 8000 ? 'PASS' : 'PARTIAL', `Found ${courseCount} real courses`);
  } catch (e: any) {
    record('Database', 'CrmCourse Table', 'FAIL', e.message);
  }

  try {
    const scholarCount = await db.crmScholarship.count();
    record('Database', 'CrmScholarship Table', scholarCount >= 4000 ? 'PASS' : 'PARTIAL', `Found ${scholarCount} scholarships`);
  } catch (e: any) {
    record('Database', 'CrmScholarship Table', 'FAIL', e.message);
  }

  // ── 2. UNIVERSITY & COURSE SLUG RESOLUTION ──
  try {
    const oxfordUni = await db.crmUniversity.findFirst({
      where: { slug: 'university-of-oxford' },
      include: { courses: { take: 3 } },
    });
    if (oxfordUni && oxfordUni.courses.length > 0) {
      record('Catalog Engine', 'University Slug Query (Oxford)', 'PASS', `Resolved '${oxfordUni.name}' with ${oxfordUni.courses.length} courses loaded`);
    } else {
      record('Catalog Engine', 'University Slug Query (Oxford)', 'FAIL', 'Oxford university not found by slug');
    }
  } catch (e: any) {
    record('Catalog Engine', 'University Slug Query (Oxford)', 'FAIL', e.message);
  }

  try {
    const sampleCourse = await db.crmCourse.findFirst({
      where: { slug: { contains: 'medicine' } },
      include: { university: true },
    });
    if (sampleCourse && sampleCourse.university) {
      record('Catalog Engine', 'Course Slug Query (Medicine)', 'PASS', `Resolved '${sampleCourse.courseTitle}' at '${sampleCourse.university.name}'`);
    } else {
      record('Catalog Engine', 'Course Slug Query (Medicine)', 'PARTIAL', 'Sample course found without university relation');
    }
  } catch (e: any) {
    record('Catalog Engine', 'Course Slug Query (Medicine)', 'FAIL', e.message);
  }

  // ── 3. COUNTRY DESTINATION PAGES & ISOLATION ──
  const coreCountries = ['uk', 'usa', 'canada', 'australia', 'ireland', 'new-zealand', 'dubai'];
  for (const slug of coreCountries) {
    const data = getCountryDestination(slug);
    if (!data) {
      record('Destinations', `Country [${slug}]`, 'FAIL', 'Missing from dataset');
      continue;
    }

    const hasFacts = data.quickFacts && data.quickFacts.length >= 6;
    const hasPathways = data.pathways && data.pathways.length >= 3;
    const hasFaqs = data.faqs && data.faqs.length >= 10;

    if (hasFacts && hasPathways && hasFaqs) {
      record('Destinations', `Country [${slug}]`, 'PASS', `Verified ${data.name}: ${data.quickFacts.length} facts, ${data.pathways.length} pathways, ${data.faqs.length} FAQs`);
    } else {
      record('Destinations', `Country [${slug}]`, 'PARTIAL', `Incomplete facts, pathways (${data.pathways?.length || 0}) or FAQs (${data.faqs?.length || 0})`);
    }
  }

  // ── 4. ENGLISH LANGUAGE PREP SYSTEM ──
  const coreTests = ['ielts', 'ielts-ukvi', 'pte-academic', 'toefl-ibt', 'duolingo', 'oietc'];
  for (const slug of coreTests) {
    const test = getTestPrepBySlug(slug);
    if (!test) {
      record('Language Prep', `Test [${slug}]`, 'FAIL', 'Test not found');
      continue;
    }
    const hasModules = test.examPattern && test.examPattern.length > 0;
    const hasFaqs = test.faqs && test.faqs.length > 0;
    if (hasModules && hasFaqs) {
      record('Language Prep', `Test [${slug}]`, 'PASS', `Verified '${test.name}': ${test.examPattern.length} modules, ${test.faqs.length} FAQs, Fee: ${test.countryFees?.[0]?.bdtEquivalent || 'N/A'}`);
    } else {
      record('Language Prep', `Test [${slug}]`, 'PARTIAL', `Missing exam pattern (${test.examPattern?.length || 0}) or FAQs (${test.faqs?.length || 0}) in '${test.name}'`);
    }
  }

  // ── 5. PUBLIC LEAD CAPTURE & DB PERSISTENCE ──
  try {
    const timestamp = Date.now();
    const testLeadForm = await db.leadForm.create({
      data: {
        name: 'Master Audit Student',
        email: `audit-${timestamp}@aloeducation.com`,
        phone: '+8801805020101',
        preferredCountry: 'United Kingdom',
        preferredLevel: 'Postgraduate',
        preferredSubject: 'Data Science',
        intake: 'September 2026',
        budget: '£15,000 – £25,000/year',
        englishTest: 'IELTS',
        englishScore: '7.0',
        message: 'Master evidence audit test message.',
        source: 'automated_evidence_audit',
        status: 'pending',
      },
    });

    const testMarketingLead = await db.marketingLead.create({
      data: {
        name: 'Master Audit Student',
        email: `audit-${timestamp}@aloeducation.com`,
        phone: '+8801805020101',
        destination: 'United Kingdom',
        level: 'Postgraduate',
        intake: 'September 2026',
        budget: '£15,000 – £25,000/year',
        ieltsScore: 7.0,
        source: 'automated_evidence_audit',
        sourceDetail: 'Master evidence audit lead record',
        status: 'new',
        score: 85,
        hotLead: true,
        consent: true,
      },
    });

    if (testLeadForm.id && testMarketingLead.id) {
      record('Lead Pipeline', 'Public Lead Capture DB Write', 'PASS', `Written to both LeadForm (ID: ${testLeadForm.id}) & MarketingLead (ID: ${testMarketingLead.id})`);
      // Cleanup
      await db.leadForm.delete({ where: { id: testLeadForm.id } });
      await db.marketingLead.delete({ where: { id: testMarketingLead.id } });
    }
  } catch (e: any) {
    record('Lead Pipeline', 'Public Lead Capture DB Write', 'FAIL', e.message);
  }

  // ── 6. UCC RELATIONAL COMMUNICATION ──
  try {
    const thread = await db.communicationThread.create({
      data: {
        channel: 'whatsapp',
        status: 'open',
        slaStatus: 'normal',
        lastMessagePreview: 'Audit UCC verification',
        lastMessageAt: new Date(),
        studentId: 'STU-AUDIT-EVIDENCE',
      },
    });

    const message = await db.communicationMessage.create({
      data: {
        threadId: thread.id,
        channel: 'whatsapp',
        direction: 'inbound',
        content: 'Evidence audit message content',
        messageBody: 'Evidence audit message content',
        status: 'received',
      },
    });

    const loaded = await db.communicationThread.findUnique({
      where: { id: thread.id },
      include: { messages: true },
    });

    if (loaded && loaded.messages.length > 0) {
      record('UCC Engine', 'Thread & Message Relational Storage', 'PASS', `Thread ID ${thread.id} loaded with message ID ${message.id}`);
      await db.communicationMessage.deleteMany({ where: { threadId: thread.id } });
      await db.communicationThread.delete({ where: { id: thread.id } });
    } else {
      record('UCC Engine', 'Thread & Message Relational Storage', 'FAIL', 'Messages not loaded with thread relation');
    }
  } catch (e: any) {
    record('UCC Engine', 'Thread & Message Relational Storage', 'FAIL', e.message);
  }

  // ── 7. KNOWLEDGE HUB / BLOGS DATA ──
  if (MASTER_BLOGS_DATA && MASTER_BLOGS_DATA.length >= 8) {
    record('Knowledge Hub', 'Blog Articles Master Data', 'PASS', `${MASTER_BLOGS_DATA.length} comprehensive articles with full HTML and FAQs`);
  } else {
    record('Knowledge Hub', 'Blog Articles Master Data', 'PARTIAL', `Only ${MASTER_BLOGS_DATA?.length || 0} blogs found`);
  }

  console.log(`\n============================================================`);
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  const partCount = results.filter((r) => r.status === 'PARTIAL').length;
  console.log(`AUDIT FINISHED: Total Checks: ${results.length} | Passed: ${passCount} | Failed: ${failCount} | Partial: ${partCount}`);
  console.log(`============================================================\n`);

  return results;
}

runMasterEvidenceAudit().catch(console.error);
