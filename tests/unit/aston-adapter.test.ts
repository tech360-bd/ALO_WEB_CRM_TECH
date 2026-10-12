import { describe, expect, it } from 'vitest';
import { AstonAdapter, astonParserInternals } from '@/lib/official-crawlers/aston-adapter';

const catalogueFixture = `
<html>
  <head><title>Courses A-Z | Aston University</title></head>
  <body>
    <a href="/courses/postgraduate/artificial-intelligence-msc">Artificial Intelligence MSc</a>
    <a href="https://www.aston.ac.uk/courses/postgraduate/artificial-intelligence-msc?utm=ignored">AI duplicate</a>
    <a href="/courses/undergraduate/computer-science-bsc">Computer Science BSc</a>
    <a href="https://competitor.example/courses/fake">Competitor</a>
  </body>
</html>`;

const courseFixture = `
<html>
  <head><title>Artificial Intelligence MSc | Aston University</title></head>
  <body>
    <h1>Artificial Intelligence MSc</h1>
    <p>Study mode: Full-time campus-based course in Birmingham.</p>
    <p>Duration: 1 year full-time.</p>
    <p>Start dates include September 2026 and January 2027.</p>
    <p>International fee for 2026/27: £24,750 per year.</p>
    <section>
      <h2>Entry requirements</h2>
      <p>Entry requirements include a good UK honours degree or equivalent.</p>
      <p>IELTS 6.5 overall with at least 6.0 in each component.</p>
      <p>Applicants from Bangladesh should check the official country information page.</p>
    </section>
    <h3>Core module: Machine Learning</h3>
    <h3>Core module: Applied Artificial Intelligence</h3>
  </body>
</html>`;

describe('AstonAdapter official-source parsing', () => {
  it('discovers and deduplicates only Aston course URLs from catalogue HTML', () => {
    const adapter = new AstonAdapter();
    const urls = adapter.discoverCourseUrlsFromHtml(catalogueFixture);
    expect(urls).toHaveLength(2);
    expect(urls.map((item) => item.url)).toContain('https://www.aston.ac.uk/courses/postgraduate/artificial-intelligence-msc');
    expect(urls.every((item) => item.url.startsWith('https://www.aston.ac.uk/courses/'))).toBe(true);
  });

  it('separates September and January intakes from the official page text', () => {
    const adapter = new AstonAdapter();
    const intakes = adapter.parseIntakes(courseFixture);
    expect(intakes).toEqual([
      { intakeMonth: 'January', intakeYear: '2027', status: 'NEEDS_REVIEW' },
      { intakeMonth: 'September', intakeYear: '2026', status: 'NEEDS_REVIEW' },
    ]);
  });

  it('extracts fee currency and amount without inventing missing values', () => {
    const adapter = new AstonAdapter();
    expect(adapter.parseFees(courseFixture, 'https://www.aston.ac.uk/courses/postgraduate/artificial-intelligence-msc')).toMatchObject({
      internationalTuitionFee: 24750,
      feeCurrency: 'GBP',
      feeYear: '2026/27',
    });
    expect(adapter.parseFees('<html><h1>No fee</h1></html>', 'https://www.aston.ac.uk/courses/no-fee')).toMatchObject({
      internationalTuitionFee: undefined,
      feeCurrency: 'NOT_PUBLISHED',
    });
  });

  it('extracts IELTS overall and component scores', () => {
    const result = astonParserInternals.extractIelts(courseFixture);
    expect(result.overall).toBe(6.5);
    expect(result.component).toBe(6.0);
  });

  it('classifies postgraduate and campus delivery from official page content', () => {
    const adapter = new AstonAdapter();
    const course = adapter.parseCoursePage(courseFixture, 'https://www.aston.ac.uk/courses/postgraduate/artificial-intelligence-msc');
    expect(course.studyLevel).toBe('Postgraduate');
    expect(course.deliveryMode).toBe('Campus-based');
    expect(course.campus).toBe('Birmingham');
    expect(course.modules?.length).toBeGreaterThanOrEqual(2);
  });

  it('keeps records in review when source evidence is missing', () => {
    const adapter = new AstonAdapter();
    const course = adapter.parseCoursePage(courseFixture, 'https://www.aston.ac.uk/courses/postgraduate/artificial-intelligence-msc');
    expect(course.verificationStatus).toBe('NEEDS_REVIEW');
    expect(adapter.validateRecord(course).errors).toContain('Missing source check evidence');
  });

  it('does not promote a successfully fetched heuristic parse to verified', async () => {
    const adapter = new AstonAdapter(async () => new Response(courseFixture, { status: 200 }));
    const url = 'https://www.aston.ac.uk/courses/postgraduate/artificial-intelligence-msc';
    const check = await adapter.fetchSourceCheck(url, 'INDIVIDUAL_COURSE');
    expect(check.ok).toBe(true);
    const course = adapter.parseCoursePage(courseFixture, url, check);
    expect(course.verificationStatus).toBe('NEEDS_REVIEW');
    expect(course.lastVerifiedTimestamp).toBe('');
    expect(course.extractedTimestamp).not.toBe('');
    expect(course.parseWarnings).toContain('Heuristic extraction requires field-level review before verification.');
  });

  it('rejects non-Aston official-source checks', async () => {
    const adapter = new AstonAdapter(async () => {
      throw new Error('Should not fetch non-Aston URL');
    });
    const check = await adapter.fetchSourceCheck('https://example.com/course', 'INDIVIDUAL_COURSE');
    expect(check.ok).toBe(false);
    expect(check.entityMatchStatus).toBe('MISMATCHED');
  });
});
