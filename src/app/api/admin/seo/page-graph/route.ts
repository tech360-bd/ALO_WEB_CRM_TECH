import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { parseBuilderDocument } from '@/lib/alo-short-form-builder';
import { getAllCountrySlugs, getCountryDestination } from '@/lib/country-destinations-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const RECORD_CAP = 5001;
const EDGE_CAP = 15001;
const COLLECTIONS = [
  { path: '/destinations', title: 'Study destinations', kind: 'COLLECTION' },
  { path: '/universities', title: 'Universities', kind: 'COLLECTION' },
  { path: '/courses', title: 'Courses', kind: 'COLLECTION' },
  { path: '/course-finder', title: 'Course finder', kind: 'COLLECTION' },
  { path: '/scholarships', title: 'Scholarships', kind: 'COLLECTION' },
  { path: '/blog', title: 'Study-abroad blog', kind: 'COLLECTION' },
  { path: '/guides', title: 'Published study guides', kind: 'COLLECTION' },
] as const;

type GraphNode = {
  path: string;
  kind: string;
  title: string;
  id: string;
  aliases: string[];
  countrySlug?: string;
  universitySlug?: string;
  universityId?: string;
  courseSlug?: string;
  seoTitle: boolean;
  metaDescription: boolean;
  canonical: boolean;
  image: boolean;
  imageAlt: boolean;
  links: number;
  parentPath?: string;
  incoming: number;
  outgoing: number;
  related: number;
  parentLinked: boolean;
  health: number;
  issues: string[];
};

type GraphEdge = { source: string; target: string; type: string; origin: string };

function isAdmin(auth: AuthContext) {
  const roles = new Set(auth.roles.map((role) => role.toLowerCase()));
  return roles.has('admin') || roles.has('super_admin') || ['admin', 'super_admin'].includes(auth.userType.toLowerCase());
}

function cleanSlug(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function routePath(value: string | null | undefined, fallback: string) {
  const candidate = String(value || '').trim();
  if (!candidate) return fallback;
  try {
    const url = new URL(candidate, 'https://aloeducation.com');
    if (url.origin !== 'https://aloeducation.com') return fallback;
    return url.pathname.replace(/\/+$/, '') || '/';
  } catch {
    return fallback;
  }
}

function parseArray(value: string | null | undefined): any[] {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeKind(value: string) {
  const kind = String(value || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (kind.includes('UNIVERSITY')) return 'UNIVERSITY';
  if (kind.includes('COURSE')) return 'COURSE';
  if (kind.includes('COUNTRY') || kind.includes('DESTINATION')) return 'COUNTRY';
  if (kind.includes('SCHOLARSHIP')) return 'SCHOLARSHIP';
  if (kind.includes('BLOG') || kind.includes('ARTICLE')) return 'BLOG';
  if (kind.includes('CONTENT') || kind.includes('GUIDE') || kind.includes('RESOURCE')) return 'GUIDE';
  return kind;
}

function countScore(node: GraphNode) {
  let score = 100;
  if (node.incoming === 0) score -= 20;
  if (node.outgoing === 0) score -= 15;
  if (!node.parentLinked) score -= 15;
  if (node.related === 0) score -= 10;
  if (!node.seoTitle) score -= 10;
  if (!node.metaDescription) score -= 10;
  if (!node.canonical) score -= 10;
  if (!node.image) score -= 5;
  if (node.image && !node.imageAlt) score -= 5;
  return Math.max(0, score);
}

function extractInternalPaths(value: unknown, paths = new Set<string>(), depth = 0): Set<string> {
  if (depth > 8 || value == null) return paths;
  if (typeof value === 'string') {
    const matches = value.matchAll(/(?:href|url|path)\s*["']?\s*[:=]\s*["'](\/(?!\/)[^"'#?\s]*)["']/gi);
    for (const match of matches) paths.add(match[1]);
    return paths;
  }
  if (Array.isArray(value)) {
    for (const item of value) extractInternalPaths(item, paths, depth + 1);
    return paths;
  }
  if (typeof value === 'object') {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (typeof item === 'string' && ['href', 'url', 'path'].includes(key.toLowerCase()) && item.startsWith('/') && !item.startsWith('//')) {
        paths.add(item.split(/[?#]/)[0]);
      } else {
        extractInternalPaths(item, paths, depth + 1);
      }
    }
  }
  return paths;
}

export const GET = withAuth(async (request: Request, auth: AuthContext) => {
  if (!isAdmin(auth)) return NextResponse.json({ success: false, error: 'Admin access is required.' }, { status: 403 });

  const url = new URL(request.url);
  const view = url.searchParams.get('view') === 'links' ? 'links' : 'graph';
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(10, Number.parseInt(url.searchParams.get('limit') || '25', 10) || 25));
  const query = (url.searchParams.get('q') || '').trim().toLowerCase();
  const issueFilter = url.searchParams.get('issue') || 'all';
  const kindFilter = normalizeKind(url.searchParams.get('kind') || '');

  try {
    const [
      countryPages, universityPages, coursePages, crmUniversities, crmCourses,
      builderAssets, blogPosts, scholarships, relationships,
      countryTotal, universityPageTotal, coursePageTotal, crmUniversityTotal, crmCourseTotal,
      assetTotal, blogTotal, scholarshipTotal, relationshipTotal,
    ] = await Promise.all([
      db.countryPage.findMany({ where: { approvalStatus: 'PUBLISHED' }, take: RECORD_CAP, select: { id: true, slug: true, name: true, sourceUrl: true, lastVerifiedAt: true, verificationStatus: true, approvalStatus: true } }),
      db.universityPage.findMany({ where: { approvalStatus: 'PUBLISHED' }, take: RECORD_CAP, select: { id: true, slug: true, name: true, countrySlug: true, overview: true, sourceUrl: true, lastVerifiedAt: true, verificationStatus: true, approvalStatus: true } }),
      db.coursePage.findMany({ where: { approvalStatus: 'PUBLISHED' }, take: RECORD_CAP, select: { id: true, slug: true, name: true, universitySlug: true, countrySlug: true, overview: true, sourceUrl: true, lastVerifiedAt: true, verificationStatus: true, approvalStatus: true } }),
      db.crmUniversity.findMany({ where: { status: 'active', verificationStatus: 'VERIFIED', publicationStatus: { in: ['published', 'PUBLISHED'] } }, take: RECORD_CAP, select: { id: true, universityId: true, slug: true, name: true, country: true, city: true, officialUrl: true, sourceUrl: true, logo: true, heroImageSourceUrl: true, verificationStatus: true, publicationStatus: true } }),
      db.crmCourse.findMany({ where: { status: 'active', verificationStatus: 'VERIFIED', publicationStatus: { in: ['published', 'PUBLISHED'] } }, take: RECORD_CAP, select: { id: true, courseId: true, slug: true, courseTitle: true, universityId: true, country: true, officialUrl: true, sourceUrl: true, verificationStatus: true, publicationStatus: true, university: { select: { slug: true, name: true, country: true } } } }),
      db.contentAsset.findMany({ where: { status: 'PUBLISHED', contentType: 'ALO_PAGE' }, take: RECORD_CAP, select: { id: true, slug: true, title: true, body: true, tags: true, metaTitle: true, metaDescription: true, canonicalUrl: true, publishedUrl: true } }),
      db.blogPost.findMany({ where: { status: 'PUBLISHED' }, take: RECORD_CAP, select: { id: true, slug: true, title: true, excerpt: true, content: true, coverImage: true, status: true } }),
      db.scholarship.findMany({ where: { status: { in: ['active', 'PUBLISHED'] }, verificationStatus: { in: ['verified', 'VERIFIED'] } }, take: RECORD_CAP, select: { id: true, slug: true, name: true, countrySlug: true, universitySlug: true, courseSlug: true, sourceUrl: true, officialSourceUrl: true, seoTitle: true, seoDescription: true, canonicalUrl: true, verificationStatus: true } }),
      db.contentRelationship.findMany({ where: { status: 'ACTIVE' }, take: EDGE_CAP, select: { id: true, sourceType: true, sourceId: true, targetType: true, targetId: true, relationshipType: true } }),
      db.countryPage.count({ where: { approvalStatus: 'PUBLISHED' } }),
      db.universityPage.count({ where: { approvalStatus: 'PUBLISHED' } }),
      db.coursePage.count({ where: { approvalStatus: 'PUBLISHED' } }),
      db.crmUniversity.count({ where: { status: 'active', verificationStatus: 'VERIFIED', publicationStatus: { in: ['published', 'PUBLISHED'] } } }),
      db.crmCourse.count({ where: { status: 'active', verificationStatus: 'VERIFIED', publicationStatus: { in: ['published', 'PUBLISHED'] } } }),
      db.contentAsset.count({ where: { status: 'PUBLISHED', contentType: 'ALO_PAGE' } }),
      db.blogPost.count({ where: { status: 'PUBLISHED' } }),
      db.scholarship.count({ where: { status: { in: ['active', 'PUBLISHED'] }, verificationStatus: { in: ['verified', 'VERIFIED'] } } }),
      db.contentRelationship.count({ where: { status: 'ACTIVE' } }),
    ]);

    const nodes = new Map<string, GraphNode>();
    const typedAliases = new Map<string, string>();
    const pathAliases = new Map<string, string>();
    const edges: GraphEdge[] = [];
    const edgeKeys = new Set<string>();
    const rawUnresolved: Array<{ sourceType: string; sourceId: string; targetType: string; targetId: string; relationshipType: string }> = [];
    const pendingInternalLinks: Array<{ sourcePath: string; targetPath: string; relationshipType: string; origin: string; sourceType: string; sourceId: string }> = [];
    const guideParentHints: Array<{ sourcePath: string; parentHint: string; sourceId: string }> = [];
    const blogPathById = new Map<string, string>();

    const addNode = (input: Omit<GraphNode, 'incoming' | 'outgoing' | 'related' | 'parentLinked' | 'health' | 'issues'>) => {
      const existing = nodes.get(input.path);
      const node = existing ? {
        ...existing,
        ...input,
        aliases: [...new Set([...existing.aliases, ...input.aliases])],
        seoTitle: existing.seoTitle || input.seoTitle,
        metaDescription: existing.metaDescription || input.metaDescription,
        canonical: existing.canonical || input.canonical,
        image: existing.image || input.image,
        imageAlt: existing.imageAlt || input.imageAlt,
        links: Math.max(existing.links, input.links),
        parentPath: existing.parentPath || input.parentPath,
      } : { ...input, incoming: 0, outgoing: 0, related: 0, parentLinked: false, health: 0, issues: [] };
      nodes.set(input.path, node);
      const addAlias = (alias: string) => {
        if (!alias) return;
        const normalized = alias.trim().toLowerCase();
        if (!normalized) return;
        pathAliases.set(normalized, input.path);
      };
      addAlias(input.path);
      for (const alias of input.aliases) addAlias(alias);
      for (const alias of input.aliases) typedAliases.set(alias.toLowerCase(), input.path);
      return node;
    };

    const addEdge = (source: string, target: string, type: string, origin: string) => {
      if (!nodes.has(source) || !nodes.has(target)) return;
      const normalizedType = String(type || 'related').toLowerCase();
      const key = `${source}\u0000${target}\u0000${normalizedType}`;
      if (edgeKeys.has(key)) return;
      edgeKeys.add(key);
      edges.push({ source, target, type: normalizedType, origin });
    };

    for (const collection of COLLECTIONS) {
      addNode({ path: collection.path, kind: 'COLLECTION', title: collection.title, id: collection.path, aliases: [collection.path], seoTitle: true, metaDescription: true, canonical: true, image: true, imageAlt: true, links: 0 });
    }
    addNode({ path: '/', kind: 'HOME', title: 'ALO Education home page', id: 'home', aliases: ['/'], seoTitle: true, metaDescription: true, canonical: true, image: true, imageAlt: true, links: 0 });
    for (const collection of COLLECTIONS) addEdge('/', collection.path, 'navigation', 'site route map');

    const countrySlugs = new Set<string>();
    for (const { slug } of getAllCountrySlugs()) {
      const country = getCountryDestination(slug);
      if (!country) continue;
      countrySlugs.add(slug);
      const path = `/destinations/${slug}`;
      addNode({ path, kind: 'COUNTRY', title: country.name, id: slug, aliases: [`COUNTRY:${slug}`, `COUNTRY:${country.name.toLowerCase()}`, slug], countrySlug: slug, parentPath: '/destinations', seoTitle: hasText(country.seoTitle), metaDescription: hasText(country.seoDescription), canonical: hasText(country.canonicalUrl), image: false, imageAlt: false, links: 0 });
      addEdge('/destinations', path, 'parent', 'destination index');
    }

    for (const country of countryPages) {
      const slug = cleanSlug(country.slug);
      const path = `/destinations/${slug}`;
      const exists = countrySlugs.has(slug);
      const staticCountry = exists ? getCountryDestination(slug) : null;
      addNode({ path, kind: 'COUNTRY', title: country.name || staticCountry?.name || slug, id: country.id, aliases: [`COUNTRY:${country.id}`, `COUNTRY:${slug}`, `COUNTRY:${country.name.toLowerCase()}`, slug], countrySlug: slug, parentPath: '/destinations', seoTitle: Boolean(staticCountry?.seoTitle), metaDescription: Boolean(staticCountry?.seoDescription), canonical: Boolean(staticCountry?.canonicalUrl), image: false, imageAlt: false, links: 0 });
      addEdge('/destinations', path, 'parent', 'published destination record');
    }

    const universityCountryBySlug = new Map<string, string>();
    const universityIdBySlug = new Map<string, string>();
    for (const university of universityPages) {
      const slug = cleanSlug(university.slug);
      const path = `/universities/${slug}`;
      universityCountryBySlug.set(slug, cleanSlug(university.countrySlug));
      addNode({ path, kind: 'UNIVERSITY', title: university.name, id: university.id, aliases: [`UNIVERSITY:${university.id}`, `UNIVERSITY:${slug}`, slug], countrySlug: cleanSlug(university.countrySlug), universitySlug: slug, parentPath: `/destinations/${cleanSlug(university.countrySlug)}`, seoTitle: hasText(university.name), metaDescription: hasText(university.overview), canonical: true, image: false, imageAlt: false, links: 0 });
    }
    for (const university of crmUniversities) {
      const slug = cleanSlug(university.slug || university.universityId);
      const path = `/universities/${slug}`;
      const countrySlug = cleanSlug(university.country);
      universityCountryBySlug.set(slug, countrySlug);
      universityIdBySlug.set(cleanSlug(university.universityId), slug);
      addNode({ path, kind: 'UNIVERSITY', title: university.name, id: university.id, aliases: [`UNIVERSITY:${university.id}`, `UNIVERSITY:${university.universityId}`, `UNIVERSITY:${slug}`, slug], countrySlug, universitySlug: slug, universityId: cleanSlug(university.universityId), parentPath: `/destinations/${countrySlug}`, seoTitle: hasText(university.name), metaDescription: true, canonical: true, image: hasText(university.logo) || hasText(university.heroImageSourceUrl), imageAlt: hasText(university.name) && (hasText(university.logo) || hasText(university.heroImageSourceUrl)), links: 0 });
    }

    const courseUniversityBySlug = new Map<string, string>();
    for (const course of coursePages) {
      const slug = cleanSlug(course.slug);
      const path = `/course/${slug}`;
      courseUniversityBySlug.set(slug, cleanSlug(course.universitySlug));
      addNode({ path, kind: 'COURSE', title: course.name, id: course.id, aliases: [`COURSE:${course.id}`, `COURSE:${slug}`, `/courses/${slug}`, slug], countrySlug: cleanSlug(course.countrySlug), universitySlug: cleanSlug(course.universitySlug), courseSlug: slug, parentPath: `/universities/${cleanSlug(course.universitySlug)}`, seoTitle: hasText(course.name), metaDescription: hasText(course.overview), canonical: true, image: false, imageAlt: false, links: 0 });
    }
    for (const course of crmCourses) {
      const slug = cleanSlug(course.slug || course.courseId);
      const path = `/course/${slug}`;
      const universitySlug = cleanSlug(course.university?.slug || universityIdBySlug.get(cleanSlug(course.universityId)) || '');
      courseUniversityBySlug.set(slug, universitySlug);
      addNode({ path, kind: 'COURSE', title: course.courseTitle, id: course.id, aliases: [`COURSE:${course.id}`, `COURSE:${course.courseId}`, `COURSE:${slug}`, `/courses/${slug}`, slug], countrySlug: cleanSlug(course.country || course.university?.country), universitySlug, universityId: cleanSlug(course.universityId), courseSlug: slug, parentPath: universitySlug ? `/universities/${universitySlug}` : '/courses', seoTitle: hasText(course.courseTitle), metaDescription: true, canonical: true, image: false, imageAlt: false, links: 0 });
    }

    for (const scholarship of scholarships) {
      const slug = cleanSlug(scholarship.slug);
      const path = `/scholarships/${slug}`;
      addNode({ path, kind: 'SCHOLARSHIP', title: scholarship.name, id: scholarship.id, aliases: [`SCHOLARSHIP:${scholarship.id}`, `SCHOLARSHIP:${slug}`, slug], countrySlug: cleanSlug(scholarship.countrySlug), universitySlug: cleanSlug(scholarship.universitySlug), courseSlug: cleanSlug(scholarship.courseSlug), parentPath: '/scholarships', seoTitle: hasText(scholarship.seoTitle || scholarship.name), metaDescription: hasText(scholarship.seoDescription), canonical: hasText(scholarship.canonicalUrl), image: false, imageAlt: false, links: 0 });
      addEdge('/scholarships', path, 'parent', 'scholarship index');
    }

    const pageAssetPaths = new Map<string, string>();
    for (const asset of builderAssets) {
      const tags = parseArray(asset.tags).filter((tag) => typeof tag === 'string');
      const doc = parseBuilderDocument(asset.body);
      const isBuilderGuide = tags.includes('alo-short-form-builder') && doc !== null && doc.images.length >= 2;
      if (!isBuilderGuide) continue;
      const path = routePath(asset.publishedUrl, `/guides/${asset.slug}`);
      pageAssetPaths.set(asset.id, path);
      addNode({ path, kind: 'GUIDE', title: asset.title, id: asset.id, aliases: [`GUIDE:${asset.id}`, `GUIDE:${asset.slug}`, asset.slug], parentPath: doc.breadcrumbs.filter((crumb) => crumb.href !== path).at(-1)?.href || '/', seoTitle: hasText(asset.metaTitle || doc?.seoTitle), metaDescription: hasText(asset.metaDescription || doc?.metaDescription), canonical: hasText(asset.canonicalUrl || doc?.canonicalUrl), image: Boolean(doc?.images.some((image) => image.verified && hasText(image.url))), imageAlt: Boolean(doc?.images.some((image) => image.verified && hasText(image.alt))), links: doc?.links.length || 0 });
      guideParentHints.push({ sourcePath: path, parentHint: doc.breadcrumbs.filter((crumb) => crumb.href !== path).at(-1)?.href || '/', sourceId: asset.id });
      for (const link of doc?.links || []) {
        if (link.href.startsWith('/') && !link.href.startsWith('//')) {
          pendingInternalLinks.push({ sourcePath: path, targetPath: link.href.split(/[?#]/)[0], relationshipType: link.relationship || 'related', origin: 'builder internal link', sourceType: 'GUIDE', sourceId: asset.id });
        }
      }
    }

    for (const post of blogPosts) {
      const path = `/blog/${cleanSlug(post.slug)}`;
      blogPathById.set(post.id, path);
      addNode({ path, kind: 'BLOG', title: post.title, id: post.id, aliases: [`BLOG:${post.id}`, `BLOG:${post.slug}`, post.slug], parentPath: '/blog', seoTitle: hasText(post.title), metaDescription: hasText(post.excerpt), canonical: true, image: hasText(post.coverImage), imageAlt: false, links: 0 });
      const linkedPaths = extractInternalPaths(post.content);
      for (const linkedPath of linkedPaths) pendingInternalLinks.push({ sourcePath: path, targetPath: linkedPath, relationshipType: 'related', origin: 'blog content link', sourceType: 'BLOG', sourceId: post.id });
    }

    for (const university of nodes.values()) {
      if (university.kind !== 'UNIVERSITY') continue;
      const countryPath = university.countrySlug ? `/destinations/${university.countrySlug}` : '';
      const parent = countryPath && nodes.has(countryPath) ? countryPath : '/universities';
      addEdge(parent, university.path, 'parent', 'route and country relationship');
      addEdge(university.path, parent, 'breadcrumb', 'route hierarchy');
    }
    for (const course of nodes.values()) {
      if (course.kind !== 'COURSE') continue;
      const universityPath = course.universitySlug ? `/universities/${course.universitySlug}` : '';
      const countryPath = course.countrySlug ? `/destinations/${course.countrySlug}` : '';
      const parent = universityPath && nodes.has(universityPath) ? universityPath : '/courses';
      addEdge(parent, course.path, 'parent', 'university-course relationship');
      addEdge(course.path, parent, 'breadcrumb', 'route hierarchy');
      if (countryPath && nodes.has(countryPath)) addEdge(course.path, countryPath, 'related', 'course destination');
    }
    for (const [slug, countrySlug] of universityCountryBySlug) {
      const universityPath = `/universities/${slug}`;
      const countryPath = countrySlug ? `/destinations/${countrySlug}` : '';
      if (countryPath && nodes.has(countryPath)) addEdge(countryPath, universityPath, 'related', 'country-university relationship');
    }
    for (const scholarship of nodes.values()) {
      if (scholarship.kind !== 'SCHOLARSHIP') continue;
      const countryPath = scholarship.countrySlug ? `/destinations/${scholarship.countrySlug}` : '';
      const universityPath = scholarship.universitySlug ? `/universities/${scholarship.universitySlug}` : '';
      const coursePath = scholarship.courseSlug ? `/course/${scholarship.courseSlug}` : '';
      if (countryPath && nodes.has(countryPath)) addEdge(countryPath, scholarship.path, 'related', 'scholarship destination');
      if (universityPath && nodes.has(universityPath)) addEdge(universityPath, scholarship.path, 'related', 'scholarship university');
      if (coursePath && nodes.has(coursePath)) addEdge(coursePath, scholarship.path, 'related', 'scholarship course');
      addEdge(scholarship.path, '/scholarships', 'breadcrumb', 'route hierarchy');
    }

    for (const guide of guideParentHints) {
      const parentHint = guide.parentHint.toLowerCase();
      const parent = pathAliases.get(parentHint) || (nodes.has(parentHint) ? parentHint : '/');
      if (parent !== guide.sourcePath) {
        addEdge(parent, guide.sourcePath, 'parent', 'builder breadcrumb hierarchy');
        addEdge(guide.sourcePath, parent, 'breadcrumb', 'builder breadcrumb hierarchy');
      }
    }
    for (const post of blogPosts) {
      const postPath = blogPathById.get(post.id);
      if (postPath) addEdge('/blog', postPath, 'parent', 'blog index');
    }
    for (const link of pendingInternalLinks) {
      const targetHint = link.targetPath.split(/[?#]/)[0].toLowerCase();
      const target = pathAliases.get(targetHint) || (nodes.has(targetHint) ? targetHint : null);
      if (target) addEdge(link.sourcePath, target, link.relationshipType, link.origin);
      else rawUnresolved.push({ sourceType: link.sourceType, sourceId: link.sourceId, targetType: 'PATH', targetId: link.targetPath, relationshipType: link.relationshipType });
    }

    const resolveAlias = (type: string, id: string) => {
      const kind = normalizeKind(type);
      const cleanId = String(id || '').trim().toLowerCase();
      return typedAliases.get(`${kind}:${cleanId}`) || typedAliases.get(`${String(type).toLowerCase()}:${cleanId}`) || pathAliases.get(cleanId) || null;
    };
    for (const relationship of relationships) {
      const source = resolveAlias(relationship.sourceType, relationship.sourceId);
      const target = resolveAlias(relationship.targetType, relationship.targetId);
      if (source && target) addEdge(source, target, relationship.relationshipType, 'content relationship');
      else if (source) rawUnresolved.push({ sourceType: relationship.sourceType, sourceId: relationship.sourceId, targetType: relationship.targetType, targetId: relationship.targetId, relationshipType: relationship.relationshipType });
    }

    const incomingCount = new Map<string, number>();
    const outgoingCount = new Map<string, number>();
    const relatedCount = new Map<string, number>();
    const parentSet = new Set<string>();
    const adjacency = new Map<string, Set<string>>();
    for (const edge of edges) {
      outgoingCount.set(edge.source, (outgoingCount.get(edge.source) || 0) + 1);
      incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1);
      if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set());
      adjacency.get(edge.source)!.add(edge.target);
      if (edge.type === 'parent' || edge.type === 'breadcrumb') parentSet.add(edge.target);
      if (!['parent', 'breadcrumb', 'navigation'].includes(edge.type)) {
        relatedCount.set(edge.source, (relatedCount.get(edge.source) || 0) + 1);
        relatedCount.set(edge.target, (relatedCount.get(edge.target) || 0) + 1);
      }
    }

    const allNodes = [...nodes.values()].filter((node) => !['COLLECTION', 'HOME'].includes(node.kind)).map((node) => {
      node.incoming = incomingCount.get(node.path) || 0;
      node.outgoing = outgoingCount.get(node.path) || 0;
      node.related = relatedCount.get(node.path) || 0;
      node.parentLinked = parentSet.has(node.path);
      node.health = countScore(node);
      node.issues = [];
      if (node.incoming === 0) node.issues.push('zero-incoming');
      if (node.outgoing === 0) node.issues.push('zero-outgoing');
      if (!node.parentLinked) node.issues.push('missing-parent');
      if (node.related === 0) node.issues.push('missing-related');
      if (!node.seoTitle || !node.metaDescription || !node.canonical) node.issues.push('seo-gap');
      if (!node.image) node.issues.push('missing-image');
      return node;
    });

    const unresolvedLinks = rawUnresolved.map((entry) => {
      const source = resolveAlias(entry.sourceType, entry.sourceId) || (entry.sourceType === 'GUIDE' ? pageAssetPaths.get(entry.sourceId) : undefined) || (entry.sourceType === 'BLOG' ? blogPathById.get(entry.sourceId) : undefined);
      return { ...entry, sourcePath: source || 'Unknown source', targetPath: entry.targetId, issue: entry.targetType === 'PATH' ? 'target route is not in the published route index' : 'target entity is not in the published route index' };
    });
    const selfLinks = edges.filter((edge) => edge.source === edge.target).map((edge) => ({ sourcePath: edge.source, targetPath: edge.target, type: edge.type, origin: edge.origin, issue: 'self-link / redirect-loop candidate' }));
    const linkIssues = [...unresolvedLinks, ...selfLinks];

    let filtered = view === 'links' ? linkIssues.map((item: any, index) => ({ ...item, id: `${item.sourcePath}:${item.targetPath}:${index}`, kind: 'LINK' })) : allNodes;
    if (kindFilter && kindFilter !== 'ALL') filtered = filtered.filter((item: any) => normalizeKind(item.kind || item.sourceType) === kindFilter);
    if (issueFilter !== 'all' && view === 'graph') filtered = filtered.filter((item: any) => item.issues.includes(issueFilter));
    if (query) filtered = filtered.filter((item: any) => `${item.title || ''} ${item.path || item.sourcePath || ''} ${item.kind || item.sourceType || ''} ${item.targetPath || ''} ${(item.issues || []).join(' ')}`.toLowerCase().includes(query));
    filtered.sort((a: any, b: any) => view === 'links' ? String(a.sourcePath).localeCompare(String(b.sourcePath)) : a.health - b.health || a.path.localeCompare(b.path));

    const total = filtered.length;
    const items = filtered.slice((page - 1) * limit, page * limit);
    const countOf = (kind: string) => allNodes.filter((node) => node.kind === kind).length;
    const coreNodes = allNodes.filter((node) => ['UNIVERSITY', 'COURSE', 'COUNTRY'].includes(node.kind));
    const parentMissing = allNodes.filter((node) => !node.parentLinked).length;
    const orphanCount = allNodes.filter((node) => node.incoming === 0).length;
    const outgoingEmpty = allNodes.filter((node) => node.outgoing === 0).length;
    const relatedEmpty = allNodes.filter((node) => node.related === 0).length;
    const seoGaps = allNodes.filter((node) => !node.seoTitle || !node.metaDescription || !node.canonical).length;
    const missingImages = allNodes.filter((node) => !node.image).length;
    const scannedByModel = [countryTotal, universityPageTotal, coursePageTotal, crmUniversityTotal, crmCourseTotal, assetTotal, blogTotal, scholarshipTotal];
    const seenByModel = [countryPages.length, universityPages.length, coursePages.length, crmUniversities.length, crmCourses.length, builderAssets.length, blogPosts.length, scholarships.length];
    const scanLimited = seenByModel.some((count) => count >= RECORD_CAP) || relationshipTotal >= EDGE_CAP;

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      view,
      scope: 'Published, verified database records and public routes indexed from ALO data models. This is a graph/data audit, not a successful HTTP crawl or proof of external-link availability.',
      crawlStatus: 'NOT_CRAWLED',
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: {
        publishedRouteNodes: allNodes.length,
        corePages: coreNodes.length,
        universities: countOf('UNIVERSITY'),
        courses: countOf('COURSE'),
        destinations: countOf('COUNTRY'),
        guides: countOf('GUIDE'),
        scholarships: countOf('SCHOLARSHIP'),
        blogPosts: countOf('BLOG'),
        zeroIncomingLinks: orphanCount,
        zeroOutgoingLinks: outgoingEmpty,
        missingParentOrBreadcrumb: parentMissing,
        missingRelatedContent: relatedEmpty,
        seoGaps,
        missingImportantImages: missingImages,
        brokenInternalTargets: unresolvedLinks.length,
        selfLinkCandidates: selfLinks.length,
        relationshipsIndexed: edges.length,
        relationshipRecords: relationshipTotal,
        sourceRows: scannedByModel.reduce((sum, count) => sum + count, 0),
        scanLimited,
        validatedHttpRoutes: 0,
        crawlReleaseGate: 'NOT_RUN',
      },
      items,
    });
  } catch (error) {
    console.error('[admin/seo/page-graph] error', error);
    return NextResponse.json({ success: false, error: 'Page graph data could not be loaded. Check database connectivity and migrations.' }, { status: 500 });
  }
});
