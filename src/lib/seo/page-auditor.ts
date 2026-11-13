/**
 * Deterministic Technical SEO & Schema.org JSON-LD Auditor (`open-seo` pattern).
 *
 * Honesty contract:
 *   - Every rule evaluates ONLY the supplied HTML / Markdown / JSON-LD input.
 *   - It never claims live Google Search Console indexation, Core Web Vitals,
 *     backlink authority, or SERP rankings.
 *   - Every check returns PASS | WARN | FAIL with measured counts/lengths.
 */

export type SeoCheckStatus = 'PASS' | 'WARN' | 'FAIL';

export interface SeoAuditCheck {
  id: string;
  label: string;
  status: SeoCheckStatus;
  measured: string;
  detail: string;
}

export interface JsonLdAuditSummary {
  totalBlocks: number;
  validBlocks: number;
  detectedTypes: string[];
  errors: string[];
  advisories: string[];
}

export interface SeoPageAuditInput {
  html?: string;
  markdown?: string;
  title?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  jsonLd?: unknown[];
}

export interface SeoPageAuditReport {
  verification: 'deterministic_content_audit_not_search_engine_indexation';
  auditedAt: string;
  summary: {
    passed: number;
    warnings: number;
    failed: number;
    totalChecks: number;
  };
  checks: SeoAuditCheck[];
  jsonLd: JsonLdAuditSummary;
}

const PROHIBITED_GUARANTEE_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: '100% visa guarantee claim', regex: /\b100%\s*(?:visa|approval|success)\b/i },
  { label: 'guaranteed visa claim', regex: /\bguaranteed\s+visa\b/i },
  { label: 'guaranteed admission claim', regex: /\bguaranteed\s+admission\b/i },
  { label: 'guaranteed scholarship claim', regex: /\bguaranteed\s+scholarship\b/i },
  { label: 'zero visa rejection claim', regex: /\b(?:no|zero)\s+visa\s+rejection\b/i },
];

const SCHEMA_REQUIRED_FIELDS: Record<string, string[]> = {
  EducationalOrganization: ['name', 'url'],
  Organization: ['name'],
  CollegeOrUniversity: ['name', 'url'],
  Course: ['name', 'description', 'provider'],
  Article: ['headline', 'datePublished', 'author'],
  BreadcrumbList: ['itemListElement'],
  FAQPage: ['mainEntity'],
};

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}

function extractTitleFromHtml(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeBasicEntities(match[1].replace(/\s+/g, ' ')) : '';
}

function extractMetaContent(html: string, attrName: string, attrValue: string): string {
  const escaped = attrValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const forward = new RegExp(
    `<meta[^>]*\\b${attrName}\\s*=\\s*["']${escaped}["'][^>]*\\bcontent\\s*=\\s*["']([^"']*)["'][^>]*>`,
    'i',
  );
  const reverse = new RegExp(
    `<meta[^>]*\\bcontent\\s*=\\s*["']([^"']*)["'][^>]*\\b${attrName}\\s*=\\s*["']${escaped}["'][^>]*>`,
    'i',
  );
  const hit = html.match(forward) || html.match(reverse);
  return hit ? decodeBasicEntities(hit[1]) : '';
}

function extractCanonicalFromHtml(html: string): string {
  const forward = /<link[^>]*\brel\s*=\s*["']canonical["'][^>]*\bhref\s*=\s*["']([^"']*)["'][^>]*>/i;
  const reverse = /<link[^>]*\bhref\s*=\s*["']([^"']*)["'][^>]*\brel\s*=\s*["']canonical["'][^>]*>/i;
  const hit = html.match(forward) || html.match(reverse);
  return hit ? hit[1].trim() : '';
}

function extractHeadings(html: string, markdown: string): number[] {
  const levels: number[] = [];
  if (html) {
    const regex = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
    for (const match of html.matchAll(regex)) {
      const text = match[2].replace(/<[^>]+>/g, '').trim();
      if (text) levels.push(Number(match[1]));
    }
  }
  if (markdown) {
    for (const line of markdown.split(/\r?\n/)) {
      const m = line.match(/^(#{1,6})\s+\S+/);
      if (m) levels.push(m[1].length);
    }
  }
  return levels;
}

function extractLinks(html: string, markdown: string): string[] {
  const hrefs: string[] = [];
  if (html) {
    for (const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']*)["'][^>]*>/gi)) {
      hrefs.push(m[1].trim());
    }
  }
  if (markdown) {
    for (const m of markdown.matchAll(/(?<!!)\[[^\]]+\]\(([^)\s]+)\)/g)) {
      hrefs.push(m[1].trim());
    }
  }
  return hrefs;
}

function extractImages(html: string, markdown: string): { total: number; missingAlt: number } {
  let total = 0;
  let missingAlt = 0;
  if (html) {
    for (const m of html.matchAll(/<img\b([^>]*)>/gi)) {
      total++;
      const attrs = m[1] || '';
      const altMatch = attrs.match(/\balt\s*=\s*["']([^"']*)["']/i);
      if (!altMatch || !altMatch[1].trim()) missingAlt++;
    }
  }
  if (markdown) {
    for (const m of markdown.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)) {
      total++;
      if (!m[1].trim()) missingAlt++;
    }
  }
  return { total, missingAlt };
}

function extractJsonLdBlocks(html: string, extra?: unknown[]): { parsed: unknown[]; parseErrors: string[] } {
  const parsed: unknown[] = [];
  const parseErrors: string[] = [];

  if (html) {
    const regex = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let index = 0;
    for (const match of html.matchAll(regex)) {
      index++;
      const raw = match[1].trim();
      if (!raw) {
        parseErrors.push(`JSON-LD block #${index} is empty.`);
        continue;
      }
      try {
        parsed.push(JSON.parse(raw));
      } catch {
        parseErrors.push(`JSON-LD block #${index} contains invalid JSON.`);
      }
    }
  }

  if (Array.isArray(extra)) {
    for (const item of extra) parsed.push(item);
  }

  return { parsed, parseErrors };
}

function validateJsonLdNodes(blocks: unknown[], parseErrors: string[]): JsonLdAuditSummary {
  const errors = [...parseErrors];
  const advisories: string[] = [];
  const detectedTypes: string[] = [];
  let validBlocks = 0;

  blocks.forEach((block, idx) => {
    if (!block || typeof block !== 'object') {
      errors.push(`Schema node #${idx + 1} is not a JSON object.`);
      return;
    }
    const obj = block as Record<string, unknown>;
    const ctx = String(obj['@context'] || '');
    if (!ctx.includes('schema.org')) {
      errors.push(`Schema node #${idx + 1} is missing @context "https://schema.org".`);
      return;
    }

    const nodes: Array<Record<string, unknown>> = Array.isArray(obj['@graph'])
      ? (obj['@graph'].filter((n) => n && typeof n === 'object') as Array<Record<string, unknown>>)
      : [obj];

    let blockOk = true;
    for (const node of nodes) {
      const rawType = node['@type'];
      const typeName = Array.isArray(rawType) ? String(rawType[0] || '') : String(rawType || '');
      if (!typeName) {
        errors.push(`Schema node #${idx + 1} is missing @type.`);
        blockOk = false;
        continue;
      }
      detectedTypes.push(typeName);
      const required = SCHEMA_REQUIRED_FIELDS[typeName] || [];
      for (const field of required) {
        const val = node[field];
        const empty =
          val === undefined ||
          val === null ||
          (typeof val === 'string' && !val.trim()) ||
          (Array.isArray(val) && val.length === 0);
        if (empty) {
          errors.push(`${typeName} schema is missing required property "${field}".`);
          blockOk = false;
        }
      }
      if (typeName === 'FAQPage') {
        advisories.push(
          'FAQPage is valid Schema.org for AI/Bing parsers, but Google Search discontinued commercial FAQ rich results.',
        );
      }
    }
    if (blockOk) validBlocks++;
  });

  return {
    totalBlocks: blocks.length + parseErrors.length,
    validBlocks,
    detectedTypes,
    errors,
    advisories,
  };
}

export function auditSeoPage(input: SeoPageAuditInput): SeoPageAuditReport {
  const html = typeof input.html === 'string' ? input.html.slice(0, 500_000) : '';
  const markdown = typeof input.markdown === 'string' ? input.markdown.slice(0, 500_000) : '';
  const checks: SeoAuditCheck[] = [];

  // 1. Title check
  const title = (input.title?.trim() || extractTitleFromHtml(html)).trim();
  if (!title) {
    checks.push({
      id: 'title_tag',
      label: 'Document <title>',
      status: 'FAIL',
      measured: '0 chars',
      detail: 'Missing page title. Provide a descriptive 30–60 character title.',
    });
  } else if (title.length < 30 || title.length > 60) {
    checks.push({
      id: 'title_tag',
      label: 'Document <title>',
      status: 'WARN',
      measured: `${title.length} chars`,
      detail: 'Title exists, but 30–60 characters avoids SERP truncation or thin titles.',
    });
  } else {
    checks.push({
      id: 'title_tag',
      label: 'Document <title>',
      status: 'PASS',
      measured: `${title.length} chars`,
      detail: 'Title length is within the 30–60 character target window.',
    });
  }

  // 2. Meta description check
  const description = (
    input.metaDescription?.trim() || extractMetaContent(html, 'name', 'description')
  ).trim();
  if (!description) {
    checks.push({
      id: 'meta_description',
      label: 'Meta Description',
      status: 'FAIL',
      measured: '0 chars',
      detail: 'Missing meta description. Add a 70–160 character summary.',
    });
  } else if (title && description.toLowerCase() === title.toLowerCase()) {
    checks.push({
      id: 'meta_description',
      label: 'Meta Description',
      status: 'FAIL',
      measured: `${description.length} chars (identical to title)`,
      detail: 'Meta description must not duplicate the page title verbatim.',
    });
  } else if (description.length < 70 || description.length > 160) {
    checks.push({
      id: 'meta_description',
      label: 'Meta Description',
      status: 'WARN',
      measured: `${description.length} chars`,
      detail: 'Meta description should be 70–160 characters for optimal SERP snippet display.',
    });
  } else {
    checks.push({
      id: 'meta_description',
      label: 'Meta Description',
      status: 'PASS',
      measured: `${description.length} chars`,
      detail: 'Meta description length and uniqueness pass.',
    });
  }

  // 3. Canonical URL check
  const canonical = (input.canonicalUrl?.trim() || extractCanonicalFromHtml(html)).trim();
  if (!canonical) {
    checks.push({
      id: 'canonical_url',
      label: 'Canonical URL',
      status: 'WARN',
      measured: 'absent',
      detail: 'No canonical URL specified. Set an HTTPS canonical URL to prevent duplicate parameter indexing.',
    });
  } else {
    let validCanonical = false;
    let cleanCanonical = false;
    try {
      const parsed = new URL(canonical);
      validCanonical = parsed.protocol === 'https:';
      cleanCanonical = !parsed.search && !parsed.hash;
    } catch {
      validCanonical = false;
    }
    if (!validCanonical) {
      checks.push({
        id: 'canonical_url',
        label: 'Canonical URL',
        status: 'FAIL',
        measured: canonical.slice(0, 80),
        detail: 'Canonical URL must be an absolute HTTPS URL.',
      });
    } else if (!cleanCanonical) {
      checks.push({
        id: 'canonical_url',
        label: 'Canonical URL',
        status: 'WARN',
        measured: canonical.slice(0, 80),
        detail: 'Canonical URL contains query parameters or a hash fragment.',
      });
    } else {
      checks.push({
        id: 'canonical_url',
        label: 'Canonical URL',
        status: 'PASS',
        measured: canonical.slice(0, 80),
        detail: 'HTTPS canonical URL without query/fragment pollution.',
      });
    }
  }

  // 4. Heading hierarchy
  const headings = extractHeadings(html, markdown);
  const h1Count = headings.filter((h) => h === 1).length;
  let skippedLevel = false;
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] - headings[i - 1] > 1) {
      skippedLevel = true;
      break;
    }
  }
  if (h1Count === 0) {
    checks.push({
      id: 'heading_hierarchy',
      label: 'Heading Hierarchy (H1–H6)',
      status: 'FAIL',
      measured: `0 H1s, ${headings.length} total headings`,
      detail: 'Every indexable landing or blog page needs exactly one H1 heading.',
    });
  } else if (h1Count > 1 || skippedLevel) {
    checks.push({
      id: 'heading_hierarchy',
      label: 'Heading Hierarchy (H1–H6)',
      status: 'WARN',
      measured: `${h1Count} H1(s), ${headings.length} total headings`,
      detail:
        h1Count > 1
          ? 'Multiple H1 headings found; keep a single primary H1.'
          : 'Heading levels skip a rank (e.g. H1 directly to H3).',
    });
  } else {
    checks.push({
      id: 'heading_hierarchy',
      label: 'Heading Hierarchy (H1–H6)',
      status: 'PASS',
      measured: `1 H1, ${headings.length} total headings`,
      detail: 'Single H1 with sequential subheadings.',
    });
  }

  // 5. Internal links & dead anchors
  const links = extractLinks(html, markdown);
  const deadAnchors = links.filter(
    (href) => href === '' || href === '#' || /^javascript:/i.test(href),
  );
  const internalLinks = links.filter(
    (href) =>
      (href.startsWith('/') && !href.startsWith('//')) ||
      href.startsWith('https://aloeducation.com'),
  );
  if (deadAnchors.length > 0) {
    checks.push({
      id: 'internal_links',
      label: 'Internal Linking & Anchor Safety',
      status: 'FAIL',
      measured: `${internalLinks.length} internal, ${deadAnchors.length} dead/unsafe`,
      detail: 'Found empty, "#" or javascript: anchor hrefs. Replace with crawlable paths.',
    });
  } else if (internalLinks.length < 2) {
    checks.push({
      id: 'internal_links',
      label: 'Internal Linking & Anchor Safety',
      status: 'WARN',
      measured: `${internalLinks.length} internal link(s)`,
      detail: 'Add at least 2 contextual internal links (e.g. /destinations/*, /course-finder, /scholarships).',
    });
  } else {
    checks.push({
      id: 'internal_links',
      label: 'Internal Linking & Anchor Safety',
      status: 'PASS',
      measured: `${internalLinks.length} internal links`,
      detail: 'Contextual internal links present with zero dead anchors.',
    });
  }

  // 6. Image alt text
  const images = extractImages(html, markdown);
  if (images.missingAlt > 0) {
    checks.push({
      id: 'image_alt',
      label: 'Image Alt Attributes',
      status: 'WARN',
      measured: `${images.missingAlt}/${images.total} missing alt`,
      detail: 'Add descriptive alt attributes to all content images for accessibility and image search.',
    });
  } else {
    checks.push({
      id: 'image_alt',
      label: 'Image Alt Attributes',
      status: 'PASS',
      measured: images.total === 0 ? '0 images' : `${images.total}/${images.total} with alt`,
      detail: images.total === 0 ? 'No inline images to check.' : 'All detected images carry alt text.',
    });
  }

  // 7. Schema.org JSON-LD validation
  const { parsed: ldBlocks, parseErrors } = extractJsonLdBlocks(html, input.jsonLd);
  const jsonLdSummary = validateJsonLdNodes(ldBlocks, parseErrors);
  if (jsonLdSummary.errors.length > 0) {
    checks.push({
      id: 'schema_json_ld',
      label: 'Schema.org JSON-LD Structured Data',
      status: 'FAIL',
      measured: `${jsonLdSummary.validBlocks}/${jsonLdSummary.totalBlocks} valid`,
      detail: jsonLdSummary.errors.join(' '),
    });
  } else if (jsonLdSummary.totalBlocks === 0) {
    checks.push({
      id: 'schema_json_ld',
      label: 'Schema.org JSON-LD Structured Data',
      status: 'WARN',
      measured: '0 JSON-LD blocks',
      detail: 'Add Organization, CollegeOrUniversity, Course, Article or BreadcrumbList JSON-LD.',
    });
  } else {
    checks.push({
      id: 'schema_json_ld',
      label: 'Schema.org JSON-LD Structured Data',
      status: 'PASS',
      measured: `${jsonLdSummary.detectedTypes.join(', ')}`,
      detail: 'Structured data blocks parse cleanly and contain required Schema.org properties.',
    });
  }

  // 8. ALO Study-Abroad Compliance Guard (no fake visa/admission guarantees)
  const plainCorpus = `${title} ${description} ${html.replace(/<[^>]+>/g, ' ')} ${markdown}`;
  const violations = PROHIBITED_GUARANTEE_PATTERNS.filter((rule) => rule.regex.test(plainCorpus)).map(
    (rule) => rule.label,
  );
  if (violations.length > 0) {
    checks.push({
      id: 'compliance_guard',
      label: 'ALO Factual & Visa Compliance Guard',
      status: 'FAIL',
      measured: `${violations.length} violation(s)`,
      detail: `Prohibited unverified guarantee detected: ${violations.join(', ')}. Visa and admission decisions belong solely to embassies and universities.`,
    });
  } else {
    checks.push({
      id: 'compliance_guard',
      label: 'ALO Factual & Visa Compliance Guard',
      status: 'PASS',
      measured: '0 violations',
      detail: 'No prohibited visa, admission, or scholarship guarantee phrases detected.',
    });
  }

  const passed = checks.filter((c) => c.status === 'PASS').length;
  const warnings = checks.filter((c) => c.status === 'WARN').length;
  const failed = checks.filter((c) => c.status === 'FAIL').length;

  return {
    verification: 'deterministic_content_audit_not_search_engine_indexation',
    auditedAt: new Date().toISOString(),
    summary: {
      passed,
      warnings,
      failed,
      totalChecks: checks.length,
    },
    checks,
    jsonLd: jsonLdSummary,
  };
}
