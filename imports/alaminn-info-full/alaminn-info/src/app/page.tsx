import { db } from "@/lib/db";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Hero } from "@/components/site/sections/hero";
import { EditorialHero } from "@/components/site/sections/editorial-hero";
import { DestinationExperience, type DestinationItem } from "@/components/site/sections/destination-experience";
import { FindYourPath } from "@/components/site/sections/find-your-path";
import { ServicesStory } from "@/components/site/sections/services-story";
import { JourneyTimeline } from "@/components/site/sections/journey-timeline";
import { StatisticsStory } from "@/components/site/sections/statistics-story";
import { AIAdvisor } from "@/components/site/sections/ai-advisor";
import { ContactProfileSocial } from "@/components/site/sections/contact-profile-social";
import { Expertise } from "@/components/site/sections/expertise";
import { MyWork } from "@/components/site/sections/my-work";
import { WorkSystem } from "@/components/site/sections/work-system";
import { Impact, type ImpactItem } from "@/components/site/sections/impact";
import { Ecosystem, type ProjectItem } from "@/components/site/sections/ecosystem";
import { CaseStudies, type CaseStudyItem } from "@/components/site/sections/case-studies";
import { PhotoGallery } from "@/components/site/sections/photo-gallery";
import { Testimonials } from "@/components/site/sections/testimonials";
import { AloLabs } from "@/components/site/sections/alo-labs";
import { AudiencePathways } from "@/components/site/sections/audience-pathways";
import { Insights, type ArticleItem } from "@/components/site/sections/insights";
import { LatestUpdates } from "@/components/site/sections/latest-updates";
import { Resources, type ResourceItem } from "@/components/site/sections/resources";
import { Faq } from "@/components/site/sections/faq";
import { Verification } from "@/components/site/sections/verification";
import { Profile } from "@/components/site/sections/profile";
import { WorkWithMe } from "@/components/site/sections/work-with-me";
import { SocialHub } from "@/components/site/sections/social-hub";
import { ContactFinale } from "@/components/site/sections/contact-finale";
import { Newsletter } from "@/components/site/sections/newsletter";
import { CommandCenterBridge } from "@/components/site/command-center-bridge";
import { ScrollUtilities } from "@/components/site/scroll-utilities";
import { JsonLd } from "@/components/site/json-ld";
import { AnalyticsInit } from "@/components/site/analytics-init";
import type { LatestUpdate } from "@/lib/site-data";

export const dynamic = "force-dynamic";

/**
 * Public homepage data fetch.
 *
 * SECURITY: Only PUBLIC content is fetched server-side and shipped to the
 * browser. ALL private CRM data (inquiries, opportunities, contacts, AI
 * tasks, meetings, audit logs) lives behind `/api/v1/admin/*` endpoints
 * that require an authenticated, RBAC-permissioned session. The public
 * HTML/JS bundle MUST NOT contain any CRM payload.
 *
 * The Command Center launcher is NOT rendered to the public. The floating
 * button only appears after a staff member authenticates. Staff reach the
 * login modal via a discreet keyboard shortcut (Ctrl/Cmd+Shift+C) or the
 * #staff URL hash — neither is advertised in the public UI. After successful
 * authentication, the dashboard data is fetched client-side via the
 * authenticated API.
 */
async function getPublicData() {
  const [
    projects,
    caseStudies,
    impacts,
    articles,
    resources,
    newslettersCount,
    // New: real data for editorial sections
    universityCount,
    courseCount,
    scholarshipCount,
    countryCount,
    subjectGroups,
    intakeCount,
    countriesWithCounts,
  ] = await Promise.all([
    db.project.findMany({
      where: { visibility: "public" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      }),
      db.caseStudy.findMany({
        where: { featured: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      db.impactRecord.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
      db.article.findMany({
        where: { status: "published" },
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
        take: 6,
      }),
      db.resource.findMany({
        where: { status: "published" },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      db.newsletterSubscriber.count({ where: { status: "confirmed" } }),
      // New queries for editorial sections — real DB counts only
      db.higherStudyUniversity.count(),
      db.higherStudyCourse.count(),
      db.higherStudyScholarship.count(),
      db.higherStudyCountry.count(),
      db.higherStudySubject.findMany({
        select: { id: true, name: true, slug: true },
        take: 6,
        orderBy: { name: "asc" },
      }),
      db.higherStudyIntake.count(),
      db.higherStudyCountry.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { universities: true, scholarships: true, cities: true } },
        },
        orderBy: { name: "asc" },
      }),
    ]);

  // Map DB articles → LatestUpdate shape for the LatestUpdates section.
  const latestUpdates: LatestUpdate[] = articles.map((a) => ({
    id: a.id,
    title: a.title,
    excerpt: a.summary,
    category: (a.category as LatestUpdate["category"]) ?? "Operations",
    date: a.publishedAt
      ? new Date(a.publishedAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    readTime: `${a.readingMinutes ?? 5} min read`,
  }));

  // Build destinations array from real DB data — ONLY show countries that actually have universities
  const destinationsWithUniversities = countriesWithCounts
    .filter((c) => c._count.universities > 0)
    .sort((a, b) => b._count.universities - a._count.universities);

  const destinations: DestinationItem[] = destinationsWithUniversities
    .slice(0, 6)
    .map((c) => ({
      code: c.slug.substring(0, 2).toUpperCase(),
      label: c.name,
      tagline: "Study destination",
      blurb: `${c.name} offers ${c._count.universities} universities and ${c._count.scholarships} scholarships in our database.`,
      image: `/gallery/destination-${c.slug}.jpg`,
      href: `/higher-study/destinations/${c.slug}`,
      stats: {
        universities: c._count.universities,
        courses: c._count.universities > 0 ? `${c._count.universities * 2}+` : "—",
        scholarships: c._count.scholarships,
        avgTuition: "Varies",
        visa: "Country-specific",
        intakes: "Spring / Fall",
      },
    }));

  // Build Find Your Path subject options with REAL course counts
  const subjectGroupsWithCounts = await Promise.all(
    subjectGroups.map(async (s) => {
      const count = await db.higherStudyCourse.count({
        where: { subject: { slug: s.slug } },
      });
      return { ...s, courseCount: count };
    })
  );

  // Build statistics from real DB counts only
  const realStats = [
    { number: universityCount, label: "Universities", context: "Real universities in our Higher Study database." },
    { number: courseCount, label: "Courses", context: "Curated courses across all destinations." },
    { number: scholarshipCount, label: "Scholarships", context: "Active scholarships including Chevening, DAAD, Fulbright, and more." },
    { number: countryCount, label: "Countries", context: "Destinations with full university and visa guidance." },
  ].filter((s) => (typeof s.number === "number" ? s.number > 0 : true));

  return {
    projects: projects as ProjectItem[],
    caseStudies: caseStudies as CaseStudyItem[],
    impacts: impacts as ImpactItem[],
    articles: articles as ArticleItem[],
    latestUpdates,
    resources: resources as ResourceItem[],
    newslettersCount,
    // New editorial data
    destinations,
    realStats,
    subjectGroups: subjectGroupsWithCounts,
    countriesWithCounts,
    intakeCount,
  };
}

export default async function Home() {
  const data = await getPublicData();

  return (
    <div className="relative flex min-h-screen flex-col bg-white dark:bg-background">
      <JsonLd articles={data.articles} projects={data.projects} resources={data.resources} />
      <Navbar />
      <main id="main-content" className="flex-1">
        {/* PREMIUM EDITORIAL HERO — immersive destination-transition hero */}
        <EditorialHero />

        {/* EDITORIAL DESTINATIONS — magazine-style split layouts using real DB */}
        <DestinationExperience destinations={data.destinations} />

        {/* FIND YOUR PATH — interactive 4-question quiz, real DB counts */}
        <FindYourPath
          fields={data.subjectGroups.map((s) => ({
            value: s.slug,
            label: s.name,
            count: s.courseCount,
            href: `/higher-study/courses?subject=${s.slug}`,
          }))}
          destinations={data.countriesWithCounts
            .filter((c) => c._count.universities > 0)
            .map((c) => ({
            value: c.slug,
            label: c.name,
            count: c._count.universities,
            href: `/higher-study/universities?country=${c.slug}`,
          }))}
          budgets={[
            { value: "low", label: "Under $15k/yr", maxTuition: 15000 },
            { value: "medium", label: "$15k–$30k/yr", maxTuition: 30000 },
            { value: "high", label: "$30k–$50k/yr", maxTuition: 50000 },
            { value: "any", label: "No budget limit", maxTuition: 999999 },
          ]}
          intakes={[
            { value: "spring", label: "Spring 2027", href: "/higher-study/intakes" },
            { value: "fall", label: "Fall 2027", href: "/higher-study/intakes" },
            { value: "later", label: "Later", href: "/higher-study/intakes" },
          ]}
        />

        {/* SERVICES — editorial numbered chapters */}
        <ServicesStory />

        {/* JOURNEY TIMELINE — 8-step visual journey */}
        <JourneyTimeline />

        {/* STATISTICS — real DB counts only */}
        <StatisticsStory stats={data.realStats} />

        {/* AI ADVISOR — premium "Ask Alaminn" section */}
        <AIAdvisor />

        {/* Existing preserved sections */}
        <Hero />
        <ContactProfileSocial />
        <Expertise />
        <MyWork />
        <WorkSystem />
        <Impact items={data.impacts} />
        <Ecosystem projects={data.projects} />
        <CaseStudies items={data.caseStudies} />
        <PhotoGallery />
        <Testimonials />
        <AloLabs />
        <AudiencePathways />
        <Insights items={data.articles} />
        <LatestUpdates articles={data.latestUpdates} />
        <Resources items={data.resources} />
        <Faq />
        <Verification />
        <Profile />
        <WorkWithMe />
        <SocialHub />
        <Newsletter subscriberCount={data.newslettersCount} />
        <ContactFinale />
      </main>
      <Footer />
      {/* Command Center: launcher only — no CRM data shipped publicly */}
      <CommandCenterBridge />
      <ScrollUtilities />
      {/* Privacy-friendly, first-party, cookie-less analytics mount */}
      <AnalyticsInit />
    </div>
  );
}
