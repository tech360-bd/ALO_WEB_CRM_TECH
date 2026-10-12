import { createHash } from 'crypto';
import type {
  CourseUrlDiscovery,
  ExtractedCourseRecord,
  ExtractedUniversityProfile,
  OfficialSourceType,
  SourceCheckResult,
  UniversityAdapter,
} from './base-adapter';

type FetchLike = typeof fetch;

const PARSER_VERSION = 'aston-adapter-2026-08-01';
const ASTON_DOMAIN = 'www.aston.ac.uk';
const USER_AGENT = 'ALOEducationOfficialVerification/1.0 (+https://aloeducation.com)';

function stripTags(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function sha256(input: string): string {
  return createHash('sha256').update(input || '').digest('hex');
}

function pageTitleFromHtml(html: string): string {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return title ? stripTags(title) : '';
}

function headingFromHtml(html: string): string {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  return h1 ? stripTags(h1) : '';
}

function normalizeUrl(url: string, base = 'https://www.aston.ac.uk'): string {
  return new URL(url, base).toString().split('#')[0].split('?')[0];
}

function isAstonUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    return host === 'aston.ac.uk' || host.endsWith('.aston.ac.uk');
  } catch {
    return false;
  }
}

function extractMoney(text: string): { amount: number; currency: string } | null {
  const match = text.match(/(?:£|GBP\s*)(\d{1,3}(?:,\d{3})+|\d{4,6})(?:\.\d{2})?/i);
  if (!match) return null;
  return {
    amount: Number(match[1].replace(/,/g, '')),
    currency: 'GBP',
  };
}

function extractAward(title: string): string {
  const awards = ['MBA', 'MSc', 'MA', 'MRes', 'LLM', 'BEng', 'BSc', 'BA', 'LLB', 'PhD', 'MPhil'];
  return awards.find((award) => new RegExp(`\\b${award}\\b`, 'i').test(title)) || '';
}

function classifyStudyLevel(title: string, html: string): string {
  const combined = `${title} ${stripTags(html)}`;
  if (/\b(PhD|MPhil|research degree|doctoral)\b/i.test(combined)) return 'Research';
  if (/\b(foundation|international year one|pathway)\b/i.test(combined)) return 'Foundation';
  if (/\b(MSc|MA|MBA|LLM|MRes|postgraduate taught|postgraduate)\b/i.test(combined)) return 'Postgraduate';
  if (/\b(BSc|BA|BEng|LLB|undergraduate)\b/i.test(combined)) return 'Undergraduate';
  if (/\b(apprenticeship)\b/i.test(combined)) return 'Apprenticeship';
  return 'NEEDS_REVIEW';
}

function extractDuration(text: string): string {
  return text.match(/\b(\d+\s*(?:year|years|month|months)|full-time\s+\d+\s*year[s]?|part-time\s+\d+\s*year[s]?)\b/i)?.[0] || '';
}

function extractIelts(text: string): { overall?: number; component?: number } {
  const overall = text.match(/IELTS[^.\n]{0,80}?(\d(?:\.\d)?)/i)?.[1];
  const component = text.match(/(?:minimum|at least)[^.\n]{0,60}?(\d(?:\.\d)?)[^.\n]{0,50}?(?:component|skill|band)/i)?.[1];
  return {
    overall: overall ? Number(overall) : undefined,
    component: component ? Number(component) : undefined,
  };
}

function extractIntakes(text: string): ExtractedCourseRecord['intakes'] {
  const seen = new Set<string>();
  const intakes: ExtractedCourseRecord['intakes'] = [];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  for (const month of months) {
    const regex = new RegExp(`\\b${month}\\s+(20\\d{2})\\b`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text))) {
      const key = `${month}-${match[1]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      intakes.push({
        intakeMonth: month,
        intakeYear: match[1],
        status: 'NEEDS_REVIEW',
      });
    }
  }
  return intakes;
}

export class AstonAdapter implements UniversityAdapter {
  adapterName = 'AstonAdapter';
  targetDomain = 'aston.ac.uk';
  private fetcher: FetchLike;

  constructor(fetcher: FetchLike = fetch) {
    this.fetcher = fetcher;
  }

  async fetchSourceCheck(url: string, sourceType: OfficialSourceType, expectedEntity = 'Aston University'): Promise<SourceCheckResult> {
    const requestedUrl = normalizeUrl(url);
    const checkedAt = new Date().toISOString();
    try {
      if (!isAstonUrl(requestedUrl)) {
        return {
          requestedUrl,
          finalUrl: requestedUrl,
          httpStatus: 0,
          ok: false,
          pageTitle: '',
          sourceType,
          expectedEntity,
          entityMatchStatus: 'MISMATCHED',
          soft404: false,
          contentHash: '',
          checkedAt,
          failureReason: 'URL is not on an Aston University domain.',
        };
      }

      const response = await this.fetcher(requestedUrl, {
        redirect: 'follow',
        headers: { 'User-Agent': USER_AGENT },
      });
      const html = await response.text();
      const finalUrl = response.url || requestedUrl;
      const pageTitle = pageTitleFromHtml(html);
      const visibleText = stripTags(html);
      const soft404 = response.ok && /page not found|404|not available|course no longer available/i.test(`${pageTitle} ${visibleText.slice(0, 800)}`);
      const entityMatchStatus = /Aston University/i.test(`${pageTitle} ${visibleText.slice(0, 2000)}`) ? 'MATCHED' : 'NOT_CHECKED';

      return {
        requestedUrl,
        finalUrl,
        httpStatus: response.status,
        ok: response.ok,
        pageTitle,
        sourceType,
        expectedEntity,
        entityMatchStatus,
        soft404,
        contentHash: sha256(html),
        checkedAt,
        failureReason: response.ok ? undefined : response.statusText || `HTTP ${response.status}`,
        html,
      };
    } catch (error) {
      return {
        requestedUrl,
        finalUrl: requestedUrl,
        httpStatus: 0,
        ok: false,
        pageTitle: '',
        sourceType,
        expectedEntity,
        entityMatchStatus: 'NOT_CHECKED',
        soft404: false,
        contentHash: '',
        checkedAt,
        failureReason: error instanceof Error ? error.message : 'Unknown fetch error',
      };
    }
  }

  discoverCourseUrlsFromHtml(html: string, sourceUrl = 'https://www.aston.ac.uk/courses-atoz'): CourseUrlDiscovery[] {
    const urls = new Map<string, CourseUrlDiscovery>();
    const hrefRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;
    while ((match = hrefRegex.exec(html))) {
      const href = match[1];
      if (!/(^\/courses\/|^\/study\/courses(?:-phd)?\/|^https:\/\/www\.aston\.ac\.uk\/(?:courses|study\/courses(?:-phd)?)\/)/i.test(href)) continue;
      const url = normalizeUrl(href);
      if (url.endsWith('/courses-atoz') || !isAstonUrl(url)) continue;
      const linkText = stripTags(match[2]);
      urls.set(url, {
        url,
        sourceUrl,
        linkText,
        contentHash: sha256(`${url}|${linkText}`),
      });
    }
    return [...urls.values()].sort((a, b) => a.url.localeCompare(b.url));
  }

  async discoverCourseUrls(catalogUrl = 'https://www.aston.ac.uk/courses-atoz'): Promise<CourseUrlDiscovery[]> {
    const check = await this.fetchSourceCheck(catalogUrl, 'COURSE_DIRECTORY');
    if (!check.ok || !check.html || check.soft404) return [];
    return this.discoverCourseUrlsFromHtml(check.html, check.finalUrl);
  }

  async parseUniversityProfile(url = 'https://www.aston.ac.uk'): Promise<ExtractedUniversityProfile> {
    const sourceChecks = await Promise.all([
      this.fetchSourceCheck(url, 'UNIVERSITY_PROFILE'),
      this.fetchSourceCheck('https://www.aston.ac.uk/international', 'INTERNATIONAL_ADMISSIONS'),
      this.fetchSourceCheck('https://www.aston.ac.uk/courses-atoz', 'COURSE_DIRECTORY'),
    ]);

    return {
      officialName: 'Aston University',
      aliases: ['Aston'],
      officialWebsite: 'https://www.aston.ac.uk',
      internationalAdmissionsUrl: 'https://www.aston.ac.uk/international',
      country: 'United Kingdom',
      region: 'West Midlands',
      city: 'Birmingham',
      campuses: ['Birmingham'],
      institutionType: 'NEEDS_REVIEW',
      availableStudyLevels: ['Undergraduate', 'Postgraduate', 'Research', 'Apprenticeship', 'Foundation'],
      rankingRecords: [],
      lastVerifiedAt: '',
      verificationStatus: 'NEEDS_REVIEW',
      officialSourceChecks: sourceChecks,
    };
  }

  parseCourseIdentity(html: string, url: string): Partial<ExtractedCourseRecord> {
    const rawTitle = headingFromHtml(html) || pageTitleFromHtml(html).replace(/\s*\|\s*Aston University.*$/i, '').trim();
    const award = extractAward(rawTitle);
    return {
      officialCourseTitle: rawTitle || 'NEEDS_REVIEW',
      normalizedTitle: rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(),
      officialCourseUrl: normalizeUrl(url),
      award,
      qualification: award || 'NEEDS_REVIEW',
      studyLevel: classifyStudyLevel(rawTitle, html),
      courseStatus: /closed|not currently accepting|archived|no longer available/i.test(stripTags(html)) ? 'ARCHIVED' : 'NEEDS_REVIEW',
    };
  }

  parseCourseDelivery(html: string): Partial<ExtractedCourseRecord> {
    const text = stripTags(html);
    const online = /\bonline|distance learning\b/i.test(text);
    const partTime = /\bpart[- ]time\b/i.test(text);
    const fullTime = /\bfull[- ]time\b/i.test(text);
    const duration = extractDuration(text);
    return {
      campus: /London/i.test(text) ? 'London' : 'Birmingham',
      city: /London/i.test(text) ? 'London' : 'Birmingham',
      country: 'United Kingdom',
      studyMode: partTime && !fullTime ? 'Part-time' : fullTime ? 'Full-time' : 'NEEDS_REVIEW',
      deliveryMode: online ? 'Online' : 'Campus-based',
      duration,
      placementOption: /placement|sandwich year|year in industry/i.test(text),
      internshipOption: /internship/i.test(text),
      yearAbroad: /year abroad|study abroad/i.test(text),
      startMonth: '',
      startYear: '',
    };
  }

  parseFees(html: string, url: string): Partial<ExtractedCourseRecord> {
    const text = stripTags(html);
    const fee = extractMoney(text);
    return {
      internationalTuitionFee: fee?.amount,
      feeCurrency: fee?.currency || 'NOT_PUBLISHED',
      feePeriod: /per year|yearly|annual/i.test(text) ? 'year' : 'NEEDS_REVIEW',
      feeYear: text.match(/\b20\d{2}\/\d{2}\b/)?.[0] || 'NEEDS_REVIEW',
      feeSourceUrl: normalizeUrl(url),
    };
  }

  parseIntakes(html: string): Array<ExtractedCourseRecord['intakes'][0]> {
    return extractIntakes(stripTags(html));
  }

  parseRequirements(html: string): Partial<ExtractedCourseRecord> {
    const text = stripTags(html);
    const ielts = extractIelts(text);
    const academicSnippet = text.match(/(?:Entry requirements|Entry requirement|Academic requirements)(.{0,700})/i)?.[0] || 'NOT_PUBLISHED';
    return {
      academicRequirements: academicSnippet,
      englishRequirements: ielts.overall ? `IELTS ${ielts.overall}` : 'NOT_PUBLISHED',
      ieltsOverall: ielts.overall,
      ieltsComponentMin: ielts.component,
      bangladeshRequirements: /Bangladesh/i.test(text) ? text.match(/Bangladesh.{0,500}/i)?.[0] : 'NOT_PUBLISHED',
      workExperienceRequired: /work experience/i.test(text),
      portfolioRequired: /portfolio/i.test(text),
      interviewRequired: /interview|audition/i.test(text),
    };
  }

  parseModules(html: string): Array<{ title: string; yearOrSemester?: string; compulsory: boolean }> {
    const matches = [...html.matchAll(/<(?:h3|h4|li)[^>]*>([\s\S]{8,140}?)<\/(?:h3|h4|li)>/gi)]
      .map((match) => stripTags(match[1]))
      .filter((text) => /module|credit|semester|year \d/i.test(text))
      .slice(0, 40);
    return matches.map((title) => ({ title, compulsory: /compulsory|required|core/i.test(title) }));
  }

  parseScholarships(html: string): Array<{ name: string; amount: string; url: string }> {
    const text = stripTags(html);
    if (!/scholarship/i.test(text)) return [];
    return [{
      name: 'NEEDS_REVIEW',
      amount: 'NOT_PUBLISHED',
      url: 'https://www.aston.ac.uk/international/scholarships',
    }];
  }

  parseCoursePage(html: string, url: string, sourceCheck?: SourceCheckResult): ExtractedCourseRecord {
    const identity = this.parseCourseIdentity(html, url);
    const delivery = this.parseCourseDelivery(html);
    const fees = this.parseFees(html, url);
    const intakes = this.parseIntakes(html);
    const requirements = this.parseRequirements(html);
    const modules = this.parseModules(html);
    const now = new Date().toISOString();
    const parseWarnings: string[] = ['Heuristic extraction requires field-level review before verification.'];
    if (!fees.internationalTuitionFee) parseWarnings.push('International fee not found on course page.');
    if (intakes.length === 0) parseWarnings.push('Structured intake not found on course page.');
    if (requirements.academicRequirements === 'NOT_PUBLISHED') parseWarnings.push('Academic requirement section not found on course page.');

    const record: ExtractedCourseRecord = {
      officialCourseTitle: identity.officialCourseTitle || 'NEEDS_REVIEW',
      normalizedTitle: identity.normalizedTitle || '',
      officialCourseUrl: normalizeUrl(url),
      award: identity.award || '',
      qualification: identity.qualification || 'NEEDS_REVIEW',
      studyLevel: identity.studyLevel || 'NEEDS_REVIEW',
      courseStatus: identity.courseStatus || 'NEEDS_REVIEW',
      campus: delivery.campus || 'NEEDS_REVIEW',
      city: delivery.city || 'NEEDS_REVIEW',
      country: delivery.country || 'United Kingdom',
      studyMode: delivery.studyMode || 'NEEDS_REVIEW',
      deliveryMode: delivery.deliveryMode || 'NEEDS_REVIEW',
      duration: delivery.duration || 'NOT_PUBLISHED',
      placementOption: Boolean(delivery.placementOption),
      internshipOption: Boolean(delivery.internshipOption),
      yearAbroad: Boolean(delivery.yearAbroad),
      startMonth: '',
      startYear: '',
      intakes,
      internationalTuitionFee: fees.internationalTuitionFee,
      feeCurrency: fees.feeCurrency || 'NOT_PUBLISHED',
      feePeriod: fees.feePeriod || 'NEEDS_REVIEW',
      feeYear: fees.feeYear || 'NEEDS_REVIEW',
      feeSourceUrl: fees.feeSourceUrl || normalizeUrl(url),
      academicRequirements: requirements.academicRequirements || 'NOT_PUBLISHED',
      englishRequirements: requirements.englishRequirements || 'NOT_PUBLISHED',
      ieltsOverall: requirements.ieltsOverall,
      ieltsComponentMin: requirements.ieltsComponentMin,
      bangladeshRequirements: requirements.bangladeshRequirements || 'NOT_PUBLISHED',
      workExperienceRequired: Boolean(requirements.workExperienceRequired),
      portfolioRequired: Boolean(requirements.portfolioRequired),
      interviewRequired: Boolean(requirements.interviewRequired),
      courseSummary: stripTags(html).slice(0, 600),
      modules,
      sourceUrl: normalizeUrl(url),
      pageTitle: pageTitleFromHtml(html),
      extractedTimestamp: now,
      lastVerifiedTimestamp: '',
      verificationStatus: 'NEEDS_REVIEW',
      parserVersion: PARSER_VERSION,
      contentChecksum: sha256(html),
      evidenceSnippet: this.collectEvidence(url, html, 'course_page'),
      sourceChecks: sourceCheck ? [sourceCheck] : [],
      parseWarnings,
    };

    return record;
  }

  validateRecord(record: ExtractedCourseRecord): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!record.officialCourseTitle || record.officialCourseTitle === 'NEEDS_REVIEW') errors.push('Missing official course title');
    if (!record.officialCourseUrl || !isAstonUrl(record.officialCourseUrl)) errors.push('Missing official Aston course URL');
    if (!record.country || record.country === 'NEEDS_REVIEW') errors.push('Missing country');
    if (!record.studyLevel || record.studyLevel === 'NEEDS_REVIEW') errors.push('Missing study level');
    if (!record.sourceChecks?.length) errors.push('Missing source check evidence');
    return { valid: errors.length === 0, errors };
  }

  collectEvidence(url: string, html: string, fieldName: string): string {
    const text = stripTags(html).slice(0, 300);
    return `[EVIDENCE:${fieldName}] URL: ${normalizeUrl(url)} | SHA256: ${sha256(html)} | Snippet: ${text}`;
  }
}

export const astonParserInternals = {
  stripTags,
  sha256,
  extractMoney,
  extractIelts,
  extractIntakes,
  classifyStudyLevel,
};
