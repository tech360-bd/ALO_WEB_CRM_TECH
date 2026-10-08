export const ALO_BUILDER_CONTENT_TYPES = [
  'University Page',
  'Course Page',
  'Country Guide',
  'Scholarship Page',
  'Subject Guide',
  'Blog',
  'Landing Page',
  'Event',
  'Campaign',
  'FAQ',
  'Study Guide',
  'Visa Guide',
  'English Test Guide',
] as const;

export type AloBuilderContentType = (typeof ALO_BUILDER_CONTENT_TYPES)[number];
export type FactStatus = 'KNOWN' | 'VERIFIED' | 'RESEARCH_REQUIRED' | 'OUTDATED' | 'CONFLICTING' | 'MISSING' | 'NOT_APPLICABLE';
export type ValidationSeverity = 'PASS' | 'WARNING' | 'BLOCKER';

export interface AloBuilderInput {
  prompt: string;
  contentType: AloBuilderContentType;
  country: string;
  university: string;
  course: string;
  subject: string;
  degree: string;
  intake: string;
  audience: string;
  language: string;
  tone: string;
  seoTarget: string;
  cta: string;
  publishingStatus: 'DRAFT' | 'REQUEST_REVIEW';
}

export interface BuilderEntityRef {
  type: 'country' | 'university' | 'course' | 'scholarship' | 'subject' | 'degree' | 'intake';
  id?: string;
  name: string;
  slug?: string;
  href?: string;
  verificationStatus: FactStatus;
  sourceUrl?: string;
  lastVerifiedAt?: string | null;
}

export interface BuilderGroundedFact {
  id: string;
  label: string;
  value: string;
  entityType: string;
  entityId: string;
  status: FactStatus;
  sourceName?: string;
  sourceUrl?: string;
  lastVerifiedAt?: string | null;
}

export interface BuilderImage {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  source: string;
  license: string;
  width: number;
  height: number;
  aspectRatio: number;
  entityType?: string;
  entityId?: string;
  verified: boolean;
  role: 'hero' | 'section';
}

export interface BuilderLink {
  label: string;
  href: string;
  relationship: string;
  entityType?: string;
  entityId?: string;
  status: 'VALID' | 'NEEDS_REVIEW';
}

export interface BuilderSection {
  id: string;
  title: string;
  type: 'intro' | 'editorial' | 'facts' | 'cards' | 'steps' | 'faq';
  body: string;
  imageId?: string;
  bullets?: string[];
}

export interface AloBuilderDocument {
  schemaVersion: 1;
  generationId?: string;
  slug: string;
  contentType: AloBuilderContentType;
  prompt: string;
  input: AloBuilderInput;
  title: string;
  seoTitle: string;
  metaDescription: string;
  targetKeywords: string;
  canonicalUrl: string;
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    imageId: string;
  };
  sections: BuilderSection[];
  facts: BuilderGroundedFact[];
  faqs: Array<{ question: string; answer: string; factIds?: string[] }>;
  breadcrumbs: Array<{ label: string; href: string }>;
  links: BuilderLink[];
  entities: BuilderEntityRef[];
  images: BuilderImage[];
  structuredData: Record<string, unknown>;
  translations: Array<{ language: string; status: 'GENERATED' | 'NOT_REQUESTED'; title?: string }>;
  publication: {
    status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED';
    approvalRequired: true;
    approvedBy?: string;
    approvedAt?: string;
    publishedAt?: string;
  };
}

export interface BuilderCheck {
  key: string;
  label: string;
  severity: ValidationSeverity;
  message: string;
  score: number;
}

export interface BuilderValidation {
  score: number;
  threshold: number;
  criticalThreshold: number;
  criticalPage: boolean;
  canSubmit: boolean;
  canPublish: boolean;
  categories: {
    content: number;
    seo: number;
    data: number;
    images: number;
    links: number;
    accessibility: number;
    performance: number;
  };
  checks: BuilderCheck[];
}

export const BUILDER_IMAGE_LIBRARY = [
  {
    id: 'destination-uk',
    url: '/images/cards/uk.png',
    alt: 'United Kingdom study destination',
    caption: 'United Kingdom destination overview',
    role: 'hero' as const,
    tags: ['united kingdom', 'uk', 'country guide', 'study guide'],
  },
  {
    id: 'destination-australia',
    url: '/images/cards/australia.png',
    alt: 'Australia study destination',
    caption: 'Australia destination overview',
    role: 'hero' as const,
    tags: ['australia', 'country guide', 'study guide'],
  },
  {
    id: 'destination-canada',
    url: '/images/cards/canada.png',
    alt: 'Canada study destination',
    caption: 'Canada destination overview',
    role: 'hero' as const,
    tags: ['canada', 'country guide', 'study guide'],
  },
  {
    id: 'destination-usa',
    url: '/images/cards/usa.png',
    alt: 'United States study destination',
    caption: 'United States destination overview',
    role: 'hero' as const,
    tags: ['usa', 'united states', 'country guide', 'study guide'],
  },
  {
    id: 'destination-ireland',
    url: '/images/cards/ireland.png',
    alt: 'Ireland study destination',
    caption: 'Ireland destination overview',
    role: 'hero' as const,
    tags: ['ireland', 'country guide', 'study guide'],
  },
  {
    id: 'student-counselling',
    url: '/images/services/counseling.png',
    alt: 'Student receiving one-to-one study abroad counselling',
    caption: 'Plan your next step with a counsellor',
    role: 'section' as const,
    tags: ['student', 'course', 'study guide', 'application'],
  },
  {
    id: 'student-success',
    url: '/images/services/success.png',
    alt: 'Student success and education outcomes',
    caption: 'Student journey and success support',
    role: 'section' as const,
    tags: ['scholarship', 'student', 'course', 'success'],
  },
  {
    id: 'english-test',
    url: '/images/services/english-test.png',
    alt: 'Student preparing for an English language test',
    caption: 'English test preparation support',
    role: 'section' as const,
    tags: ['english', 'ielts', 'pte', 'toefl', 'study guide'],
  },
  {
    id: 'visa-support',
    url: '/images/services/visa.png',
    alt: 'Student reviewing study visa documents',
    caption: 'Visa preparation support',
    role: 'section' as const,
    tags: ['visa', 'application', 'student', 'guide'],
  },
] as const;

export const DEFAULT_BUILDER_INPUT: AloBuilderInput = {
  prompt: 'Create a UK study guide for Bangladeshi students interested in Business Management for January 2027.',
  contentType: 'Study Guide',
  country: '',
  university: '',
  course: '',
  subject: '',
  degree: '',
  intake: '',
  audience: 'Bangladeshi students',
  language: 'English',
  tone: 'Professional and encouraging',
  seoTarget: 'UK study guide for Bangladeshi students',
  cta: 'Book a free counselling session',
  publishingStatus: 'DRAFT',
};

const COUNTRY_IMAGE_HINTS: Record<string, string> = {
  uk: 'destination-uk',
  'united kingdom': 'destination-uk',
  britain: 'destination-uk',
  australia: 'destination-australia',
  canada: 'destination-canada',
  usa: 'destination-usa',
  'united states': 'destination-usa',
  ireland: 'destination-ireland',
};

export function slugifyBuilderText(value: string): string {
  return (value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || `alo-guide-${Date.now().toString(36)}`;
}

export function canonicalizeCountry(value: string): string {
  const trimmed = value.trim();
  const key = trimmed.toLowerCase();
  const aliases: Record<string, string> = {
    uk: 'United Kingdom',
    britain: 'United Kingdom',
    'great britain': 'United Kingdom',
    england: 'United Kingdom',
    usa: 'United States',
    us: 'United States',
    america: 'United States',
    uae: 'United Arab Emirates',
    'south korea': 'South Korea',
  };
  return aliases[key] || trimmed;
}

export function parseBuilderPrompt(prompt: string, base: AloBuilderInput): AloBuilderInput {
  const next = { ...base, prompt: prompt.trim() };
  if (!next.country) {
    const countryAliases = ['United Kingdom', 'UK', 'Australia', 'Canada', 'United States', 'USA', 'Ireland', 'New Zealand', 'Germany'];
    const foundCountry = countryAliases.find((name) => new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(prompt));
    if (foundCountry) next.country = canonicalizeCountry(foundCountry);
  }
  if (!next.intake) {
    const intake = prompt.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/i);
    if (intake) next.intake = `${intake[1][0].toUpperCase()}${intake[1].slice(1).toLowerCase()} ${intake[2]}`;
  }
  if (!next.subject && !next.course) {
    const interested = prompt.match(/interested in\s+(.+?)(?:\s+for\s+|\s+in\s+|[.!?]|$)/i);
    if (interested?.[1]) next.subject = interested[1].trim();
  }
  if (!next.audience) {
    const audience = prompt.match(/for\s+(Bangladeshi students|international students|students from Bangladesh)/i);
    if (audience?.[1]) next.audience = audience[1];
  }
  return next;
}

export function recommendedBuilderImages(input: Pick<AloBuilderInput, 'country' | 'contentType' | 'subject'>): BuilderImage[] {
  const countryKey = input.country.trim().toLowerCase();
  const heroId = COUNTRY_IMAGE_HINTS[countryKey] || 'destination-uk';
  const hero = BUILDER_IMAGE_LIBRARY.find((image) => image.id === heroId) || BUILDER_IMAGE_LIBRARY[0];
  const lowerType = `${input.contentType} ${input.subject}`.toLowerCase();
  const supportingId = lowerType.includes('visa')
    ? 'visa-support'
    : lowerType.includes('english') || lowerType.includes('ielts') || lowerType.includes('pte') || lowerType.includes('toefl')
      ? 'english-test'
      : lowerType.includes('scholarship')
        ? 'student-success'
        : 'student-counselling';
  const supporting = BUILDER_IMAGE_LIBRARY.find((image) => image.id === supportingId) || BUILDER_IMAGE_LIBRARY[5];
  return [hero, supporting].map((image) => ({
    id: image.id,
    url: image.url,
    alt: image.alt,
    caption: image.caption,
    source: '',
    license: '',
    width: 0,
    height: 0,
    aspectRatio: 0,
    entityType: image.role === 'hero' ? 'country' : 'ALO Education service',
    verified: false,
    role: image.role,
  }));
}

export function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function statusForRecord(
  verificationStatus: string | null | undefined,
  lastVerifiedAt: string | Date | null | undefined,
  hasValue = true,
): FactStatus {
  if (!hasValue) return 'MISSING';
  const status = (verificationStatus || '').toUpperCase();
  if (status.includes('CONFLICT')) return 'CONFLICTING';
  if (status === 'NOT_APPLICABLE' || status === 'N/A') return 'NOT_APPLICABLE';
  const parsed = lastVerifiedAt ? new Date(lastVerifiedAt) : null;
  if (parsed && !Number.isNaN(parsed.getTime()) && Date.now() - parsed.getTime() > 365 * 24 * 60 * 60 * 1000) return 'OUTDATED';
  if (status === 'VERIFIED') return 'VERIFIED';
  if (status === 'KNOWN') return 'KNOWN';
  return 'RESEARCH_REQUIRED';
}

function check(
  key: string,
  label: string,
  severity: ValidationSeverity,
  message: string,
  score: number,
): BuilderCheck {
  return { key, label, severity, message, score };
}

export function validateBuilderDocument(
  document: AloBuilderDocument,
  options: { duplicate?: boolean; brokenImageIds?: string[]; criticalPage?: boolean } = {},
): BuilderValidation {
  const brokenImageIds = new Set(options.brokenImageIds || []);
  const isCritical = options.criticalPage ?? ['University Page', 'Course Page', 'Country Guide', 'Scholarship Page'].includes(document.contentType);
  const threshold = 80;
  const criticalThreshold = 90;
  const checks: BuilderCheck[] = [];

  const contentWords = [document.hero.description, ...document.sections.map((section) => section.body)].join(' ');
  const introOkay = Boolean(document.title.trim() && document.hero.title.trim() && document.hero.description.trim());
  const sectionsOkay = document.sections.filter((section) => section.title.trim() && section.body.trim()).length >= 2;
  const sectionWordCount = wordCount(contentWords);
  checks.push(check('content-structure', 'Page structure', introOkay && sectionsOkay ? 'PASS' : 'BLOCKER', introOkay && sectionsOkay ? `${document.sections.length} structured sections with hero copy.` : 'Add a title, hero copy and at least two complete sections.', introOkay && sectionsOkay ? 100 : 20));
  checks.push(check('editorial-length', 'Content depth', sectionWordCount >= 90 ? 'PASS' : 'WARNING', `${sectionWordCount} words in hero and sections; concise short-form pages should still be useful and complete.`, Math.min(100, Math.round(sectionWordCount / 1.8))));
  checks.push(check('duplicate', 'Duplicate detection', options.duplicate ? 'BLOCKER' : 'PASS', options.duplicate ? 'A likely equivalent page already exists. Open the existing item instead of creating a duplicate.' : 'No equivalent builder page was found in the current draft and published library.', options.duplicate ? 0 : 100));

  const titleOkay = document.seoTitle.trim().length > 0 && document.seoTitle.length <= 60;
  const descriptionOkay = document.metaDescription.trim().length >= 70 && document.metaDescription.length <= 160;
  const canonicalOkay = /^https:\/\//i.test(document.canonicalUrl) || /^\/(?!\/)/.test(document.canonicalUrl);
  checks.push(check('seo-title', 'SEO title', titleOkay ? 'PASS' : 'BLOCKER', `${document.seoTitle.length}/60 characters.`, titleOkay ? 100 : Math.min(70, document.seoTitle.length)));
  checks.push(check('meta-description', 'Meta description', descriptionOkay ? 'PASS' : 'WARNING', `${document.metaDescription.length}/160 characters; aim for 70–160 characters.`, descriptionOkay ? 100 : Math.min(75, Math.round(document.metaDescription.length / 1.6))));
  checks.push(check('canonical', 'Canonical URL', canonicalOkay ? 'PASS' : 'BLOCKER', canonicalOkay ? 'Canonical URL is present and uses a safe path.' : 'Canonical URL must be an HTTPS URL or a root-relative path.', canonicalOkay ? 100 : 0));

  const sourceBackedFacts = document.facts.filter((fact) => fact.value.trim() && fact.sourceUrl && /^https:\/\//i.test(fact.sourceUrl));
  const verifiedFacts = sourceBackedFacts.filter((fact) => fact.status === 'VERIFIED');
  const missingEvidence = document.facts.filter((fact) => fact.value.trim() && (!fact.sourceUrl || !/^https:\/\//i.test(fact.sourceUrl)));
  const factScore = document.facts.length === 0 ? 45 : Math.round((verifiedFacts.length / Math.max(1, document.facts.length)) * 100);
  checks.push(check('fact-sources', 'Factual source validation', missingEvidence.length === 0 && verifiedFacts.length > 0 ? 'PASS' : 'BLOCKER', document.facts.length === 0 ? 'No database facts are attached. Keep all specific requirements, fees and deadlines unpublished until evidence is added.' : `${verifiedFacts.length} verified, source-linked facts of ${document.facts.length}; ${missingEvidence.length} fact(s) have no source.`, factScore));
  const entityOkay = document.entities.length > 0 && document.entities.every((entity) => Boolean(entity.name && entity.type));
  checks.push(check('entity-validation', 'Entity validation', entityOkay ? 'PASS' : 'BLOCKER', entityOkay ? `${document.entities.length} identified database relationship(s).` : 'At least one matched country, university, course or related database entity is required.', entityOkay ? 100 : 0));

  const imagesOkay = document.images.length >= 2;
  const completeImages = document.images.filter((image) => image.url.startsWith('/images/') && image.alt.trim() && image.source.trim() && image.license.trim() && image.width > 0 && image.height > 0 && image.aspectRatio > 0 && image.verified && !brokenImageIds.has(image.id));
  const broken = document.images.filter((image) => brokenImageIds.has(image.id));
  checks.push(check('image-count', 'Meaningful image coverage', imagesOkay ? 'PASS' : 'BLOCKER', `${document.images.length} selected image(s); each major visual page needs at least two contextual images.`, imagesOkay ? 100 : 20));
  checks.push(check('image-integrity', 'Image integrity & rights', completeImages.length === document.images.length && imagesOkay ? 'PASS' : 'BLOCKER', broken.length ? `${broken.length} broken or unreadable image(s).` : `${completeImages.length}/${document.images.length} images have a valid local file, dimensions, alt text, source, license and human verification.`, document.images.length ? Math.round((completeImages.length / document.images.length) * 100) : 0));

  const linksOkay = document.links.length >= 3 && document.links.every((link) => link.status === 'VALID' && /^\/(?!\/)/.test(link.href));
  checks.push(check('internal-links', 'Internal link graph', linksOkay ? 'PASS' : 'BLOCKER', `${document.links.filter((link) => link.status === 'VALID').length} valid connected links; at least three relevant onward routes are required.`, linksOkay ? 100 : Math.round((document.links.filter((link) => link.status === 'VALID').length / 3) * 100)));
  const breadcrumbsOkay = document.breadcrumbs.length >= 2 && document.breadcrumbs.every((crumb) => crumb.label.trim() && /^\/(?!\/)/.test(crumb.href));
  checks.push(check('breadcrumbs', 'Breadcrumb path', breadcrumbsOkay ? 'PASS' : 'BLOCKER', breadcrumbsOkay ? `${document.breadcrumbs.length} breadcrumb levels.` : 'A valid parent page and root-relative breadcrumb path are required.', breadcrumbsOkay ? 100 : 0));
  const onwardOkay = document.links.some((link) => /apply|consult|counsell|counsel|application/i.test(`${link.label} ${link.href}`));
  checks.push(check('cta-journey', 'Student onward journey', onwardOkay ? 'PASS' : 'WARNING', onwardOkay ? 'A relevant next-step / application journey is included.' : 'Add an application or counselling CTA.', onwardOkay ? 100 : 35));

  const altOkay = document.images.length >= 2 && document.images.every((image) => image.alt.trim().length >= 12);
  const headingsOkay = document.sections.every((section) => section.title.trim().length > 0);
  checks.push(check('accessibility', 'Accessibility basics', altOkay && headingsOkay ? 'PASS' : 'BLOCKER', altOkay && headingsOkay ? 'Images have descriptive alternatives and content sections have titles.' : 'Add descriptive image alternatives and clear section headings.', altOkay && headingsOkay ? 100 : 35));
  const localImagesOkay = document.images.every((image) => image.url.startsWith('/images/'));
  checks.push(check('performance', 'Image performance', localImagesOkay && document.images.length <= 6 ? 'PASS' : 'WARNING', localImagesOkay ? 'Images use local paths; keep the media set focused and compressed.' : 'Only approved local media paths are accepted by the publishing gate.', localImagesOkay ? 100 : 20));

  const categoryScore = (keys: string[]) => Math.round(checks.filter((item) => keys.includes(item.key)).reduce((sum, item) => sum + item.score, 0) / keys.length);
  const categories = {
    content: categoryScore(['content-structure', 'editorial-length']),
    seo: categoryScore(['seo-title', 'meta-description', 'canonical']),
    data: categoryScore(['fact-sources', 'entity-validation']),
    images: categoryScore(['image-count', 'image-integrity']),
    links: categoryScore(['internal-links', 'breadcrumbs', 'cta-journey']),
    accessibility: categoryScore(['accessibility']),
    performance: categoryScore(['performance']),
  };
  const score = Math.round(Object.values(categories).reduce((total, value) => total + value, 0) / Object.values(categories).length);
  const requiredThreshold = isCritical ? criticalThreshold : threshold;
  const hasBlockers = checks.some((item) => item.severity === 'BLOCKER');
  const canSubmit = score >= requiredThreshold && !hasBlockers;
  const canPublish = canSubmit && document.publication.status === 'APPROVED';

  return {
    score,
    threshold,
    criticalThreshold,
    criticalPage: isCritical,
    canSubmit,
    canPublish,
    categories,
    checks,
  };
}

export function parseBuilderDocument(value: string | null | undefined): AloBuilderDocument | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as AloBuilderDocument;
    if (parsed?.schemaVersion === 1 && Array.isArray(parsed.sections) && Array.isArray(parsed.images)) return parsed;
    return null;
  } catch {
    return null;
  }
}
