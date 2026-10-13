import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

/**
 * Dynamic sitemap — enumerates all 89+ routes for SEO.
 *
 * Static routes are listed first (high priority, monthly change).
 * Dynamic routes (universities, courses, scholarships, etc.) are fetched
 * from the database at build time and listed with weekly change frequency.
 *
 * The /api/cron/sitemap-generate endpoint can be wired to ping search
 * engines after a rebuild.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = "https://alaminn.info";
  const now = new Date();

  // ─── Static routes (homepage + main sections) ──────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/expertise`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/impact`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/projects`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/case-studies`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/articles`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/media`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/ecosystem`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/ecosystem/alo-education`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/ecosystem/alo-labs`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/ecosystem/tech360`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${siteUrl}/legal/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/legal/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // ─── Higher Study static routes (16 sections) ──────────────────────────
  const higherStudyRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/higher-study`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/higher-study/destinations`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/higher-study/universities`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/higher-study/uk-universities`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/higher-study/global-universities`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/higher-study/courses`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/higher-study/course-finder`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/higher-study/scholarships`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/higher-study/subjects`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/higher-study/research`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/higher-study/phd-research`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/higher-study/supervisors`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/higher-study/resources`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/higher-study/study-resources`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/higher-study/compare`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/higher-study/saved`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/higher-study/eligibility-check`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/higher-study/application-guide`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/higher-study/book-consultation`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/higher-study/intakes`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/higher-study/apply`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  // ─── English Learning static routes ────────────────────────────────────
  const englishLearningRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/english-learning`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/english-learning/courses`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/english-learning/tutors`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/english-learning/practice-tests`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/english-learning/resources`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/english-learning/eligibility-check`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/english-learning/book-consultation`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/english-learning/book-tutor`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/english-learning/apply`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/english-learning/progress`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
  ];

  // ─── Dynamic routes from database ──────────────────────────────────────
  // Each block is wrapped in try/catch so a DB failure doesn't break the
  // whole sitemap — static routes still get emitted.
  const dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const [universities, courses, scholarships, supervisors, destinations, subjects, research, resources, articles, projects, caseStudies, intakes] = await Promise.all([
      db.higherStudyUniversity.findMany({ where: { publicationStatus: "published" }, select: { slug: true, updatedAt: true } }).catch(() => []),
      db.higherStudyCourse.findMany({ where: { publicationStatus: "published" }, select: { slug: true, updatedAt: true } }).catch(() => []),
      db.higherStudyScholarship.findMany({ where: { publicationStatus: "published" }, select: { slug: true, updatedAt: true } }).catch(() => []),
      db.higherStudySupervisor.findMany({ where: { publicationStatus: "published" }, select: { slug: true, updatedAt: true } }).catch(() => []),
      db.higherStudyCountry.findMany({ select: { slug: true, updatedAt: true } }).catch(() => []),
      db.higherStudySubject.findMany({ select: { slug: true, updatedAt: true } }).catch(() => []),
      db.higherStudyResearchArea.findMany({ select: { slug: true, updatedAt: true } }).catch(() => []),
      db.higherStudyResource.findMany({ where: { publicationStatus: "published" }, select: { slug: true, updatedAt: true } }).catch(() => []),
      db.article.findMany({ where: { status: "published" }, select: { slug: true, publishedAt: true } }).catch(() => []),
      db.project.findMany({ where: { visibility: "public" }, select: { slug: true, updatedAt: true } }).catch(() => []),
      db.caseStudy.findMany({ select: { slug: true, updatedAt: true } }).catch(() => []),
      db.higherStudyIntake.findMany({ select: { slug: true, updatedAt: true } }).catch(() => []),
    ]);

    for (const u of universities) {
      dynamicRoutes.push({
        url: `${siteUrl}/higher-study/universities/${u.slug}`,
        lastModified: u.updatedAt ?? now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const c of courses) {
      dynamicRoutes.push({
        url: `${siteUrl}/higher-study/courses/${c.slug}`,
        lastModified: c.updatedAt ?? now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const s of scholarships) {
      dynamicRoutes.push({
        url: `${siteUrl}/higher-study/scholarships/${s.slug}`,
        lastModified: s.updatedAt ?? now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const sup of supervisors) {
      dynamicRoutes.push({
        url: `${siteUrl}/higher-study/supervisors/${sup.slug}`,
        lastModified: sup.updatedAt ?? now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    for (const d of destinations) {
      dynamicRoutes.push({
        url: `${siteUrl}/higher-study/destinations/${d.slug}`,
        lastModified: d.updatedAt ?? now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
    for (const sub of subjects) {
      dynamicRoutes.push({
        url: `${siteUrl}/higher-study/subjects/${sub.slug}`,
        lastModified: sub.updatedAt ?? now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    for (const r of research) {
      dynamicRoutes.push({
        url: `${siteUrl}/higher-study/research/${r.slug}`,
        lastModified: r.updatedAt ?? now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    for (const res of resources) {
      dynamicRoutes.push({
        url: `${siteUrl}/higher-study/resources/${res.slug}`,
        lastModified: res.updatedAt ?? now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    for (const a of articles) {
      dynamicRoutes.push({
        url: `${siteUrl}/articles/${a.slug}`,
        lastModified: a.publishedAt ?? now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    for (const p of projects) {
      dynamicRoutes.push({
        url: `${siteUrl}/projects/${p.slug}`,
        lastModified: p.updatedAt ?? now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    for (const cs of caseStudies) {
      dynamicRoutes.push({
        url: `${siteUrl}/case-studies/${cs.slug}`,
        lastModified: cs.updatedAt ?? now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    for (const i of intakes) {
      dynamicRoutes.push({
        url: `${siteUrl}/higher-study/intakes/${i.slug}`,
        lastModified: i.updatedAt ?? now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {
    // DB unavailable — return static routes only (still better than 1 entry)
  }

  return [
    ...staticRoutes,
    ...higherStudyRoutes,
    ...englishLearningRoutes,
    ...dynamicRoutes,
  ];
}
